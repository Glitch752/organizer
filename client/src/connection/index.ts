import { route } from "../stores/router";
import { PermissionStatus } from "@shared/connection/Permissions";
import { AUTHENTICATION_FAILED_CODE } from "@shared/connection/Messages";
import { writable } from "svelte/store";
import { SyncedDocument } from "./document";
import type { YDocSchema } from "@shared/typedYjs";
import { ServerSocket } from "./socket";
import type { DocumentID } from "@shared/connection/Document";

const websocketURL = `ws${location.protocol === "https:" ? "s" : ""}://${location.host}/ws`;
console.log(`Websocket URL: ${websocketURL}`);

export let socket = new ServerSocket(websocketURL);
export let username = writable<string | null>(null);

export function getSyncedDocument<DocType extends YDocSchema>(id: string, onLoad?: (() => void)): SyncedDocument<DocType> {
    const instance = SyncedDocument.getInstance<DocType>(id as DocumentID, socket);

    if(onLoad) instance.onload(onLoad);
    
    return instance;
}

socket.on("close", ({ code, reason }) => {
    if(code === AUTHENTICATION_FAILED_CODE) {
        if(route.current.onRoute("auth")) return;

        username.set(null);
        console.error("Authentication failed; redirecting to auth page.");
        route.navigate("/auth");
    }
});

socket.on("message", (msg) => {
    switch(msg.type) {
        case "authenticated": {
            console.log(`Authenticated as ${msg.username} with permissions ${PermissionStatus[msg.permissions]}`);
            username.set(msg.username);
            break;
        }
        case "initial-sync": {
            SyncedDocument.initialSync(msg);
            break;
        }
        case "sync-data": {
            const doc = socket.registeredDocuments.get(msg.doc);
            if(doc) doc.applyUpdate(msg.data);
            break;
        }
        case "awareness-state": {
            const doc = socket.registeredDocuments.get(msg.doc);
            if(doc) doc.applyAwarenessUpdate(msg);
            break;
        }
        case "awareness-peer-removed": {
            const doc = socket.registeredDocuments.get(msg.doc);
            if(doc) doc.removeAwarenessPeer(msg.id);
            break;
        }
    }
});

export async function reconnectSocket() {
    await socket.reconnect();
}