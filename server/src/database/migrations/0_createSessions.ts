import { Kysely, sql } from 'kysely'
import { DatabaseSchema } from '../types';

export async function up(db: Kysely<DatabaseSchema>): Promise<void> {
    // CREATE TABLE "sessions" (
    //     "session_id" varchar(255) NOT NULL,
    //     "username" varchar(255) NOT NULL,
    //     "created_at" datetime DEFAULT CURRENT_TIMESTAMP,
    //     "expires_at" datetime,
    //     UNIQUE(session_id)
    // )

    await db.schema.createTable('sessions')
        .ifNotExists()
        .addColumn('session_id', 'varchar(255)',
            (col) => col.notNull())
        .addColumn('username', 'varchar(255)',
            (col) => col.notNull())
        .addColumn('created_at', 'datetime',
            (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
        .addColumn('expires_at', 'datetime')
        .addPrimaryKeyConstraint('pk_sessions', ['session_id'])
        .execute();
}

export async function down(db: Kysely<DatabaseSchema>): Promise<void> {
    await db.schema.dropTable('sessions').execute();
}