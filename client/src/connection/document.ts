import { Awareness } from "y-protocols/awareness.js";
import * as Y from "yjs";
import type { YDoc, YDocSchema } from "@shared/typedYjs";
import type { ServerSocket } from "./socket";
import { EventEmitter } from "../lib/util/EventEmitter";
import type { InitialSyncMessage, SyncDataMessage } from "@shared/connection/Messages";
import { writable, type Writable } from "svelte/store";
import type { DocumentID } from "@shared/connection/Document";
import type { AwarenessClientID, AwarenessStateMessage } from "@shared/connection/messages/awareness";
import { deepEqual } from "@shared/util";

export enum SyncStatus {
    Error = 5,
    Disconnected = 4,
    UnsyncedChanges = 3,
    Connecting = 2,
    Synced = 1,
    None = 0
}

type SyncedDocumentEvents = {
    statusChange: SyncStatus;
    load: void;
}

/**
 * Note: synced documents are singleton per ID.  
 * Because they use reference counting, you MUST call `release()` when you're done with it.
 */
export class SyncedDocument<DocType extends YDocSchema> extends EventEmitter<SyncedDocumentEvents> {
    // Reference counting so we only subscribe once per document
    public refCount: number = 0;
    
    private static instances: Map<string, SyncedDocument<any>> = new Map();
    public static getInstance<DocType extends YDocSchema>(id: DocumentID, ws: ServerSocket):
        SyncedDocument<DocType> {
        let instance = this.instances.get(id) as SyncedDocument<DocType> | undefined;
        if(!instance) {
            instance = new SyncedDocument<DocType>(id, ws);
            this.instances.set(id, instance);
            SyncedDocument.updateGlobalSyncStatus();
        }
        instance.refCount++;
        return instance;
    }

    public static listInstances(): Array<SyncedDocument<any>> {
        return Array.from(this.instances.values());
    }

    public static globalSyncStatus: Writable<SyncStatus> = writable(SyncStatus.Disconnected);
    private static updateGlobalSyncStatus() {
        let highestStatus = SyncStatus.None;
        for(const doc of this.instances.values()) {
            if(doc.status > highestStatus) {
                highestStatus = doc.status;
            }
        }
        this.globalSyncStatus.set(highestStatus);
    }

    // Main data
    public doc: YDoc<DocType>;
    public awareness: Awareness;
    private awarenessConnected: boolean = false;
    private get clientID(): AwarenessClientID {
        return this.awareness.clientID as AwarenessClientID;
    }

    private _status: SyncStatus = SyncStatus.Disconnected;
    public get status(): SyncStatus {
        return this._status;
    }
    private set status(status: SyncStatus) {
        this._status = status;
        this.emit("statusChange", status);
        SyncedDocument.updateGlobalSyncStatus();
    }

    // New: suppress sending updates originated from remote applyUpdate
    private suppressLocalUpdates: boolean = false;
    private onUpdateBound: ((update: Uint8Array, origin?: any) => void) | null = null;
    private onAwarenessUpdateBound: ((update: {
        added: number[],
        updated: number[],
        removed: number[]
    }, origin?: any) => void) | null = null;

    private onloadHandlers: (() => void)[] = [];
    public onload(cb: () => void) {
        if(this.status === SyncStatus.Synced || this.status === SyncStatus.UnsyncedChanges) {
            cb();
            return;
        }

        this.onloadHandlers.push(cb);
    }

    // Private to force singleton usage
    private constructor(public id: DocumentID, private socket: ServerSocket) {
        super();
        
        this.doc = new Y.Doc() as unknown as YDoc<DocType>;
        this.awareness = new Awareness(this.doc as unknown as Y.Doc);

        this.awareness.setLocalState(null);

        // Setup update handler to propagate local Yjs updates to the server
        this.onUpdateBound = (update: Uint8Array) => {
            if(this.suppressLocalUpdates) return;

            // When the user causes local updates, forward them to the server
            try {
                this.socket.sendMessage({ type: "doc-update", doc: this.id, data: update });
                // Mark we have unsynced changes until the server 'synced' state is received
                this.status = SyncStatus.UnsyncedChanges;
            } catch(e) {
                console.error("Failed to send doc update to server", e);
            }
        };
        this.doc.on('update', this.onUpdateBound);

        this.onAwarenessUpdateBound = (update, origin) => {
            if(update.updated.length === 0) return;
            if(!update.updated.includes(this.clientID)) return;

            console.log(update, this.clientID);

            try {
                this.sendAwarenessUpdate();
            } catch(e) {
                console.error("Failed to send awareness update to server", e);
            }
        };
        this.awareness.on('update', this.onAwarenessUpdateBound);

        this.connect();
    }

    public release() {
        this.refCount--;
        if(this.refCount <= 0) {
            this.disconnect();
            SyncedDocument.instances.delete(this.id);
            SyncedDocument.updateGlobalSyncStatus();
        }
    }

    private connect() {
        console.log(`Connecting to document ${this.id}`);
        this.status = SyncStatus.Connecting;

        this.socket.connectToDocument(this);
    }
    
    private disconnect() {
        console.log(`Disconnecting from document ${this.id}`);
        this.status = SyncStatus.Disconnected;

        if(this.onAwarenessUpdateBound) {
            try { this.awareness.off('update', this.onAwarenessUpdateBound); } catch {}
            this.onAwarenessUpdateBound = null;
        }
        
        this.awareness.destroy();

        if(this.onUpdateBound) {
            try { this.doc.off('update', this.onUpdateBound); } catch {}
            this.onUpdateBound = null;
        }

        this.doc.destroy();

        this.socket.disconnectFromDocument(this);
    }

    private sendAwarenessUpdate() {
        if(!this.awarenessConnected) {
            this.socket.sendMessage({
                type: "connect-awareness",
                id: this.clientID
            })
            this.awarenessConnected = true;
        }

        this.socket.sendMessage({
            type: "awareness-update",
            clock: this.awareness.meta.get(this.clientID)?.clock ?? 0,
            doc: this.id,
            state: this.awareness.getLocalState()!
        });
    }

    public static initialSync(message: InitialSyncMessage) {
        if(this.instances.has(message.doc)) {
            this.instances.get(message.doc)!.initialSync(message.data);
        } else {
            console.warn(`Received initial sync for unknown document ID ${message.doc}`);
        }
    }

    private initialSync(data: Uint8Array) {
        // Use applyUpdate so remote updates aren't echoed back to the server
        this.applyUpdate(data);
        this.status = SyncStatus.Synced;

        for(const cb of this.onloadHandlers) cb();
        this.onloadHandlers = [];
    }

    public applyUpdate(update: Uint8Array) {
        // Suppress the update handler while applying remote updates
        this.suppressLocalUpdates = true;
        try {
            Y.applyUpdate(this.doc as unknown as Y.Doc, update);
        } finally {
            this.suppressLocalUpdates = false;
        }
        // Server-propagated update brings us into a synced state for now
        this.status = SyncStatus.Synced;
    }

    public applyAwarenessUpdate(update: AwarenessStateMessage) {
        const timestamp = Date.now();
        const added = [];
        const updated = [];
        const filteredUpdated = [];
        const removed = [];

        let { clock, client: clientID, state } = update;
        
        // const state = JSON.parse(decoding.readVarString(decoder))
        const clientMeta = this.awareness.meta.get(clientID as number);
        const prevState = this.awareness.states.get(clientID as number);
        const currClock = clientMeta === undefined ? 0 : clientMeta.clock
        if(currClock < clock || (currClock === clock && state === null && this.awareness.states.has(clientID))) {
            if(state === null) {
                // Never let a remote client remove this local state
                if(clientID === this.clientID && this.awareness.getLocalState() != null) {
                    // Remote client removed the local state. Do not remove state. Broadcast a message indicating
                    // that this client still exists by increasing the clock
                    clock++;
                } else {
                    this.awareness.states.delete(clientID);
                }
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

    public removeAwarenessPeer(id: AwarenessClientID) {
        this.applyAwarenessUpdate({
            type: "awareness-state",
            client: id,
            clock: this.awareness.meta.get(id)?.clock ?? 0,
            doc: this.id,
            state: null
        });
    }
}