import { Migration, MigrationProvider } from "kysely";

export class ListMigrationProvider implements MigrationProvider {
    constructor(private migrations: Record<string, Migration>) {}

    getMigrations(): Promise<Record<string, Migration>> {
        return Promise.resolve(this.migrations);
    }
}