import { PermissionStatus } from "./Permissions"

type AuthenticatedMessage = {
    type: "authenticated",
    username: string,
    permissions: PermissionStatus
};

type SyncDataMessage = {
    type: "sync-data",
    doc: string,
    data: Uint8Array
};

type AwarenessDataMessage = {
    type: "awareness-data",
    doc: string,
    // TODO
};

export type ServerToClientMessage =
    | AuthenticatedMessage
    | SyncDataMessage
    | AwarenessDataMessage;


type SyncBeginMessage = {
    type: "sync-begin",
    doc: string
};
type SyncEndMessage = {
    type: "sync-end",
    doc: string
};
type DocUpdateMessage = {
    type: "doc-update",
    doc: string,
    data: Uint8Array
};
type AwarenessUpdateMessage = {
    type: "awareness-update",
    doc: string,
    // TODO
};

export type ClientToServerMessage =
    | SyncBeginMessage
    | SyncEndMessage
    | DocUpdateMessage
    | AwarenessUpdateMessage;

// The code we close WebSocket connections with when authentication fails
export const AUTHENTICATION_FAILED_CODE = 3000; // https://github.com/Luka967/websocket-close-codes