import { WSContext } from "hono/ws";
import WebSocket from 'ws';
import { Connection } from "./Connection";
import { SQLite } from "./SQLite";
import { AuthService } from "./AuthService";
import { mkdirSync } from "node:fs";
import { Hono } from "hono";
import { IncomingHttpHeaders } from "http";
import { PermissionStatus } from "@shared/connection/Permissions";
import { AUTHENTICATION_FAILED_CODE } from "@shared/connection/Messages";
import { DataStore } from "./DataStore";

export class Backend {
    private connectedClients: Map<WSContext<WebSocket.WebSocket>, Connection> = new Map();
    private db: SQLite;
    private authService: AuthService;
    private dataStore: DataStore;

    constructor() {
        mkdirSync('data', { recursive: true });
        this.db = new SQLite({
            database: 'data/db.sqlite'
        });
        this.authService = new AuthService(this.db);
        this.dataStore = new DataStore('data');
    }

    // Expose auth service methods
    public getAuthMiddleware() {
        return this.authService.getAuthMiddleware();
    }

    public async checkAuth(requestHeaders: IncomingHttpHeaders): Promise<string | null> {
        return await this.authService.checkAuth(requestHeaders);
    }

    public addAuthRoutes(app: Hono) {
        this.authService.addAuthRoutes(app);
    }

    public async onListen(port: number) {
        console.log(`Server listening on port ${port}`)
        await this.db.initialize();
    }

    /**
     * @param ws The Hono websocket context
     * @param cookie Cookie header for authentication
     */
    public async handleConnection(ws: WSContext<WebSocket.WebSocket>, cookie: string) {
        if(!ws.raw) {
            console.error("No raw WebSocket found in context");
            return;
        }

        // Authenticate the connection using the cookie
        const username = await this.authService.authenticateWithCookie(cookie);
        
        if(!username) {
            console.log("WebSocket connection rejected: invalid or missing authentication");
            ws.close(AUTHENTICATION_FAILED_CODE, "Authentication required");
            return;
        }
        
        console.log(`New WebSocket connection established with client (user: ${username})`);

        const connection = new Connection(ws.raw, username);
        connection.permissionStatus =
            // Kinda hacky. Hopefully temporary but probably not.
            await this.checkAuth({ cookie }) ? PermissionStatus.ReadWrite : PermissionStatus.Unauthenticated;
        
        this.connectedClients.set(ws, connection);

        connection.sendAuthenticatedMessage();
    }

    public handleDisconnection(ws: WSContext<WebSocket.WebSocket>) {
        console.log("WebSocket connection closed");
        this.connectedClients.delete(ws);
    }
}