import WebSocket from 'ws';
import { PermissionStatus } from '@shared/connection/Permissions';
import { DocumentID } from '@shared/connection/Document';
import { ServerToClientMessage } from '@shared/connection/Messages';

export class Connection {
    public permissionStatus: PermissionStatus = PermissionStatus.Unauthenticated;

    public openDocuments: Set<DocumentID> = new Set();

    constructor(
        public readonly ws: WebSocket.WebSocket,
        public readonly username: string
    ) {

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
}