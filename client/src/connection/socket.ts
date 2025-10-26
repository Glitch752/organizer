// TODO: Auto reconnect with backoff

import type { ServerToClientMessage } from "@shared/connection/Messages";
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

    constructor(private url: string) {
        super();
        this.ws = this.openWebsocket();
    }

    private openWebsocket(): WebSocket {
        const socket = new WebSocket(this.url);
        socket.onopen = () => {
            console.log("WebSocket connection opened");
            this.emit("open", undefined);
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
            const msg = JSON.parse(event.data) as ServerToClientMessage;
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

    public connectToDocument(doc: SyncedDocument<any>) {
        
    }

    public disconnectFromDocument(doc: SyncedDocument<any>) {

    }
}