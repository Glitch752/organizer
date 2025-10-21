import { createMiddleware } from "hono/factory";
import crypto from "crypto";
import { Hono, HonoRequest } from "hono";
import z from "zod";
import { zValidator } from "@hono/zod-validator";
import { IncomingHttpHeaders } from "http";
import { SQLite } from "./SQLite";

interface User {
    username: string;
    passwordHash: string;
}

export class AuthService {
    private users: User[] = [];
    private db: SQLite;

    constructor(database: SQLite) {
        this.db = database;
        this.initializeUsers();
    }

    private initializeUsers() {
        if(!process.env.USERS) {
            throw new Error("No users provided. The USERS environment variable must be set.");
        }

        for(const user of process.env.USERS.split(",")) {
            const [username, password] = user.split(":");
            if(!username || !password) {
                throw new Error("Invalid user format");
            }
            
            if(!password.startsWith("$")) {
                const passwordHash = crypto.createHash("sha256").update(password).digest("hex");
                this.users.push({
                    username,
                    passwordHash,
                });
            } else {
                this.users.push({
                    username,
                    passwordHash: password.slice(1), // Already hashed
                });
            }
        }

        // The USERS environment variable should be in the format:
        // USERS=user1:password1,user2:$hashedpassword2
        // You can generate a hashed password using the following command:
        // echo -n "password" | sha256sum | awk '{print $1}'

        console.log(`Loaded ${this.users.length} users`);
    }

    public async createSession(user: string): Promise<string> {
        const sid = crypto.randomBytes(16).toString("hex");
        // Sessions expire after 30 days
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await this.db.createSession(sid, user, expiresAt);
        return sid;
    }

    public async getSession(sid?: string): Promise<string | undefined> {
        if(!sid) return undefined;
        return await this.db.getSession(sid);
    }

    public async deleteSession(sid?: string): Promise<void> {
        if(!sid) return;
        await this.db.deleteSession(sid);
    }

    private getCookie(request: HonoRequest | string, name: string): string | undefined {
        let cookieHeader: string | undefined;

        if(typeof request === "string") {
            cookieHeader = request;
        } else {
            cookieHeader = request.header("cookie");
            if(!cookieHeader) return undefined;
        }
        
        const cookies = cookieHeader.split(";").map(cookie => cookie.trim());
        for(const cookie of cookies) {
            const [cookieName, cookieValue] = cookie.split("=");
            if(cookieName === name) {
                return decodeURIComponent(cookieValue);
            }
        }
    }

    public getAuthMiddleware() {
        return createMiddleware<{ Variables: { user: string | null } }>(async (c, next) => {
            const sid = this.getCookie(c.req, "sid");
            const username = await this.getSession(sid);
            if(!username) {
                c.set("user", null);
                return c.text("Unauthorized", 401);
            }

            c.set("user", username);
            return await next();
        });
    }

    public async checkAuth(requestHeaders: IncomingHttpHeaders): Promise<string | null> {
        let cookieHeader = requestHeaders["cookie"];
        if(!cookieHeader) return null;

        const sid = this.getCookie(cookieHeader, "sid");
        const username = await this.getSession(sid);

        return username ?? null;
    }

    public async authenticateWithCookie(cookie: string): Promise<string | null> {
        const sid = this.getCookie(cookie, "sid");
        const username = await this.getSession(sid);
        return username ?? null;
    }

    public addAuthRoutes(app: Hono) {
        app.post(
            "/login",
            zValidator("json", z.object({ username: z.string(), password: z.string() })),
            async (c) => {
                const { username, password } = c.req.valid("json");
                const user = this.users.find(u => u.username === username);
                if(!user) return c.text("Invalid credentials", 401);
                    
                const hash = crypto.createHash("sha256").update(password).digest("hex");
                // Technically, the proper way to do this securely is to use a timing-safe comparison
                // Do we really care about this kind of thing? Probably not, but let's do it anyway.
                const bufA = Buffer.from(hash, "hex");
                const bufB = Buffer.from(user.passwordHash, "hex");
                const match = bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
                if(!match) return c.text("Invalid credentials", 401);
                    
                const sid = await this.createSession(user.username);
                c.header(
                    "Set-Cookie",
                    `sid=${sid}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${30 * 24 * 60 * 60}` + (process.env.NODE_ENV === "production" ? "; Secure" : "")
                );
                return c.text("Logged in");
            }
        );

        app.post("/logout", async (c) => {
            const sid = this.getCookie(c.req, "sid");
            await this.deleteSession(sid);
            c.header(
                "Set-Cookie",
                `sid=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0` + (process.env.NODE_ENV === "production" ? "; Secure" : "")
            );
            return c.text("Logged out");
        });
    }
}
