import { DocumentID } from "@shared/connection/Document";
import { DataStore } from "../DataStore";
import { DocSchemaToTopLevel, RawStorageProvider } from "./RawStorageProvider";
import { CalendarArchiveSchema } from "@shared/calendar/archive";
import { YDoc } from "@shared/typedYjs";

export class CalendarArchiveProvider extends RawStorageProvider {
    constructor(dataStore: DataStore) {
        super(dataStore, "calendar-archive", {
            meta: "map",
            "v1-data": "map"
        } as const satisfies DocSchemaToTopLevel<CalendarArchiveSchema>);
    }
    
    public createInitialDocument(id: DocumentID, doc: YDoc<CalendarArchiveSchema>): void {
        // Validate the ID to be in the format `year:month`
        const match = /^calendar-archive:(\d{4}):(\d{1,2})$/.exec(id);
        if(!match) {
            throw new Error(`Invalid calendar archive ID format: ${id}`);
        }

        const year = parseInt(match[1]);
        const month = parseInt(match[2]);

        const metaMap = doc.getMap("meta");
        metaMap.set("year", year);
        metaMap.set("month", month);
        metaMap.set("createdAt", new Date().toISOString());
        metaMap.set("version", 1);
        
        console.log(`Created initial document for calendar archive ${id}`);
    }
}