import { DocumentID } from "../Document";

export type AwarenessClientID = string & { readonly __brand: unique symbol };

//// Server to client

export type AwarenessPeerAddedMessage = {
    type: "awareness-peer-added",
    doc: DocumentID,
    id: AwarenessClientID
};

export type AwarenessPeerRemovedMessage = {
    type: "awareness-peer-removed",
    doc: DocumentID,
    id: AwarenessClientID
};
export type AwarenessStateMessage = {
    type: "awareness-state",
    doc: DocumentID,
    client: AwarenessClientID,
    state: Record<string, any>
};

//// Client to server

export type ConnectAwarenessMessage = {
    type: "connect-awareness",
    id: AwarenessClientID
};
export type AwarenessUpdateMessage = {
    type: "awareness-update",
    doc: DocumentID,
    state: Record<string, any>
};