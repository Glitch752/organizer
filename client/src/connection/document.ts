import { Awareness } from "y-protocols/awareness.js";
import * as Y from "yjs";
import type { DocSubscription } from ".";
import type { YDoc, YDocType } from "@shared/typedYjs";

export function getDocument<DocType extends YDocType>(
    id: string,
    loadedCallback: (() => void) | null = null
): DocSubscription<DocType> {
    const doc = new Y.Doc();

    // const localPersistence = new IndexeddbPersistence(id, doc);
    // localPersistence.once("synced", () => {
    //     console.log(`Locally-saved IndexDB content loaded for ${id}`);
    //     if(!loaded) {
    //         loaded = true;
    //         loadedCallback?.();
    //     }
    // });
    let loaded = false;

    // remoteProvider.on("synced", () => {
    //     console.log(`Synced to remote provider for ${id}`);
    //     if(!loaded) {
    //         loaded = true;
    //         loadedCallback?.(); 
    //     }
    // });
    // remoteProvider.on("authenticated", () => {
    //     if(route.current.onRoute("auth")) {
    //         route.navigate("/");
    //     }
    //     console.log(`Authenticated to remote provider for ${id}`);
    // });
    // remoteProvider.on("status", (e: { status: "connected" | "disconnected" }) => {
    //     console.log(`Remote provider status for ${id}: ${e.status}`);
    // });
    return {
        doc: doc as YDoc<DocType>,
        // awareness: remoteProvider.awareness!,
        // disconnect() {
        //     remoteProvider.detach();
        //     remoteProvider.destroy();
        //     // localPersistence.destroy();
        //     doc.destroy();
        // }
        awareness: new Awareness(doc),
        disconnect() {
        }
    };
}
