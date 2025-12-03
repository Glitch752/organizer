import { Generated, Kysely, sql } from "kysely";
import type { DatabaseSchema } from "../types";
import { DatabaseModule } from "../DatabaseModule";

export type SessionID = string & { readonly __session_id: unique symbol };

export interface SessionsTable {
    session_id: SessionID;
    username: string;
    /** ISO date string */
    created_at: Generated<string | null>;
    /** ISO date string or null */
    expires_at: string | null;
}

export class SessionsModule extends DatabaseModule {
    constructor(db: Kysely<DatabaseSchema>) {
        super(db);
        this.addInterval(this.cleanup, 60 * 60 * 1000);
    }

	/**
	 * Create a new session or update an existing one
	 */
	public async create(sessionId: SessionID, username: string, expiresAt?: Date): Promise<void> {
        await this.db.insertInto('sessions')
            .values({
                session_id: sessionId,
                username: username,
                expires_at: expiresAt ? expiresAt.toISOString() : null,
            })
            .onConflict((oc) =>
                oc.column('session_id')
                    .doUpdateSet({
                        username: username,
                        expires_at: expiresAt ? expiresAt.toISOString() : null,
                    })
            )
            .execute()
	}

	/**
	 * Get the username for a session if it exists and hasn't expired
	 */
	public async get(sessionId: SessionID): Promise<string | undefined> {
        // TODO: Update expires_at
        return (await this.db.selectFrom('sessions')
            .select('username')
            .where('session_id', '=', sessionId)
            .where((eb) =>
                eb('expires_at', 'is', null).or(
                    sql`datetime('now')`, '<=', eb.ref('expires_at')
                )
            )
            .executeTakeFirst())?.username
	}

	/**
	 * Delete a session
	 */
	public async delete(sessionId: SessionID): Promise<void> {
        await this.db.deleteFrom('sessions')
            .where('session_id', '=', sessionId)
            .execute()
	}

	/**
	 * Clean up expired sessions. Run periodically to avoid the session table growing indefinitely.
	 */
	private async cleanup(): Promise<void> {
        await this.db.deleteFrom('sessions')
            .where('expires_at', 'is not', null)
            .where('expires_at', '<=', 'datetime("now")')
            .execute()
	}
}