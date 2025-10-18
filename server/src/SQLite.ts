import { mkdirSync } from "fs";
import sqlite3 from "sqlite3";
import { Database, DatabaseConfiguration } from "./Database";

const schema = `CREATE TABLE IF NOT EXISTS "documents" (
  "name" varchar(255) NOT NULL,
  "data" blob NOT NULL,
  UNIQUE(name)
);

CREATE TABLE IF NOT EXISTS "sessions" (
  "session_id" varchar(255) NOT NULL,
  "username" varchar(255) NOT NULL,
  "created_at" datetime DEFAULT CURRENT_TIMESTAMP,
  "expires_at" datetime,
  UNIQUE(session_id)
)`;

const selectQuery = `
  SELECT data FROM "documents" WHERE name = $name ORDER BY rowid DESC
`;

const upsertQuery = `
  INSERT INTO "documents" ("name", "data") VALUES ($name, $data)
    ON CONFLICT(name) DO UPDATE SET data = $data
`;

const listDocumentsQuery = `
  SELECT name FROM "documents" ORDER BY name
`;

const deleteDocumentQuery = `
  DELETE FROM "documents" WHERE name = $name
`;

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

export interface SQLiteConfiguration extends DatabaseConfiguration {
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

export class SQLite extends Database {
	db?: sqlite3.Database;

	configuration: SQLiteConfiguration = {
		database: SQLITE_INMEMORY,
		schema,
		fetch: async ({ documentName }) => {
			return new Promise((resolve, reject) => {
				this.db?.get(
					selectQuery,
					{
						$name: documentName,
					},
					(error, row) => {
						if (error) {
							reject(error);
						}

						resolve((row as any)?.data);
					},
				);
			});
		},
		store: async ({ documentName, state }) => {
			this.db?.run(upsertQuery, {
				$name: documentName,
				$data: state,
			});
		},
	};

	constructor(configuration?: Partial<SQLiteConfiguration>) {
		super({});

		this.configuration = {
			...this.configuration,
			...configuration,
		};
	}

	async onConfigure() {
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

	async onListen() {
		if(this.configuration.database === SQLITE_INMEMORY) {
			console.warn("The SQLite extension is configured as an in-memory database. All changes will be lost on restart!");
		}
	}

	/**
	 * Get the names of all documents in the database
	 */
	async getDocumentNames(): Promise<string[]> {
		return new Promise((resolve, reject) => {
			this.db?.all(
				listDocumentsQuery,
				(error, rows) => {
					if(error) {
						reject(error);
					} else {
						resolve((rows as any[])?.map(row => row.name) || []);
					}
				}
			);
		});
	}

	/**
	 * Remove one or more documents from the database entirely
	 */
	async removeDocument(documentNames: string | string[]): Promise<void> {
		const names = Array.isArray(documentNames) ? documentNames : [documentNames];
		
		if (names.length === 0) {
			return Promise.resolve();
		}

		return new Promise((resolve, reject) => {
			if (names.length === 1) {
				// Single document removal
				this.db?.run(
					deleteDocumentQuery,
					{
						$name: names[0],
					},
					(error) => {
						if(error) {
							reject(error);
						} else {
							resolve();
						}
					}
				);
			} else {
				// Batch removal using IN clause
				const placeholders = names.map(() => '?').join(',');
				const batchDeleteQuery = `DELETE FROM "documents" WHERE name IN (${placeholders})`;
				
				this.db?.run(
					batchDeleteQuery,
					names,
					(error) => {
						if(error) {
							reject(error);
						} else {
							resolve();
						}
					}
				);
			}
		});
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


// Global sqlite instance because I don't want to pass it around everywhere
mkdirSync('data', { recursive: true });
export const sqlite = new SQLite({
    database: 'data/db.sqlite'
});

// Clean up expired sessions every hour
setInterval(() => {
    sqlite.cleanupExpiredSessions().catch(console.error);
}, 60 * 60 * 1000);