import Sqlite3 from "better-sqlite3";
import { CompiledQuery, FileMigrationProvider, Kysely, Migrator, sql, SqliteDialect } from "kysely";
import { DatabaseSchema } from "./types";
import path from "path";
import { promises as fs } from 'fs';
import { SessionsModule } from "./sessions";
import { DatabaseModule } from "./DatabaseModule";

export class Database {
	private db: Kysely<DatabaseSchema>;
	private modules: DatabaseModule[] = [];
	private add<T extends DatabaseModule>(mod: T): T {
		this.modules.push(mod);
		return mod;
	}

	public sessions: SessionsModule;

	/**
	 * @param database The database path, or `:memory:` for in-memory database
	 */
	constructor(private database: string) {
		this.db = new Kysely<DatabaseSchema>({
			dialect: new SqliteDialect({
				database: new Sqlite3(this.database)
			})
		});

		this.sessions = this.add(new SessionsModule(this.db));
	}

	public async initialize() {
		sql`PRAGMA journal_mode=WAL`.execute(this.db); // improves performance... supposedly

		// https://kysely.dev/docs/migrations
		const migrator = new Migrator({
			db: this.db,
			provider: new FileMigrationProvider({
				fs,
				path,
				// This needs to be an absolute path.
				migrationFolder: path.join(__dirname, 'migrations'),
			})
		})

		const { error, results } = await migrator.migrateToLatest()

		results?.forEach(({ status, migrationName }) => {
			if(status === 'Success') {
				console.log(`Migration "${migrationName}" executed successfully`)
			} else if(status === 'Error') {
				console.error(`Failed to execute migration "${migrationName}"`)
			}
		})

		if(error) {
			console.error("Failed to migrate database")
			console.error(error)
			process.exit(1)
		}

		this.modules.forEach(m => m.setIntervals());
	}

	public async close() {
		this.modules.forEach(m => m.clearIntervals());
		await this.db.destroy();
	}
}