import { IndexeddbPersistence } from "y-indexeddb";
// import { WebsocketProvider } from "y-websocket";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";
import { YTree, type TreeJsonStructure } from "../lib/ytree";
import { writable } from "svelte/store";
import { v4 as uuidv4 } from "uuid";

// const userColors = [
//     { color: "#30bced", light: "#30bced33" },
//     { color: "#6eeb83", light: "#6eeb8333" },
//     { color: "#ffbc42", light: "#ffbc4233" },
//     { color: "#ecd444", light: "#ecd44433" },
//     { color: "#ee6352", light: "#ee635233" },
//     { color: "#9ac2c9", light: "#9ac2c933" },
//     { color: "#8acb88", light: "#8acb8833" },
//     { color: "#1be7ff", light: "#1be7ff33" }
// ];

// const userColor = userColors[Math.floor(Math.random() * userColors.length)];

// remoteProvider.awareness.setLocalStateField('user', {
//   name: `User${Math.floor(Math.random() * 100)}`,
//   color: userColor.color,
//   colorLight: userColor.light
// });

const websocketURL = `ws${location.protocol === "https:" ? "s" : ""}://${location.host}/ws`;
console.log(`Websocket URL: ${websocketURL}`);

function getDocument(id: string, loadedCallback: (() => void) | null = null) {
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
        disconnect() {
            remoteProvider.disconnect();
            remoteProvider.destroy();
            localPersistence.destroy();
            doc.destroy();
        }
    };
}

const pagesDocument = getDocument("global");

type PageValueType = {
    id: string,
    name: string
};
const pageTree = new YTree<PageValueType>(pagesDocument.doc.getMap("pages"));
export const pagesRoot = pageTree.root();

export type PageType = TreeJsonStructure<PageValueType>;
export const immutablePageTreeView = writable(pageTree.toJsonStructure());
pageTree.setOnChange(() => {
    immutablePageTreeView.set(pageTree.toJsonStructure());
    console.log(pageTree.toJsonStructure());
});