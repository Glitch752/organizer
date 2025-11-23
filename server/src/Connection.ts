import WebSocket from 'ws';
import { PermissionStatus } from '@shared/connection/Permissions';
import { DocumentID } from '@shared/connection/Document';
import { ClientToServerMessage, ServerToClientMessage } from '@shared/connection/Messages';
import type { DataStore } from './DataStore';
import { DocumentContainer } from './document/Document';
import * as Y from 'yjs';
import { StorageProvider } from './document/StorageProvider';
import { NoteStorageProvider } from './document/NoteStorageProvider';
import { RawStorageProvider } from './document/RawStorageProvider';
import { WorkspaceStorageProvider } from './document/WorkspaceStorageProvider';
import { AwarenessClientID } from '@shared/connection/messages/awareness';
import { CalendarArchiveProvider } from './document/CalendarArchiveProvider';

export class Connection {
    public permissionStatus: PermissionStatus = PermissionStatus.Unauthenticated;

    public openDocuments: Set<DocumentID> = new Set();

    public awarenessClientID: AwarenessClientID | null = null;

    private onMessageBound: (rawData: WebSocket.RawData, isBinary: boolean) => Promise<void>;

    constructor(
        public readonly ws: WebSocket.WebSocket,
        public readonly username: string,
        private readonly dataStore: DataStore
    ) {
        this.onMessageBound = this.onMessage.bind(this);
        ws.on("message", this.onMessageBound);
    }

    public send(message: any) {
        if(this.ws.readyState === WebSocket.OPEN) {
            // Ensure typed arrays are JSON-serializable
            const cloned = JSON.parse(JSON.stringify(message, (_k, v) => {
                if(v instanceof Uint8Array) return Array.from(v as Uint8Array);
                return v;
            }));
            this.ws.send(JSON.stringify(cloned));
        } else {
            console.warn("Attempted to send message on closed WebSocket");
        }
    }

    public sendAuthenticatedMessage() {
        this.send({
            type: "authenticated",
            username: this.username,
            permissions: this.permissionStatus
        } as ServerToClientMessage);
    }

    private async onMessage(rawData: WebSocket.RawData, isBinary: boolean) {
        if(isBinary) {
            console.warn(`Received non-string message from client, ignoring`);
            return;
        }

        const data = rawData.toString();

        try {
            const message: ClientToServerMessage = JSON.parse(data);
            switch(message.type) {
                case "sync-begin": {
                    if(this.openDocuments.has(message.doc)) {
                        console.warn(`Client attempted to open already-open document ${message.doc}, ignoring`);
                        return;
                    }
                    this.openDocuments.add(message.doc);
                    console.log(`Client opened document ${message.doc}`);

                    let storageProvider: StorageProvider;
                    if(message.doc.startsWith("page:")) {
                        storageProvider = new NoteStorageProvider(this.dataStore);
                    } else if(message.doc.startsWith("calendar-archive:")) {
                        storageProvider = new CalendarArchiveProvider(this.dataStore);
                    } else if(message.doc === "global") {
                        storageProvider = new WorkspaceStorageProvider(this.dataStore);
                    } else {
                        throw new Error(`Unknown document type for id ${message.doc}`);
                    }

                    // Get or create server-side document container
                    const doc = await DocumentContainer.getInstance(message.doc, storageProvider);
                    doc.addConnection(this);

                    const update = Y.encodeStateAsUpdate(doc.getYDoc());
                    this.send({
                        type: "initial-sync",
                        doc: message.doc,
                        data: update
                    } as any);

                    // If awareness is connected, send existing awareness states
                    if(this.awarenessClientID) {
                        doc.sendAwarenessState(this.awarenessClientID, this);
                    }
                    break;
                }
                case "sync-end": {
                    if(!this.openDocuments.has(message.doc)) {
                        console.warn(`Client attempted to close non-open document ${message.doc}, ignoring`);
                        return;
                    }
                    this.openDocuments.delete(message.doc);
                    console.log(`Client closed document ${message.doc}`);

                    const doc = DocumentContainer.getExistingInstance(message.doc);
                    if(doc) doc.removeConnection(this);
                    break;
                }
                case "doc-update": {
                    // Only allow updates if we have the document opened and we have write permission
                    if(!this.openDocuments.has(message.doc)) {
                        console.warn(`Client sent update for non-open document ${message.doc}, ignoring`);
                        return;
                    }
                    if(this.permissionStatus !== PermissionStatus.ReadWrite) {
                        console.warn(`Client attempted to update document ${message.doc} without write permission, ignoring`);
                        return;
                    }

                    const doc = DocumentContainer.getExistingInstance(message.doc);
                    if(!doc) {
                        console.warn(`Received update for non-existent container ${message.doc}`);
                        return;
                    }
                    // Apply the update to the server ydoc and broadcast to other clients
                    const update = message.data instanceof Uint8Array ? message.data : new Uint8Array(message.data as number[]);
                    await doc.applyUpdate(update, this);
                    break;
                }
                case "connect-awareness": {
                    this.awarenessClientID = message.id;
                    // Send existing awareness states for all of the connected docs
                    for(const docId of this.openDocuments) {
                        const doc = DocumentContainer.getExistingInstance(docId);
                        if(doc) doc.sendAwarenessState(message.id, this);
                    }
                    break;
                }
                case "awareness-update": {
                    // Only allow updates if we have the document opened and we have write permission
                    // Maybe awareness updates could make sense without write permission, but for now we keep it simple
                    if(!this.openDocuments.has(message.doc)) {
                        console.warn(`Client sent update for non-open document ${message.doc}, ignoring`);
                        return;
                    }
                    if(this.permissionStatus !== PermissionStatus.ReadWrite) {
                        console.warn(`Client attempted to update document ${message.doc} without write permission, ignoring`);
                        return;
                    }

                    if(!this.awarenessClientID) {
                        console.warn("Client attempted to send awareness update without connecting awareness first, ignoring");
                    }

                    const doc = DocumentContainer.getExistingInstance(message.doc);
                    if(!doc) {
                        console.warn(`Received update for non-existent container ${message.doc}`);
                        return;
                    }
                    if(doc) doc.awarenessUpdate(this.awarenessClientID!, message);
                    break;
                }
            }
        } catch(e) {
            console.error("Error processing message from client:", e);
        }
    }

    public close() {
        console.log(`Closing connection for user ${this.username}`);
        // Remove this connection from all open documents
        for(const docId of this.openDocuments) {
            const doc = DocumentContainer.getExistingInstance(docId);
            if(doc) doc.removeConnection(this);
        }
        this.openDocuments.clear();

        this.ws.off("message", this.onMessageBound);
    }
}