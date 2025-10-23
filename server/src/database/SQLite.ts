import Sqlite3 from "better-sqlite3";

export type SessionID = string & { readonly __session_id: unique symbol };

function sql(strings: TemplateStringsArray, ...values: any[]) {
	return strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '');
}

const schema = sql`
CREATE TABLE IF NOT EXISTS "sessions" (
  "session_id" varchar(255) NOT NULL,
  "username" varchar(255) NOT NULL,
  "created_at" datetime DEFAULT CURRENT_TIMESTAMP,
  "expires_at" datetime,
  UNIQUE(session_id)
)`;

const insertSessionQuery = sql`
  INSERT INTO "sessions" ("session_id", "username", "expires_at") VALUES ($session_id, $username, $expires_at)
    ON CONFLICT(session_id) DO UPDATE SET username = $username, expires_at = $expires_at
`;

const selectSessionQuery = sql`
  SELECT username FROM "sessions" WHERE session_id = $session_id AND (expires_at IS NULL OR expires_at > datetime('now'))
`;

const deleteSessionQuery = sql`
  DELETE FROM "sessions" WHERE session_id = $session_id
`;

const cleanupExpiredSessionsQuery = sql`
  DELETE FROM "sessions" WHERE expires_at IS NOT NULL AND expires_at <= datetime('now')
`;

const SQLITE_INMEMORY = ":memory:";

export interface SQLiteConfiguration {
	/**
	 * Valid values are filenames, ":memory:" for an anonymous in-memory database and an empty
	 * string for an anonymous disk-based database. Anonymous databases are not persisted and
	 * when closing the database handle, their contents are lost.
	 *
	 * https://github.com/mapbox/node-sqlite3/wiki/API#new-sqlite3databasefilename-mode-callback
	 */
	database: string;
	/**
	 * The database schema to create.
	 */
	schema: string;
}

export class SQLite {
	db?: Sqlite3.Database;

	configuration: SQLiteConfiguration = {
		database: SQLITE_INMEMORY,
		schema
	};

	constructor(configuration?: Partial<SQLiteConfiguration>) {
		this.configuration = {
			...this.configuration,
			...configuration,
		};

		// Periodically clean up expired sessions
		setInterval(() => {
			this.cleanupExpiredSessions();
		}, 60 * 60 * 1000);
	}

	public initialize() {
		this.db = new Sqlite3(this.configuration.database);
		this.db.pragma('journal_mode = WAL'); // Dramatically improves performance

		// Split the schema by semicolons and run each statement
        // Not perfect, but it works for us
		const statements = this.configuration.schema.split(';').map(s => s.trim()).filter(Boolean);
		for(const stmt of statements) {
			this.db.exec(stmt);
		}
	}

	/**
	 * Create a new session or update an existing one
	 */
	public createSession(sessionId: SessionID, username: string, expiresAt?: Date): void {
		this.db?.prepare(insertSessionQuery).run({
			session_id: sessionId,
			username: username,
			expires_at: expiresAt ? expiresAt.toISOString() : null,
		});
	}

	/**
	 * Get the username for a session if it exists and hasn't expired
	 */
	public getSession(sessionId: string): SessionID | undefined {
		const row = this.db?.prepare(selectSessionQuery).get({
			session_id: sessionId,
		}) as { username: string } | undefined;
		return row ? (row.username as SessionID) : undefined;
	}

	/**
	 * Delete a session
	 */
	public deleteSession(sessionId: SessionID): void {
		this.db?.prepare(deleteSessionQuery).run({
			session_id: sessionId,
		});
	}

	/**
	 * Clean up expired sessions. Run periodically to avoid the session table growing indefinitely.
	 */
	private cleanupExpiredSessions(): void {
		this.db?.prepare(cleanupExpiredSessionsQuery).run();
	}
}