import { Hocuspocus } from "@hocuspocus/server";

import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";

import { YTree } from "@shared/ytree";
import { YMap } from "@shared/yjsFixes";

import { sqlite } from "./SQLite";
import { checkAuth, addAuthRoutes } from "./auth";
import { serveStatic } from "hono/serve-static";

import path from "path";
import fs from "fs/promises";

const hocuspocus = new Hocuspocus({
    yDocOptions: {
        gc: true,
        gcFilter() {
            return true;
        },
    },
    
    async onListen() {
        console.log("Hocuspocus server listening");
    },
    
    async onConnect() {
        console.log("Client connected")
    },
    
    async onDisconnect() {
        console.log("Client disconnected")
    },
    
    async onAuthenticate(data) {
        const username = await checkAuth(data.request.headers);
        if(!username) {
            throw new Error("Authentication failed");
        }
        
        data.connectionConfig.readOnly = false;
        
        return {
            user: {
                name: username
            }
        };
    },
    
    async onStoreDocument(data) {
        if(data.documentName === "global") {
            const tree = new YTree(data.document.getMap("pages") as YMap<any>);
            
            const nodes = new Set(tree.getAllNodes().map(n => `doc:${n.id()}`));
            const docs = new Set(
                (await sqlite.getDocumentNames())
                    .filter(n => n.startsWith("doc:"))
            );
            
            const deletedDocs = docs.difference(nodes);
            if(deletedDocs.size === 0) {
                return;
            }
            
            console.log(`Cleaning up ${deletedDocs.size} deleted documents: ${[...deletedDocs].join(", ")}`);
            
            for(const doc of deletedDocs) {
                hocuspocus.closeConnections(doc);
                hocuspocus.documents.delete(doc);
            }
            sqlite.removeDocument(Array.from(deletedDocs));
        }
    },
    
    extensions: [sqlite],
});



const app = new Hono();

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

const socketHandler = upgradeWebSocket((c) => ({
    onOpen(_evt, ws) {
        const req = {
            ...c.req.raw,
            headers: {
                cookie: c.req.header("cookie") || ""
            }
        };
        hocuspocus.handleConnection(ws.raw!, req as any);
    }
}));

app.get("ws", socketHandler);

// All other paths host the SPA
app.get('*', serveStatic({
    root: "../static",
    async getContent(route, c) {
        // Try to serve the requested file, fallback to index.html for SPA routing
        try {
            const filePath = path.join(__dirname, "../static", route);
            const file = await fs.readFile(filePath);
            return new Response(file);
        } catch (e) {
            const indexPath = path.join(__dirname, "../static/index.html");
            const indexFile = await fs.readFile(indexPath);
            return new Response(indexFile);
        }
    }
}));

addAuthRoutes(app);

const server = serve({
    fetch: app.fetch,
    port: 3000,
}, (info) => {
    hocuspocus.hooks('onListen', {
        instance: hocuspocus,
        configuration: hocuspocus.configuration,
        port: info.port
    });
});

injectWebSocket(server);