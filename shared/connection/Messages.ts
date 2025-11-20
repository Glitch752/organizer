import { DocumentID } from "./Document";
import { AwarenessStateMessage, AwarenessPeerRemovedMessage, AwarenessUpdateMessage, ConnectAwarenessMessage } from "./messages/awareness";
import { PermissionStatus } from "./Permissions"

export type AuthenticatedMessage = {
    type: "authenticated",
    username: string,
    permissions: PermissionStatus
};

export type InitialSyncMessage = {
    type: "initial-sync",
    doc: DocumentID,
    data: Uint8Array
};

export type SyncDataMessage = {
    type: "sync-data",
    doc: DocumentID,
    data: Uint8Array
};

export type ServerToClientMessage =
    | AuthenticatedMessage
    | SyncDataMessage
    | InitialSyncMessage
    
    | AwarenessStateMessage
    | AwarenessPeerRemovedMessage;


export type SyncBeginMessage = {
    type: "sync-begin",
    doc: DocumentID
};
export type SyncEndMessage = {
    type: "sync-end",
    doc: DocumentID
};
export type DocUpdateMessage = {
    type: "doc-update",
    doc: DocumentID,
    data: Uint8Array
};

export type ClientToServerMessage = |
      SyncBeginMessage
    | SyncEndMessage
    | DocUpdateMessage
    |
      ConnectAwarenessMessage
    | AwarenessUpdateMessage;

// The code we close WebSocket connections with when authentication fails
export const AUTHENTICATION_FAILED_CODE = 3000; // https://github.com/Luka967/websocket-close-codes