import { DocumentID } from "../Document";

export type AwarenessClientID = number & { readonly __brand: unique symbol };

//// Server to client

export type AwarenessPeerRemovedMessage = {
    type: "awareness-peer-removed",
    doc: DocumentID,
    id: AwarenessClientID
};
export type AwarenessStateMessage = {
    type: "awareness-state",
    doc: DocumentID,
    client: AwarenessClientID,
    clock: number,
    state: Record<string, any> | null
};

//// Client to server

export type ConnectAwarenessMessage = {
    type: "connect-awareness",
    id: AwarenessClientID
};
export type AwarenessUpdateMessage = {
    type: "awareness-update",
    doc: DocumentID,
    clock: number,
    state: Record<string, any> | null
};