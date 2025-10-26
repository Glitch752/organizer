import { Awareness } from "y-protocols/awareness.js";
import * as Y from "yjs";
import type { YDoc, YDocSchema } from "@shared/typedYjs";
import type { ServerSocket } from "./socket";

enum SyncStatus {
    Disconnected,
    Connecting,
    Synced,
    UnsyncedChanges,
    Error
}

/**
 * Note: synced documents are singleton per ID.  
 * Because they use reference counting, you MUST call `release()` when you're done with it.
 */
export class SyncedDocument<DocType extends YDocSchema>{
    // Reference counting so we only subscribe once per document
    private refCount: number = 0;
    private static instances: Map<string, SyncedDocument<any>> = new Map();
    public static getInstance<DocType extends YDocSchema>(id: string, ws: ServerSocket):
        SyncedDocument<DocType> {
        let instance = this.instances.get(id) as SyncedDocument<DocType> | undefined;
        if(!instance) {
            instance = new SyncedDocument<DocType>(id, ws);
            this.instances.set(id, instance);
        }
        instance.refCount++;
        return instance;
    }

    // Main data
    public doc: YDoc<DocType>;
    public awareness: Awareness;
    public status: SyncStatus = SyncStatus.Disconnected;

    private onloadHandlers: (() => void)[] = [];
    public onload(cb: () => void) {
        if(this.status === SyncStatus.Synced || this.status === SyncStatus.UnsyncedChanges) {
            cb();
            return;
        }

        this.onloadHandlers.push(cb);
    }

    // Private to force singleton usage
    private constructor(public id: string, private socket: ServerSocket) {
        this.doc = new Y.Doc() as unknown as YDoc<DocType>;
        this.awareness = new Awareness(this.doc as unknown as Y.Doc);

        this.connect();
    }

    public release() {
        this.refCount--;
        if(this.refCount <= 0) {
            this.disconnect();
            SyncedDocument.instances.delete(this.id);
        }
    }

    private connect() {
        
    }
    
    private disconnect() {
        this.awareness.destroy();
        this.doc.destroy();
    }
}