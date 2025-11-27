import { defineConfig } from 'kysely-ctl';
import { SqliteDialect } from "kysely";
import Sqlite3 from "better-sqlite3";
import path from "path";

export default defineConfig({
	// replace me with a real dialect instance OR a dialect name + `dialectConfig` prop.
	dialect: new SqliteDialect({
		database: new Sqlite3(path.join(__dirname, "../data/db.sqlite"))
	}),
	migrations: {
		migrationFolder: path.join(__dirname, "../src/database/migrations"),
	},
	plugins: [],
	seeds: {
		seedFolder: "seeds",
	}
});
