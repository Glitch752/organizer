import { DocumentID } from "./Document";
import { PermissionStatus } from "./Permissions"

type AuthenticatedMessage = {
    type: "authenticated",
    username: string,
    permissions: PermissionStatus
};

type InitialSyncMessage = {
    type: "initial-sync",
    doc: DocumentID,
    data: Uint8Array
};

type SyncDataMessage = {
    type: "sync-data",
    doc: DocumentID,
    data: Uint8Array
};

export type AwarenessDataMessage = {
    type: "awareness-data",
    doc: DocumentID,
    // TODO
};

export type ServerToClientMessage =
    | AuthenticatedMessage
    | SyncDataMessage
    | InitialSyncMessage
    | AwarenessDataMessage;


type SyncBeginMessage = {
    type: "sync-begin",
    doc: DocumentID
};
type SyncEndMessage = {
    type: "sync-end",
    doc: DocumentID
};
type DocUpdateMessage = {
    type: "doc-update",
    doc: DocumentID,
    data: Uint8Array
};
type AwarenessUpdateMessage = {
    type: "awareness-update",
    doc: DocumentID,
    // TODO
};

export type ClientToServerMessage =
    | SyncBeginMessage
    | SyncEndMessage
    | DocUpdateMessage
    | AwarenessUpdateMessage;

// The code we close WebSocket connections with when authentication fails
export const AUTHENTICATION_FAILED_CODE = 3000; // https://github.com/Luka967/websocket-close-codes