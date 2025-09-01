import { IndexeddbPersistence } from "y-indexeddb";
import { HocuspocusProvider, HocuspocusProviderWebsocket } from "@hocuspocus/provider";
import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";
import { route } from "./router";

const websocketURL = `ws${location.protocol === "https:" ? "s" : ""}://${location.host}/ws`;
console.log(`Websocket URL: ${websocketURL}`);

export type DocSubscription = {
    doc: Y.Doc,
    awareness: Awareness,
    disconnect(): void
};

const hocuspocusSocket = new HocuspocusProviderWebsocket({
    url: websocketURL,
    autoConnect: true,
    maxAttempts: 0,
    delay: 500,
    minDelay: 500,
    factor: 1.1,
    async handleTimeout() {
        console.log("Websocket connection timeout");
    },
});

hocuspocusSocket.on("open", () => {
    console.log("Websocket connection opened");
});
hocuspocusSocket.on("connect", () => {
    console.log("Connected to Hocuspocus server");
});
hocuspocusSocket.on("disconnect", () => {
    console.log("Disconnected from Hocuspocus server");
});

export async function reconnectSocket() {
    hocuspocusSocket.disconnect();
    hocuspocusSocket.cleanupWebSocket();
    await hocuspocusSocket.createWebSocketConnection();
    hocuspocusSocket.connect();
}

export function getDocument(id: string, loadedCallback: (() => void) | null = null): DocSubscription {
    const doc = new Y.Doc();

    const localPersistence = new IndexeddbPersistence(id, doc);
    const remoteProvider = new HocuspocusProvider({
        websocketProvider: hocuspocusSocket,
        name: id,
        document: doc
    });
    remoteProvider.attach();
    
    // TODO: Read remoteProvider.hasUnsyncedChanges and use it to show a "syncing" indicator in the UI

    let loaded = false;

    localPersistence.once("synced", () => {
        console.log(`Locally-saved IndexDB content loaded for ${id}`);
        if(!loaded) {
            loaded = true;
            loadedCallback?.();
        }
    });

    remoteProvider.on("synced", () => {
        console.log(`Synced to remote provider for ${id}`);
        if(!loaded) {
            loaded = true;
            loadedCallback?.(); 
        }
    });

    remoteProvider.on("authenticated", () => {
        if(route.current.onRoute("auth")) {
            route.navigate("/");
        }

        console.log(`Authenticated to remote provider for ${id}`);
    });
    
    remoteProvider.on("authenticationFailed", (e: any) => {
        if(route.current.onRoute("auth")) return;

        console.error(`Authentication failed for ${id}:`, e);
        route.navigate("/auth");
    });

    remoteProvider.on("status", (e: { status: "connected" | "disconnected" }) => {
        console.log(`Remote provider status for ${id}: ${e.status}`);
    });

    return {
        doc,
        awareness: remoteProvider.awareness!,
        disconnect() {
            remoteProvider.detach();
            remoteProvider.destroy();
            localPersistence.destroy();
            doc.destroy();
        }
    };
}