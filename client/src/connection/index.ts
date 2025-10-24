import { Awareness } from "y-protocols/awareness";
import { route } from "../stores/router";
import { PermissionStatus } from "@shared/connection/Permissions";
import { AUTHENTICATION_FAILED_CODE, type ServerToClientMessage } from "@shared/connection/Messages";
import { writable } from "svelte/store";
import type { YDoc, YDocType } from "@shared/typedYjs";

const websocketURL = `ws${location.protocol === "https:" ? "s" : ""}://${location.host}/ws`;
console.log(`Websocket URL: ${websocketURL}`);

export type DocSubscription<DocType extends YDocType> = {
    doc: YDoc<DocType>,
    awareness: Awareness,
    disconnect(): void
};

export let ws = openWebsocket();
export let username = writable<string | null>(null);

function openWebsocket(): WebSocket {
    // TODO: Auto reconnect with backoff
    const socket = new WebSocket(websocketURL);
    socket.onopen = () => {
        console.log("WebSocket connection opened");
    };
    socket.onclose = (e) => {
        console.log(`WebSocket connection closed (code: ${e.code}, reason: ${e.reason})`);
        if(e.code === AUTHENTICATION_FAILED_CODE) {
            if(route.current.onRoute("auth")) return;

            username.set(null);
            console.error("Authentication failed; redirecting to auth page.");
            route.navigate("/auth");
        }
    };
    socket.onerror = (error) => {
        console.error("WebSocket error:", error);
    };
    socket.onmessage = (event) => {
        const msg = JSON.parse(event.data) as ServerToClientMessage;

        switch(msg.type) {
            case "authenticated":
                console.log(`Authenticated as ${msg.username} with permissions ${PermissionStatus[msg.permissions]}`);
                username.set(msg.username);
                break;
        }
    };
    return socket;
}

export async function reconnectSocket() {
    ws.close();
    
    return new Promise<void>((resolve, reject) => {
        ws = openWebsocket();
        ws.addEventListener("open", () => {
            ws.removeEventListener("error", reject);
            resolve();
        }, { once: true });
        ws.addEventListener("error", reject, { once: true });
    });
}