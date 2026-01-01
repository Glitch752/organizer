import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createTable('calendar_archive')

		.addColumn('event_id', 'integer',
            col => col.primaryKey().autoIncrement())
		.addColumn('type', 'text',
            col => col.notNull())
        
		// timestamps as integer Unix seconds
		.addColumn('start_datetime_utc', 'integer',
            col => col.notNull())
		.addColumn('end_datetime_utc', 'integer',
            col => col.notNull())
        
		// created_at/updated_at as date strings
		.addColumn('created_at', 'text',
            col => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
        .addColumn('updated_at', 'text',
            col => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
        
		.addColumn('version', 'integer',
            col => col.notNull().defaultTo(1))
        
		// JSON payload stored as text since SQLite has no native JSON type
		.addColumn('data', 'text',
            col => col.notNull())

		.execute();

	// index to speed up range/time queries
	await db.schema
		.createIndex('idx_calendar_archive_times')
		.on('calendar_archive')
		.columns(['start_datetime_utc', 'end_datetime_utc'])
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropIndex('idx_calendar_archive_times').execute();
	await db.schema.dropTable('calendar_archive').execute();
}