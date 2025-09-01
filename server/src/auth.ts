import { configDotenv } from "dotenv";
import { createMiddleware } from "hono/factory"
import crypto from "crypto"
import { Hono, HonoRequest } from "hono";
import z from "zod";
import { zValidator } from "@hono/zod-validator";
import { IncomingHttpHeaders } from "http";
import { sqlite } from "./SQLite.js";

configDotenv();

const users: {
    username: string;
    passwordHash: string;
}[] = [];

if(!process.env.USERS) {
    throw new Error("No users provided. The USERS environment variable must be set.");
}

// The USERS environment variable should be in the format:
// USERS=user1:password1,user2:$hashedpassword2
// You can generate a hashed password using the following command:
// echo -n "password" | sha256sum | awk '{print $1}'

for(const user of process.env.USERS.split(",")) {
    const [username, password] = user.split(":");
    if(!username || !password) {
        throw new Error("Invalid user format");
    }
    
    if(!password.startsWith("$")) {
        const passwordHash = crypto.createHash("sha256").update(password).digest("hex");
        users.push({
            username,
            passwordHash,
        });
    } else {
        users.push({
            username,
            passwordHash: password.slice(1), // Already hashed
        });
    }
}

console.log(`Loaded ${users.length} users`);

export async function createSession(user: string): Promise<string> {
    const sid = crypto.randomBytes(16).toString("hex");
    // Sessions expire after 30 days
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await sqlite.createSession(sid, user, expiresAt);
    return sid;
}

export async function getSession(sid?: string): Promise<string | undefined> {
    if(!sid) return undefined;
    return await sqlite.getSession(sid);
}

export async function deleteSession(sid?: string): Promise<void> {
    if(!sid) return;
    await sqlite.deleteSession(sid);
}

function getCookie(request: HonoRequest | string, name: string): string | undefined {
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

export const authMiddleware = createMiddleware<{ Variables: { user: string | null } }>(async (c, next) => {
    const sid = getCookie(c.req, "sid");
    const username = await getSession(sid);
    if(!username) {
        c.set("user", null);
        return c.text("Unauthorized", 401);
    }

    c.set("user", username);
    return await next();
});

export async function checkAuth(requestHeaders: IncomingHttpHeaders): Promise<string | null> {
    let cookieHeader = requestHeaders["cookie"];
    if(!cookieHeader) return null;

    const sid = getCookie(cookieHeader, "sid");
    const username = await getSession(sid);

    return username || null;
}


export function addAuthRoutes(app: Hono) {
    app.post(
        "/login",
        zValidator("json", z.object({ username: z.string(), password: z.string() })),
        async (c) => {
            const { username, password } = c.req.valid("json");
            const user = users.find(u => u.username === username);
            if(!user) return c.text("Invalid credentials", 401);
                
            const hash = crypto.createHash("sha256").update(password).digest("hex");
            // Technically, the proper way to do this securely is to use a timing-safe comparison
            // Do we really care about this kind of thing? Probably not, but let's do it anyway.
            const bufA = Buffer.from(hash, "hex");
            const bufB = Buffer.from(user.passwordHash, "hex");
            const match = bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
            if(!match) return c.text("Invalid credentials", 401);
                
            const sid = await createSession(user.username);
            c.header(
                "Set-Cookie",
                `sid=${sid}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${30 * 24 * 60 * 60}` + (process.env.NODE_ENV === "production" ? "; Secure" : "")
            );
            return c.text("Logged in");
        }
    );

    app.post("/logout", async (c) => {
        const sid = getCookie(c.req, "sid");
        await deleteSession(sid);
        c.header(
            "Set-Cookie",
            `sid=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0` + (process.env.NODE_ENV === "production" ? "; Secure" : "")
        );
        return c.text("Logged out");
    });
}