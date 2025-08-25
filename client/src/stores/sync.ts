import { IndexeddbPersistence } from "y-indexeddb";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";
import type { YArray, YMap } from "../lib/yjsFixes";
import { writable, type Writable } from "svelte/store";

const websocketURL = `ws${location.protocol === "https:" ? "s" : ""}://${location.host}/ws`;
console.log(`Websocket URL: ${websocketURL}`);

export type DocSubscription = {
    doc: Y.Doc,
    awareness: Awareness,
    disconnect(): void
};

export function getDocument(id: string, loadedCallback: (() => void) | null = null): DocSubscription {
    const doc = new Y.Doc();
    
    const localPersistence = new IndexeddbPersistence(id, doc);
    const remoteProvider = new HocuspocusProvider({
        url: websocketURL,
        name: id,
        document: doc
    });

    let loaded = false;

    localPersistence.once("synced", () => {
        console.log(`Locally-saved IndexDB content loaded for ${id}`);
        if(!loaded) {
            loaded = true;
            loadedCallback?.();
        }
    });

    remoteProvider.on("connect", () => {
        console.log(`Connected to remote provider for ${id}`);
        if(!loaded) {
            loaded = true;
            loadedCallback?.(); 
        }
    });

    return {
        doc,
        awareness: remoteProvider.awareness!,
        disconnect() {
            remoteProvider.disconnect();
            remoteProvider.destroy();
            localPersistence.destroy();
            doc.destroy();
        }
    };
}