import { Temporal } from "@js-temporal/polyfill";

/**
 * Branded types for string-serialized date/time formats.
 */

/**
 * ISO 8601-ish format (specifically, [RFC 9557](https://datatracker.ietf.org/doc/html/rfc9557)) with timezone and a prefix.  
 * This is used for event start/end times if a time zone is specified.  
 * Except the prefix, this is how a [Temporal.ZonedDateTime](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/ZonedDateTime#rfc_9557_format) serializes itself.  
 *   
 * `ZonedDateTime|YYYY-MM-DD T HH:mm:ss.sssssssss Z/±HH:mm [time_zone_id] [u-ca=calendar_id]` (spaces only for readability)  
 * 
 * e.g. `ZonedDateTime|2025-01-01T12:00:00[America/New_York][u-ca=iso8601]`  
 */
export type ZonedDateTimeString = string & { readonly __brand: unique symbol };
/**
 * ISO 8601-ish format day without a timezone (specifically, [RFC 9557](https://datatracker.ietf.org/doc/html/rfc9557)) and a prefix.  
 * This is used for events that last all day.  
 * Except the prefix, this is how a [Temporal.PlainDate](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainDate#rfc_9557_format) serializes itself.  
 *   
 * `PlainDate|YYYY-MM-DD [u-ca=calendar_id]` (spaces only for readability)  
 * 
 * e.g. `PlainDate|2025-01-01[u-ca=iso8601]`  
 */
export type PlainDateString = string & { readonly __brand: unique symbol };
/**
 * ISO 8601-ish format day without a timezone or year (specifically, [RFC 9557](https://datatracker.ietf.org/doc/html/rfc9557)) and a prefix.  
 * This is used for recurring events on specific days of the year.  
 * Except the prefix, this is how a [Temporal.PlainMonthDay](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainMonthDay#rfc_9557_format) serializes itself.  
 * 
 * `PlainMonthDay|YYYY-MM-DD [u-ca=calendar_id]` (spaces only for readability)  
 * The year is only required for non-iso calendars, which we don't really support, so it will almost never be present.  
 * 
 * e.g. `PlainMonthDay|01-01[u-ca=iso8601]`  
 */
export type PlainMonthDayString = string & { readonly __brand: unique symbol };
/**
 * [RFC 9557](https://datatracker.ietf.org/doc/html/rfc9557)-formatted time and a prefix.  
 * This is used for times of recurring events.  
 * Except the prefix, this is how a [Temporal.PlainTime](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainTime#rfc_9557_format) serializes itself.  
 * 
 * `PlainTime|HH:mm:ss.sssssssss`  
 * e.g. `PlainTime|1:30:00`
 */
export type PlainTimeString = string & { readonly __brand: unique symbol };
/**
 * A [RFC 9557](https://datatracker.ietf.org/doc/html/rfc9557)-like time and zone with a prefix.  
 * This is used for times of recurring events that have a specific time zone.
 * There is no Temporal object that directly corresponds to this format, as the zone is only used when resolving an instant.  
 * The stored offset, if present, will be relative to the timezone when the time was created, but it's not meaningful as a standalone value.
 * 
 * `ZonedTime|HH:mm:ss.sssssssss Z/±HH:mm [time_zone_id]` (spaces only for readability)
 * e.g. `ZonedTime|13:00:00-05:00[America/New_York]`
 */
export type ZonedTimeString = string & { readonly __brand: unique symbol };


// Conversion functions


export function makePlainDate(date: Temporal.PlainDate): PlainDateString {
    return `PlainDate|${date.toString({ calendarName: "always" })}` as PlainDateString;
}

export function parsePlainDate(str: PlainDateString): Temporal.PlainDate {
    const match = /^PlainDate\|(.+)$/.exec(str);
    if(!match) try {
        // Best-effort parsing
        if(str.includes("T")) return Temporal.PlainDate.from(str.split("T")[0]);
        return Temporal.PlainDate.from(str);
    } catch { throw new Error(`Invalid PlainDateString ${str}`); }
    return Temporal.PlainDate.from(match[1]);
}

export function makePlainTime(time: Temporal.PlainTime): PlainTimeString {
    return `PlainTime|${time.toString()}` as PlainTimeString;
}

export function parsePlainTime(str: PlainTimeString): Temporal.PlainTime {
    const match = /^PlainTime\|(.+)$/.exec(str);
    if(!match) try {
        // Best-effort parsing
        return Temporal.PlainTime.from(str);
    } catch { throw new Error(`Invalid PlainTimeString ${str}`); }
    return Temporal.PlainTime.from(match[1]);
}

export function makeZonedDateTime(zdt: Temporal.ZonedDateTime): ZonedDateTimeString {
    return `ZonedDateTime|${zdt.toString({ calendarName: "always" })}` as ZonedDateTimeString;
}

export function parseZonedDateTime(str: ZonedDateTimeString): Temporal.ZonedDateTime {
    const match = /^ZonedDateTime\|(.+)$/.exec(str);
    if(!match) try {
        // Best-effort parsing
        if(str.endsWith("Z")) return Temporal.ZonedDateTime.from(str.replace(/Z$/, "[UTC]"));
        return Temporal.ZonedDateTime.from(str);
    } catch { throw new Error(`Invalid ZonedDateTimeString ${str}`); }
    return Temporal.ZonedDateTime.from(match[1]);
}

export function makeZonedTime(time: Temporal.PlainTime, timeZone: string): ZonedTimeString {
    const zdt = Temporal.Now.zonedDateTimeISO(timeZone).withPlainTime(time);
    return `ZonedTime|${zdt.toString({
        offset: "never",

    }).replace(/^.+?T/, '').replace(/\[.+\]$/, '')}[${timeZone}]` as ZonedTimeString;
}

export function parseZonedTime(str: ZonedTimeString): { time: Temporal.PlainTime, zone: string } {
    const match = /^ZonedTime\|(.+?)([+-]\d{2}:\d{2}|\[.+\])$/.exec(str);
    if(!match) try {
        // Best-effort parsing
        return {
            time: Temporal.PlainTime.from(str),
            zone: Temporal.Now.timeZoneId()
        };
    } catch { throw new Error(`Invalid ZonedTimeString ${str}`); }
    const timePart = match[1];
    const zonePart = match[2];
    const time = Temporal.PlainTime.from(timePart);
    if(!zonePart.startsWith("[") || !zonePart.endsWith("]")) {
        throw new Error("ZonedTimeString must include a time zone ID in brackets for now");
    }
    return {
        time,
        zone: zonePart.slice(1, -1)
    };
}

export function parseZonedTimeForDate(zdt: Temporal.ZonedDateTime, str: ZonedTimeString | PlainTimeString): Temporal.ZonedDateTime {
    if(isPlainTime(str)) {
        const time = parsePlainTime(str);
        return zdt.withPlainTime(time);
    } else {
        const { time, zone } = parseZonedTime(str);
        return zdt.withTimeZone(zone).withPlainTime(time).withTimeZone(zdt.timeZoneId);
    }
}

export function parsePlainMonthDay(str: PlainMonthDayString): Temporal.PlainMonthDay {
    const match = /^PlainMonthDay\|(.+)$/.exec(str);
    if(!match) try {
        // Best-effort parsing
        return Temporal.PlainMonthDay.from(str);
    } catch { throw new Error(`Invalid PlainMonthDayString ${str}`); }
    return Temporal.PlainMonthDay.from(match[1]);
}

export function makePlainMonthDay(pmd: Temporal.PlainMonthDay): PlainMonthDayString {
    return `PlainMonthDay|${pmd.toString({ calendarName: "always" })}` as PlainMonthDayString;
}

export function getPlainTime(str: ZonedDateTimeString | ZonedTimeString | PlainTimeString): Temporal.PlainTime {
    if(isZonedTime(str)) {
        return parseZonedTime(str).time;
    } else if(isZonedDateTime(str)) {
        return parseZonedDateTime(str).toPlainTime();
    } else {
        return parsePlainTime(str);
    }
}

/**
 * Creates a new time string of the same format/timezone as the original, but with the specified hour, minute, and second.
 */
export function updateTimeString<T extends ZonedDateTimeString | ZonedTimeString | PlainTimeString>(original: T, hour: number, minute: number, second: number): T {
    if(isZonedTime(original)) {
        const { time, zone } = parseZonedTime(original);
        const newTime = time.with({ hour, minute, second });
        return makeZonedTime(newTime, zone) as T;
    } else if(isZonedDateTime(original)) {
        const zdt = parseZonedDateTime(original);
        const newZdt = zdt.with({ hour, minute, second });
        return makeZonedDateTime(newZdt) as T;
    } else {
        const time = parsePlainTime(original);
        const newTime = time.with({ hour, minute, second });
        return makePlainTime(newTime) as T;
    }
}

export function getPlainDate(str: ZonedDateTimeString | PlainDateString): Temporal.PlainDate {
    if(isZonedDateTime(str)) {
        return parseZonedDateTime(str).toPlainDate();
    } else {
        return parsePlainDate(str);
    }
}

/**
 * Creates a new date string of the same format/timezone as the original, but with the specified year, month, and day.
 */
export function updateDateString<T extends ZonedDateTimeString | PlainDateString>(original: T, year: number, month: number, day: number): T {
    if(isZonedDateTime(original)) {
        const zdt = parseZonedDateTime(original);
        const newZdt = zdt.with({ year, month, day });
        return makeZonedDateTime(newZdt) as T;
    } else {
        const date = parsePlainDate(original);
        const newDate = date.with({ year, month, day });
        return makePlainDate(newDate) as T;
    }
}

/**
 * Sets the date of the given zoned date-time string to the specified date, preserving the time and timezone.
 */
export function setDateOfZonedDateTime(original: ZonedDateTimeString, newDate: Temporal.PlainDate): ZonedDateTimeString {
    const zdt = parseZonedDateTime(original);
    const updated = zdt.with({ year: newDate.year, month: newDate.month, day: newDate.day });
    return makeZonedDateTime(updated);
}

export function isZonedTime(str: String): str is ZonedTimeString {
    return str.startsWith("ZonedTime|");
}
export function isPlainTime(str: String): str is PlainTimeString {
    return str.startsWith("PlainTime|");
}
export function isZonedDateTime(str: String): str is ZonedDateTimeString {
    return str.startsWith("ZonedDateTime|");
}
export function isPlainDate(str: String): str is PlainDateString {
    return str.startsWith("PlainDate|");
}


// Utility functions for current date/time


export function currentDayPlus(days: number = 0): PlainDateString {
    const today = Temporal.Now.plainDateISO().add({ days });
    return makePlainDate(today);
}

export function currentPlainTimePlus(hours: number = 0): PlainTimeString {
    const now = Temporal.Now.plainTimeISO().add({ hours });
    return makePlainTime(now);
}

export function currentDateTimePlus(add: { hours: number } = { hours: 0 }): ZonedDateTimeString {
    const now = Temporal.Now.zonedDateTimeISO();
    return makeZonedDateTime(now.add(add));
}

export function currentTime(): PlainTimeString {
    const now = Temporal.Now.plainTimeISO();
    return makePlainTime(now);
}

export function getWeekOfYear(): number {
    return Temporal.Now.plainDateISO().weekOfYear ?? 0;
}

export function getDayOfWeek(): number {
    const today = Temporal.Now.plainDateISO();
    // Temporal uses 1 = Monday, 7 = Sunday; convert to 0 = Sunday, 6 = Saturday
    return today.dayOfWeek % 7;
}

export function getCurrentMonth(): number {
    return Temporal.Now.plainDateISO().month;
}

export function getYear(): number {
    return Temporal.Now.plainDateISO().year;
}

export function getDayOfMonth(): number {
    return Temporal.Now.plainDateISO().day;
}

/**
 * Gets the "week of the month" the date lands on.
 * Note that this is based on 7-day spans relative to the start of the month, not calendar weeks.  
 * This is because it's more intuitive to, say, always consider the first monday of the month to be in week 1, even if it's not the first day of the month.
 */
export function getWeekOfMonth(date: Temporal.PlainDate = Temporal.Now.plainDateISO()): number {
    return Math.floor((date.day - 1) / 7) + 1;
}

export function getDayOfYear(): PlainMonthDayString {
    const today = Temporal.Now.plainDateISO();
    // Format as PlainMonthDay|MM-DD[u-ca=iso8601]
    const mmdd = today.toString().slice(5); // "MM-DD"
    return `PlainMonthDay|${mmdd}[u-ca=iso8601]` as PlainMonthDayString;
}


// Time zone data


export type TimeZoneData = {
    id: string;
    offset: string | null;
    description: string;
};

export function getTimeZones(): TimeZoneData[] {    
    return Intl.supportedValuesOf('timeZone').map(tz => {
        const now = new Date();
        const zoneName = now.toLocaleTimeString('en-US', {
            hour12: false,
            timeZone: tz,
            timeZoneName: 'longGeneric'
        }).replace(/^[^ ]+ /, ''); // Remove time part
        const offset = now.toLocaleString('en-US', {
            timeZone: tz,
            timeZoneName: 'longOffset'
        }).split(' ').pop()?.replace(/GMT/, '') ?? null;

        return {
            id: tz,
            offset,
            offsetNumber: offset ? parseFloat(offset.replace(/[^\d.-]/g, '')) : 0,
            description: zoneName
        };
    }).sort((a, b) => {
        // Sort by offset
        if(a.offset === null) return 1;
        if(b.offset === null) return -1;
        if(a.offsetNumber !== b.offsetNumber) {
            return a.offsetNumber - b.offsetNumber;
        }
        // Then sort by label
        return a.id.localeCompare(b.id);
    });
}