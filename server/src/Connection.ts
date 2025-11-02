import WebSocket from 'ws';
import { PermissionStatus } from '@shared/connection/Permissions';
import { DocumentID } from '@shared/connection/Document';
import { ClientToServerMessage, ServerToClientMessage } from '@shared/connection/Messages';

export class Connection {
    public permissionStatus: PermissionStatus = PermissionStatus.Unauthenticated;

    public openDocuments: Set<DocumentID> = new Set();

    constructor(
        public readonly ws: WebSocket.WebSocket,
        public readonly username: string
    ) {
        ws.on("message", this.onMessage.bind(this));
    }

    public send(message: ServerToClientMessage) {
        if(this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.warn("Attempted to send message on closed WebSocket");
        }
    }

    public sendAuthenticatedMessage() {
        this.send({
            type: "authenticated",
            username: this.username,
            permissions: this.permissionStatus
        });
    }

    private onMessage(rawData: WebSocket.RawData, isBinary: boolean) {
        if(isBinary) {
            console.warn(`Received non-string message from client, ignoring`);
            return;
        }

        const data = rawData.toString();

        const message: ClientToServerMessage = JSON.parse(data);
        switch(message.type) {
            case "sync-begin": {
                if(this.openDocuments.has(message.doc)) {
                    console.warn(`Client attempted to open already-open document ${message.doc}, ignoring`);
                    return;
                }
                this.openDocuments.add(message.doc);
                console.log(`Client opened document ${message.doc}`);
                break;
            }
            case "sync-end": {
                if(!this.openDocuments.has(message.doc)) {
                    console.warn(`Client attempted to close non-open document ${message.doc}, ignoring`);
                    return;
                }
                this.openDocuments.delete(message.doc);
                break;
            }
        }
    }

    public close() {
        // TODO: Clean up open documents? idk
        this.ws.off("message", this.onMessage.bind(this));
    }
}