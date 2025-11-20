import { Awareness } from "y-protocols/awareness.js";
import * as Y from 'yjs';
import type { DocumentID } from '@shared/connection/Document';
import { StorageProvider } from './StorageProvider';
import type { Connection } from '../Connection';
import { AwarenessClientID, AwarenessUpdateMessage } from '@shared/connection/messages/awareness';
import { deepEqual } from "@shared/util";

/**
 * A server-side Yjs document container that tracks open connections and
 * automatically unloads when no clients are using it. Documents are saved via a
 * StorageProvider implementation.
 *
 * Documents are singletons by DocumentID and must be accessed via
 * DocumentContainer.getInstance(id, dataStore) so they can do reference counting.
 */
export class DocumentContainer {
    private static instances: Map<DocumentID, DocumentContainer> = new Map();

    private connections: Set<Connection> = new Set();

    private doc: Y.Doc;
    private awareness: Awareness;

    private provider: StorageProvider;
    private closingTimeout: NodeJS.Timeout | null = null;

    /**
     * Create or get a DocumentContainer singleton for a given ID.
     * When a connection opens the doc, addConnection should be called. When it
     * closes, removeConnection must be called so the reference counting is
     * accurate.
     */
    public static async getInstance(id: DocumentID, provider: StorageProvider): Promise<DocumentContainer> {
        let instance = this.instances.get(id);
        if(!instance) {
            instance = new DocumentContainer(id, provider);
            this.instances.set(id, instance);
            await instance.load();
        }
        return instance;
    }

    public static getExistingInstance(id: DocumentID): DocumentContainer | undefined {
        return this.instances.get(id);
    }

    public static listInstances() {
        return Array.from(this.instances.values());
    }

    private constructor(public readonly id: DocumentID, provider: StorageProvider) {
        this.provider = provider;
        this.doc = new Y.Doc();
        this.awareness = new Awareness(this.doc);

        // Setup observers to persist the document when changed
        this.doc.on('update', async (update: Uint8Array) => {
            // Save the full document state to storage (NoteStorageProvider saves main text)
            try {
                await this.provider.save(this.id, this.doc);
            } catch(e) {
                console.error(`Failed to save document ${this.id}:`, e);
            }
        });
    }

    public async load() {
        const update = await this.provider.load(this.id);
        if(update) Y.applyUpdate(this.doc, update);
        return update !== null;
    }

    public addConnection(conn: Connection) {
        if(this.connections.has(conn)) return;
        this.connections.add(conn);

        // Cancel any pending close
        if(this.closingTimeout) {
            clearTimeout(this.closingTimeout);
            this.closingTimeout = null;
        }
    }

    public removeConnection(conn: Connection) {
        if(!this.connections.has(conn)) return;
        this.connections.delete(conn);

        if(conn.awarenessClientID !== null) {
            // Notify other clients that this peer disconnected
            for(const otherConn of this.connections) {
                otherConn.send({
                    type: "awareness-peer-removed",
                    doc: this.id,
                    id: conn.awarenessClientID
                });
            }
            this.applyAwarenessUpdate(conn.awarenessClientID, {
                type: "awareness-update",
                clock: this.awareness.meta.get(conn.awarenessClientID)?.clock ?? 0,
                doc: this.id,
                state: null
            });
        }

        if(this.connections.size === 0) {
            // Keep the document in memory briefly for reconnects
            this.closingTimeout = setTimeout(() => {
                this.close();
            }, 10_000);
        }
    }

    public async applyUpdate(update: Uint8Array, source?: Connection) {
        Y.applyUpdate(this.doc, update);

        // broadcast to the other connections
        this.broadcastUpdate(update, source);
    }

    private broadcastUpdate(update: Uint8Array, source?: Connection) {
        for(const conn of this.connections) {
            try {
                conn.send({
                    type: 'sync-data',
                    doc: this.id,
                    data: Array.from(update)
                } as any);
            } catch(e) {
                console.error(`Failed to broadcast update for ${this.id} to ${conn.username}:`, e);
            }
        }
    }

    public awarenessUpdate(clientID: AwarenessClientID, message: AwarenessUpdateMessage) {
        this.applyAwarenessUpdate(clientID, message);
        for(const conn of this.connections) {
            try {
                conn.send({
                    type: "awareness-state",
                    doc: this.id,
                    client: clientID,
                    state: message.state,
                    clock: message.clock
                } as any);
            } catch(e) {
                console.error(`Failed to broadcast awareness update for ${this.id} to ${conn.username}:`, e);
            }
        }
    }

    private applyAwarenessUpdate(clientID: AwarenessClientID, update: AwarenessUpdateMessage) {
        const timestamp = Date.now();
        const added = [];
        const updated = [];
        const filteredUpdated = [];
        const removed = [];

        let { clock, state } = update;
        
        // const state = JSON.parse(decoding.readVarString(decoder))
        const clientMeta = this.awareness.meta.get(clientID as number);
        const prevState = this.awareness.states.get(clientID as number);
        const currClock = clientMeta === undefined ? 0 : clientMeta.clock
        if(currClock < clock || (currClock === clock && state === null && this.awareness.states.has(clientID))) {
            if(state === null) {
                this.awareness.states.delete(clientID);
            } else {
                this.awareness.states.set(clientID, state);
            }
            this.awareness.meta.set(clientID, {
                clock,
                lastUpdated: timestamp
            });

            if(clientMeta === undefined && state !== null) {
                added.push(clientID)
            } else if(clientMeta !== undefined && state === null) {
                removed.push(clientID)
            } else if(state !== null) {
                if(!deepEqual(state, prevState)) {
                    filteredUpdated.push(clientID)
                }
                updated.push(clientID)
            }
        }
        if(added.length > 0 || filteredUpdated.length > 0 || removed.length > 0) {
            this.awareness.emit('change', [{
                added, updated: filteredUpdated, removed
            }]);
        }
        if(added.length > 0 || updated.length > 0 || removed.length > 0) {
            this.awareness.emit('update', [{
                added, updated, removed
            }]);
        }
    }

    public sendAwarenessState(clientID: AwarenessClientID, conn: Connection) {
        for(const [remoteClient, state] of this.awareness.getStates()) {
            if(remoteClient === clientID) continue;
            conn.send({
                type: "awareness-state",
                doc: this.id,
                client: remoteClient,
                state: state ?? null,
                clock: this.awareness.meta.get(remoteClient)?.clock ?? 0
            });
        }
    }

    private async close() {
        // I don't think we need to save again here but it doesn't hurt
        try {
            await this.provider.save(this.id, this.doc);
        } catch(e) {
            console.error(`Failed to save document ${this.id} on close:`, e);
        }

        this.doc.destroy();
        this.awareness.destroy();

        DocumentContainer.instances.delete(this.id);
    }

    public getYDoc(): Y.Doc {
        return this.doc;
    }

    public getConnectionCount(): number {
        return this.connections.size;
    }
}
