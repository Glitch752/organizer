import type { CalendarArchiveTable } from "./modules/calendarArchive";
import type { SessionsTable } from "./modules/sessions";

export interface DatabaseSchema {
    calendar_archive: CalendarArchiveTable,
    sessions: SessionsTable
}