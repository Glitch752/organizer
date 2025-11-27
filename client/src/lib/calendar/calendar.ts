import { Temporal } from "@js-temporal/polyfill";
import type { Client } from "../client";
import { AttributeType, EventConditionType, TimeType, type EventCondition, type EventTime } from "@shared/connection/attributes";
import { getWeekOfMonth, makePlainDate, parsePlainDate, parsePlainMonthDay, parsePlainTime, parseZonedDateTime, parseZonedTimeForDate } from "../datetime/time";
import type { HexString } from "@shared/connection/attributes/color";
import { SyncedDocument } from "../../connection/document";
import type { CalendarArchiveSchema } from "@shared/calendar/archive";
import { getSyncedDocumentAsync } from "../../connection";

export type CalendarObject = ({
    type: "deadline";
    time: Temporal.PlainTime;
    title: string;
} | {
    type: "event";
    /** If not specified, this event continues to the previous day */
    start?: Temporal.PlainTime;
    /** If not specified, this event continues to the next day */
    end?: Temporal.PlainTime;
    startDay: Temporal.PlainDate;
    endDay: Temporal.PlainDate;
    title: string;
} | {
    type: "allDayEvent";
    title: string;
}) & {
    pageId: string;
    attributeIndex: number;
    color?: HexString;
};

function undefEmpty(str: string | undefined): string | undefined {
    if(str?.trim().length === 0) return undefined;
    return str;
}

export enum CalendarViewType {
    Year,
    Month,
    Week
};

export class CalendarLoadingManager {
    /**
     * The archive documents, which store the events on past days, that are open.  
     * Keyed by `${year}-${month}` (month is 1-based).
     */
    private calendarArchiveDocuments: Map<string, SyncedDocument<CalendarArchiveSchema>> = new Map();
    /**
     * Promises for loading archive documents that are in the process of being loaded.  
     * Prevents duplicate loads.  
     * Keyed by `${year}-${month}` (month is 1-based).
     */
    private _loadingArchiveDocuments: Map<string, Promise<void>> = new Map();

    constructor(
        private client: Client,
        private viewType: CalendarViewType
    ) {
    }

    async getCalendarObjects(date: Temporal.PlainDate): Promise<CalendarObject[]> {
        if(!this.client.workspaceLoaded) await this.client.waitForWorkspaceLoad();

        // Ensure the archive for this date is loaded
        const archiveKey = `${date.year}-${date.month}`;
        if(this._loadingArchiveDocuments.has(archiveKey)) {
            await this._loadingArchiveDocuments.get(archiveKey);
        }
        if(!this.calendarArchiveDocuments.has(archiveKey)) {
            const loadPromise = (async () => {
                const doc = await getSyncedDocumentAsync<CalendarArchiveSchema>(
                    `calendar-archive:${date.year}:${date.month}`);

                this.calendarArchiveDocuments.set(archiveKey, doc);
                this._loadingArchiveDocuments.delete(archiveKey);
            })();
            this._loadingArchiveDocuments.set(archiveKey, loadPromise);
            await loadPromise;
        }

        const calendarArchiveDoc = this.calendarArchiveDocuments.get(archiveKey)!;

        // If the archive has data for the provided day, convert and return it
        const dayKey = makePlainDate(date);
        const v1Data = calendarArchiveDoc.doc.getMap("v1-data");
        if(v1Data.has(dayKey)) {
            const events = v1Data.get(dayKey)!;
            const objects: CalendarObject[] = [];
            for(const event of events.toArray()) {
                switch(event.type) {
                    case "deadline":
                        objects.push({
                            type: "deadline",
                            time: parsePlainTime(event.time),
                            pageId: event.pageId,
                            title: event.title,
                            color: event.color,
                            attributeIndex: -1 // Archive events have no attribute index
                        });
                        break;
                    case "event":
                        objects.push({
                            type: "event",
                            start: event.start ? parsePlainTime(event.start) : undefined,
                            end: event.end ? parsePlainTime(event.end) : undefined,
                            startDay: parsePlainDate(event.startDay),
                            endDay: parsePlainDate(event.endDay),
                            pageId: event.pageId,
                            title: event.title,
                            color: event.color,
                            attributeIndex: -1 // Archive events have no attribute
                        });
                        break;
                    case "allDayEvent":
                        objects.push({
                            type: "allDayEvent",
                            pageId: event.pageId,
                            title: event.title,
                            color: event.color,
                            attributeIndex: -1 // Archive events have no attribute
                        });
                        break;
                }
            }

            return objects;
        }

        // TODO: This is so so so inefficient and terrible lol
        const attributePages = this.client.getAllAttributes();
        
        const objects: CalendarObject[] = [];
        for(const { pageId, attributes: attrs } of attributePages) {
            for(const [attributeIndex, attr] of attrs.entries()) {
                if(attr.type === AttributeType.CalendarDeadline) {
                    if(!attr.enabled) continue;

                    const zdt = parseZonedDateTime(attr.due).withTimeZone(Temporal.Now.timeZoneId());
                    const deadline = zdt.toPlainDate();
                    if(Temporal.PlainDate.compare(deadline, date) === 0) {
                        objects.push({
                            type: "deadline",
                            time: zdt.toPlainTime(),
                            pageId,
                            attributeIndex,
                            color: attr.color,
                            title: undefEmpty(attr.title) ?? this.client.pageTree.getNode(pageId)?.get("name") ?? "No title"
                        });
                    }
                } else if(attr.type === AttributeType.CalendarEvent) {
                    if(!attr.enabled) continue;
                    if(this.viewType !== CalendarViewType.Week && attr.weekViewOnly) continue;
                    
                    for(const time of attr.times) {
                        objects.push(...getEventTimeObjects(
                            time,
                            date,
                            pageId,
                            attributeIndex,
                            attr.color,
                            undefEmpty(attr.title) ?? this.client.pageTree.getNode(pageId)?.get("name") ?? "No title"
                        ));
                    }
                }
            }
        }

        return objects.sort((a, b) => {
            // All-day events first
            if(a.type === "allDayEvent" && b.type !== "allDayEvent") return -1;
            if(b.type === "allDayEvent" && a.type !== "allDayEvent") return 1;
            if(a.type === "allDayEvent" || b.type === "allDayEvent") return 0;
            
            // Deadlines and events by start time
            const aTime = a.type === "deadline" ? a.time : a.start ?? Temporal.PlainTime.from("00:00");
            const bTime = b.type === "deadline" ? b.time : b.start ?? Temporal.PlainTime.from("00:00");
            return Temporal.PlainTime.compare(aTime, bTime);
        });
    }

    public unload() {
        for(const doc of this.calendarArchiveDocuments.values()) {
            doc.release();
        }
    }
}

function getEventTimeObjects(
    time: EventTime,
    date: Temporal.PlainDate,
    pageId: string,
    attributeIndex: number,
    color: HexString | undefined,
    title: string
): CalendarObject[] {
    switch(time.type) {
        case TimeType.Single: {
            const startDate = parseZonedDateTime(time.start).withTimeZone(Temporal.Now.timeZoneId());
            const endDate = parseZonedDateTime(time.end).withTimeZone(Temporal.Now.timeZoneId());
            const startPlain = startDate.toPlainDate();
            const endPlain = endDate.toPlainDate();
            if(Temporal.PlainDate.compare(startPlain, date) <= 0 &&
                Temporal.PlainDate.compare(endPlain, date) >= 0) {
                let startTime: Temporal.PlainTime | undefined = undefined;
                let endTime: Temporal.PlainTime | undefined = undefined;
                if(Temporal.PlainDate.compare(startPlain, date) === 0) {
                    // Starts today
                    startTime = startDate.toPlainTime();
                }
                if(Temporal.PlainDate.compare(endPlain, date) === 0) {
                    // Ends today
                    endTime = endDate.toPlainTime();
                }
                return [
                    {
                        type: "event",
                        pageId,
                        attributeIndex,
                        title,
                        start: startTime,
                        end: endTime,
                        startDay: startPlain,
                        endDay: endPlain,
                        color
                    }
                ];
            }
            break;
        }
        case TimeType.AllDay: {
            const eventDate = parsePlainDate(time.date);
            if(Temporal.PlainDate.compare(eventDate, date) === 0) {
                return [
                    {
                        type: "allDayEvent",
                        pageId,
                        attributeIndex,
                        title,
                        color
                    }
                ];
            }
            break;
        }
        case TimeType.AllDayRecurring: {
            if(checkRecurrence(time.condition, date)) {
                return [
                    {
                        type: "allDayEvent",
                        pageId,
                        attributeIndex,
                        title,
                        color
                    }
                ];
            }
            break;
        }
        case TimeType.Recurring: {
            let events: CalendarObject[] = [];
            if(checkRecurrence(time.condition, date)) {
                const zdt = Temporal.Now.zonedDateTimeISO().with({ year: date.year, month: date.month, day: date.day });
                const startTime = parseZonedTimeForDate(zdt, time.start).toPlainTime();
                const endTime = parseZonedTimeForDate(zdt, time.end).toPlainTime();
                const multiDay = Temporal.PlainTime.compare(endTime, startTime) < 0;
                
                events.push({
                    type: "event",
                    pageId,
                    attributeIndex,
                    title,
                    start: startTime,
                    // If the end is before the start time, this event spans across days
                    // so it doesn't end on this day
                    end: multiDay ? undefined : endTime,
                    startDay: date,
                    endDay: multiDay ? date.add({ days: 1 }) : date,
                    color
                });
            }
            
            // Check if this is the end day of a multi-day recurring event from the previous day
            const previousDay = date.subtract({ days: 1 });
            if(checkRecurrence(time.condition, previousDay)) {
                const zdt = Temporal.Now.zonedDateTimeISO().with({
                    year: previousDay.year,
                    month: previousDay.month,
                    day: previousDay.day
                });
                const startTime = parseZonedTimeForDate(zdt, time.start).toPlainTime();
                const endTime = parseZonedTimeForDate(zdt, time.end).toPlainTime();
                
                if(Temporal.PlainTime.compare(endTime, startTime) < 0) {
                    events.push({
                        type: "event",
                        pageId,
                        attributeIndex,
                        title,
                        end: endTime,
                        startDay: previousDay,
                        endDay: date,
                        color
                    });
                }
            }

            return events;
        }
    }

    return [];
}

function checkRecurrence(condition: EventCondition, date: Temporal.PlainDate): boolean {
    switch(condition.type) {
        case EventConditionType.Not:
            return !checkRecurrence(condition.condition, date);
        case EventConditionType.And:
            return condition.conditions.every(c => checkRecurrence(c, date));
        case EventConditionType.Or:
            return condition.conditions.some(c => checkRecurrence(c, date));
        case EventConditionType.True:
            return true;
        case EventConditionType.False:
            return false;
        
        case EventConditionType.Date:
            return condition.dates.map(parsePlainDate).some(d => Temporal.PlainDate.compare(d, date) === 0);
        case EventConditionType.DateRange: {
            const start = parsePlainDate(condition.start);
            const end = parsePlainDate(condition.end);
            return Temporal.PlainDate.compare(start, date) <= 0 && Temporal.PlainDate.compare(end, date) >= 0;
        }

        case EventConditionType.Year: {
            return condition.years.includes(date.year);
        }
        case EventConditionType.Month: {
            return condition.months.includes(date.month);
        }
        case EventConditionType.DayOfMonth: {
            return condition.days.includes(date.day);
        }
        case EventConditionType.DayOfYear: {
            return condition.days.map(parsePlainMonthDay).some(md => md.monthCode === date.monthCode && md.day === date.day);
        }
        case EventConditionType.DayOfWeek: {
            return condition.days.includes(date.dayOfWeek % 7); // Temporal uses 7 for Sunday, we use 0
        }
        case EventConditionType.WeekOfYear: {
            return condition.weeks.includes(date.weekOfYear ?? 0);
        }
        case EventConditionType.WeekOfMonth: {
            return condition.weeks.includes(getWeekOfMonth(date));
        }
    }

    const _exhaustiveCheck: never = condition;
}