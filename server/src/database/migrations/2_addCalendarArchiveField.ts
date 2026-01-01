import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
	// Add the "archived" column to the "calendar_archive" table
	await db.schema
		.alterTable('calendar_archive')
		.addColumn('archived', 'boolean',
			col => col.notNull().defaultTo(false))
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	// Remove the "archived" column from the "calendar_archive" table
	await db.schema
		.alterTable('calendar_archive')
		.dropColumn('archived')
		.execute();
}
