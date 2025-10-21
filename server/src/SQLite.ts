import sqlite3 from "sqlite3";

const schema = `
CREATE TABLE IF NOT EXISTS "sessions" (
  "session_id" varchar(255) NOT NULL,
  "username" varchar(255) NOT NULL,
  "created_at" datetime DEFAULT CURRENT_TIMESTAMP,
  "expires_at" datetime,
  UNIQUE(session_id)
)`;

const insertSessionQuery = `
  INSERT INTO "sessions" ("session_id", "username", "expires_at") VALUES ($session_id, $username, $expires_at)
    ON CONFLICT(session_id) DO UPDATE SET username = $username, expires_at = $expires_at
`;

const selectSessionQuery = `
  SELECT username FROM "sessions" WHERE session_id = $session_id AND (expires_at IS NULL OR expires_at > datetime('now'))
`;

const deleteSessionQuery = `
  DELETE FROM "sessions" WHERE session_id = $session_id
`;

const cleanupExpiredSessionsQuery = `
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
	db?: sqlite3.Database;

	configuration: SQLiteConfiguration = {
		database: SQLITE_INMEMORY,
		schema
	};

	constructor(configuration?: Partial<SQLiteConfiguration>) {
		this.configuration = {
			...this.configuration,
			...configuration,
		};
	}

	async initialize() {
		this.db = new sqlite3.Database(this.configuration.database);
		// Split the schema by semicolons and run each statement
        // Not perfect, but it works for us
		const statements = this.configuration.schema.split(';').map(s => s.trim()).filter(Boolean);
		for(const stmt of statements) {
			await new Promise((resolve, reject) => {
				this.db!.run(stmt, (err) => {
					if(err) reject(err);
					else resolve(undefined);
				});
			});
		}
	}

	/**
	 * Create a new session or update an existing one
	 */
	async createSession(sessionId: string, username: string, expiresAt?: Date): Promise<void> {
		return new Promise((resolve, reject) => {
			this.db?.run(
				insertSessionQuery,
				{
					$session_id: sessionId,
					$username: username,
					$expires_at: expiresAt ? expiresAt.toISOString() : null,
				},
				(error) => {
					if(error) {
						reject(error);
					} else {
						resolve();
					}
				}
			);
		});
	}

	/**
	 * Get the username for a session if it exists and hasn't expired
	 */
	async getSession(sessionId: string): Promise<string | undefined> {
		return new Promise((resolve, reject) => {
			this.db?.get(
				selectSessionQuery,
				{
					$session_id: sessionId,
				},
				(error, row) => {
					if (error) {
						reject(error);
					} else {
						resolve((row as any)?.username);
					}
				}
			);
		});
	}

	/**
	 * Delete a session
	 */
	async deleteSession(sessionId: string): Promise<void> {
		return new Promise((resolve, reject) => {
			this.db?.run(
				deleteSessionQuery,
				{
					$session_id: sessionId,
				},
				(error) => {
					if(error) {
						reject(error);
					} else {
						resolve();
					}
				}
			);
		});
	}

	/**
	 * Clean up expired sessions
	 */
	async cleanupExpiredSessions(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.db?.run(
				cleanupExpiredSessionsQuery,
				(error) => {
					if(error) {
						reject(error);
					} else {
						resolve();
					}
				}
			);
		});
	}
}