import { Awareness } from "y-protocols/awareness.js";
import * as Y from "yjs";
import type { YDoc, YDocSchema } from "@shared/typedYjs";
import type { ServerSocket } from "./socket";
import { EventEmitter } from "../lib/util/EventEmitter";
import type { AwarenessDataMessage } from "@shared/connection/Messages";
import { writable, type Writable } from "svelte/store";

export enum SyncStatus {
    Error = 5,
    Disconnected = 4,
    UnsyncedChanges = 3,
    Connecting = 2,
    Synced = 1,
    None = 0
}

type SyncedDocumentEvents = {
    statusChange: SyncStatus;
    load: void;
}

/**
 * Note: synced documents are singleton per ID.  
 * Because they use reference counting, you MUST call `release()` when you're done with it.
 */
export class SyncedDocument<DocType extends YDocSchema> extends EventEmitter<SyncedDocumentEvents> {
    // Reference counting so we only subscribe once per document
    private refCount: number = 0;
    private static instances: Map<string, SyncedDocument<any>> = new Map();
    public static getInstance<DocType extends YDocSchema>(id: string, ws: ServerSocket):
        SyncedDocument<DocType> {
        let instance = this.instances.get(id) as SyncedDocument<DocType> | undefined;
        if(!instance) {
            instance = new SyncedDocument<DocType>(id, ws);
            this.instances.set(id, instance);
            SyncedDocument.updateGlobalSyncStatus();
        }
        instance.refCount++;
        return instance;
    }

    public static globalSyncStatus: Writable<SyncStatus> = writable(SyncStatus.Disconnected);
    private static updateGlobalSyncStatus() {
        let highestStatus = SyncStatus.None;
        for(const doc of this.instances.values()) {
            if(doc.status > highestStatus) {
                highestStatus = doc.status;
            }
        }
        this.globalSyncStatus.set(highestStatus);
    }

    // Main data
    public doc: YDoc<DocType>;
    public awareness: Awareness;
    private _status: SyncStatus = SyncStatus.Disconnected;
    public get status(): SyncStatus {
        return this._status;
    }
    private set status(status: SyncStatus) {
        this._status = status;
        SyncedDocument.updateGlobalSyncStatus();
    }

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
        super();
        
        this.doc = new Y.Doc() as unknown as YDoc<DocType>;
        this.awareness = new Awareness(this.doc as unknown as Y.Doc);

        this.connect();
    }

    public release() {
        this.refCount--;
        if(this.refCount <= 0) {
            this.disconnect();
            SyncedDocument.instances.delete(this.id);
            SyncedDocument.updateGlobalSyncStatus();
        }
    }

    private connect() {
        console.log(`Connecting to document ${this.id}`);
        this.status = SyncStatus.Connecting;

        this.socket.connectToDocument(this);
    }
    
    private disconnect() {
        console.log(`Disconnecting from document ${this.id}`);
        this.status = SyncStatus.Disconnected;

        this.awareness.destroy();
        this.doc.destroy();

        this.socket.disconnectFromDocument(this);
    }

    public initialSync(data: Uint8Array) {
        // TODO
    }

    public applyUpdate(update: Uint8Array) {
        Y.applyUpdate(this.doc as unknown as Y.Doc, update);
    }

    public applyAwarenessUpdate(update: AwarenessDataMessage) {
        // TODO
    }
}