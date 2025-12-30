import { Generated, Kysely } from "kysely";
import { DatabaseSchema } from "../types";
import { DatabaseModule } from "../DatabaseModule";

export interface CalendarArchiveTable {
    /** A unique ID for the event */
    event_id: Generated<number | null>;
    /** The type of event */
    type: string;
    
    /** The start datetime in UTC as Unix seconds */
    start_datetime_utc: number;
    /** The end datetime in UTC as Unix seconds */
    end_datetime_utc: number;
    
    /** The creation timestamp as an ISO date string */
    created_at: Generated<string>;
    /** The last updated timestamp as an ISO date string */
    updated_at: Generated<string>;
    
    /** The data version; defaults to 1 but should be set explicitly */
    version: Generated<number>;
    /** The event data as a JSON string */
    data: string;
}


export class CalendarArchiveModule extends DatabaseModule {
    constructor(db: Kysely<DatabaseSchema>) {
        super(db);
        // every 5 minutes on the minute
        this.addCronTask(this.archiveOldEvents, '*/5 * * * *');
    }

    private async archiveOldEvents(): Promise<void> {
        // TODO
        // Only if in development, log
        if(process.env.NODE_ENV === 'development') {
            console.log("todo: archive old calendar events");
        }
    }
}