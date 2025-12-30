import Sqlite3 from "better-sqlite3";
import { FileMigrationProvider, Kysely, Migrator, sql, SqliteDialect } from "kysely";
import { DatabaseSchema } from "./types";
import { SessionsModule } from "./modules/sessions";
import { DatabaseModule } from "./DatabaseModule";
import { CalendarArchiveModule } from "./modules/calendarArchive";
import { ListMigrationProvider } from "./ListMigrationProvider";

export class Database {
	private db: Kysely<DatabaseSchema>;
	private modules: DatabaseModule[] = [];
	private add<T extends DatabaseModule>(mod: T): T {
		this.modules.push(mod);
		return mod;
	}

	public sessions: SessionsModule;
	public calendarArchive: CalendarArchiveModule;

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
		this.calendarArchive = this.add(new CalendarArchiveModule(this.db));
	}

	public async initialize() {
		sql`PRAGMA journal_mode=WAL`.execute(this.db); // improves performance... supposedly

		// https://kysely.dev/docs/migrations
		const migrator = new Migrator({
			db: this.db,
			provider: new ListMigrationProvider({
				'0_createSessions': await import('./migrations/0_createSessions'),
				'1_createCalendarArchive': await import('./migrations/1_createCalendarArchive'),
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

		this.modules.forEach(m => m.init());
	}

	public async close() {
		this.modules.forEach(m => m.destroy());

		await this.db.destroy();
	}
}