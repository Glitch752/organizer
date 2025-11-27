import { configDotenv } from "dotenv";

configDotenv();

import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import { serveStatic } from "hono/serve-static";
import path from "path";
import fs from "fs/promises";
import { Backend } from "./Backend";

const backend = new Backend();

const app = new Hono();

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });
app.get("ws", upgradeWebSocket((c) => ({
    async onOpen(_evt, ws) {
        await backend.handleConnection(ws, c.req.header("cookie") ?? "");
    },
    onClose(_evt, ws) {
        backend.handleDisconnection(ws);
    },
})));

// All other paths host the SPA
app.get('*', serveStatic({
    async getContent(route, c) {
        // Try to serve the requested file, fallback to index.html for SPA routing
        try {
            const filePath = path.join(__dirname, "static", route);
            const file = await fs.readFile(filePath);

            // Determine mime type based on file extension
            // Hacky, but whatever
            const ext = path.extname(filePath).toLowerCase();
            let contentType = "application/octet-stream";
            if(ext === ".html") contentType = "text/html";
            else if(ext === ".js") contentType = "application/javascript";
            else if(ext === ".css") contentType = "text/css";
            else if(ext === ".json") contentType = "application/json";
            else if(ext === ".png") contentType = "image/png";
            else if(ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
            else if(ext === ".svg") contentType = "image/svg+xml";
            else if(ext === ".ico") contentType = "image/x-icon";
            else if(ext === ".txt") contentType = "text/plain";
            else if(ext === ".woff") contentType = "font/woff";
            else if(ext === ".woff2") contentType = "font/woff2";
            else if(ext === ".ttf") contentType = "font/ttf";
            else if(ext === ".map") contentType = "application/json";

            return new Response(file, {
                headers: {
                    'Content-Type': contentType
                }
            });
        } catch (e) {
            const indexPath = path.join(__dirname, "static", "index.html");
            const indexFile = await fs.readFile(indexPath);
            return new Response(indexFile, {
                headers: {
                    'Content-Type': 'text/html'
                }
            });
        }
    }
}));

backend.addAuthRoutes(app);

const server = serve({
    fetch: app.fetch,
    port: 3000,
}, async (info) => {
    await backend.onListen(info.port);
});

injectWebSocket(server);