// TODO: Auto reconnect with backoff

import type { ClientToServerMessage, ServerToClientMessage } from "@shared/connection/Messages";
import { EventEmitter } from "../lib/util/EventEmitter";
import type { SyncedDocument } from "./document";

type ServerSocketEvents = {
    open: void;
    close: { code: number; reason: string };
    error: Event;
    message: ServerToClientMessage;
}

export class ServerSocket extends EventEmitter<ServerSocketEvents> {
    private ws: WebSocket;
    private registeredDocuments: Map<string, SyncedDocument<any>> = new Map();
    private queuedMessages: ClientToServerMessage[] = [];

    constructor(private url: string) {
        super();
        this.ws = this.openWebsocket();

        this.on("message", (msg) => {
            switch(msg.type) {
                case "sync-data": {
                    const doc = this.registeredDocuments.get(msg.doc);
                    if(doc) doc.applyUpdate(msg.data);
                    break;
                }
                case "awareness-state": {
                    const doc = this.registeredDocuments.get(msg.doc);
                    if(doc) doc.applyAwarenessUpdate(msg);
                    break;
                }
            }
        })
    }

    private openWebsocket(): WebSocket {
        const socket = new WebSocket(this.url);
        socket.onopen = () => {
            console.log("WebSocket connection opened");
            this.emit("open", undefined);
            this.queuedMessages.forEach(msg => this.send(msg));
            this.queuedMessages = [];
        };
        socket.onclose = (e) => {
            console.log(`WebSocket connection closed (code: ${e.code}, reason: ${e.reason})`);
            this.emit("close", { code: e.code, reason: e.reason });
        };
        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
            this.emit("error", error);
        };
        socket.onmessage = (event) => {
            // Parse message and convert any numeric arrays back into Uint8Array
            const raw = JSON.parse(event.data) as any;
            if(raw && raw.data && Array.isArray(raw.data)) {
                try {
                    raw.data = new Uint8Array(raw.data as number[]);
                } catch (e) {
                    console.warn("Failed to convert incoming binary data to Uint8Array", e);
                }
            }

            const msg = raw as ServerToClientMessage;
            this.emit("message", msg);
        };
        return socket;
    }

    public async reconnect(): Promise<void> {
        this.ws.close();
        
        return new Promise<void>((resolve, reject) => {
            this.ws = this.openWebsocket();
            this.ws.addEventListener("open", () => {
                this.ws.removeEventListener("error", reject);
                resolve();
            }, { once: true });
            this.ws.addEventListener("error", reject, { once: true });
        });
    }

    private send(message: ClientToServerMessage) {
        if(this.ws.readyState !== WebSocket.OPEN) {
            this.queuedMessages.push(message);
            return;
        }
        this.ws.send(JSON.stringify(message));
    }

    // Public wrapper that converts typed arrays for JSON serialization before sending
    public sendMessage(message: ClientToServerMessage) {
        const replacer = (_k: string, v: any) => {
            if(v instanceof Uint8Array) return Array.from(v as Uint8Array);
            return v;
        };
        const serialized = JSON.parse(JSON.stringify(message, replacer));
        if(this.ws.readyState !== WebSocket.OPEN) {
            this.queuedMessages.push(serialized as ClientToServerMessage);
            return;
        }
        this.ws.send(JSON.stringify(serialized));
    }

    public connectToDocument(doc: SyncedDocument<any>) {
        if(this.registeredDocuments.has(doc.id)) throw new Error(`Already connected to document ${doc.id}`);
        this.registeredDocuments.set(doc.id, doc); 
        this.send({ type: "sync-begin", doc: doc.id });  
    }

    public disconnectFromDocument(doc: SyncedDocument<any>) {
        this.registeredDocuments.delete(doc.id);
        this.send({ type: "sync-end", doc: doc.id });
    }
}