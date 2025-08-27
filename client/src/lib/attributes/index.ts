export enum AttributeType {
    CalendarEvent = "calendarEvent",
    CalendarDeadline = "calendarDeadline"
}

export const attributeTypes: {
    [type in AttributeType]: {
        name: string,
        description: string,
        default: () => (Attribute & {
            type: type
        })
    }
} = {
    [AttributeType.CalendarEvent]: {
        name: "Calendar Event",
        description: "An event with a specific start and end time.",
        default: () => ({
            type: AttributeType.CalendarEvent,
            title: "",
            enabled: true,
            times: []
        })
    },
    [AttributeType.CalendarDeadline]: {
        name: "Calendar Deadline",
        description: "A deadline that must be met by a specific time.",
        default: () => ({
            type: AttributeType.CalendarDeadline,
            title: "",
            enabled: true,
            /** Current date/time in UTC... somehow? why is JS like this */
            due: new Date(new Date().toISOString().split(".")[0] + "Z").toISOString()
        })
    }
};

export type DateTime = string; // ISO 8601 format with UTC - e.g. YYYY-MM-DDTHH:MM:SSZ
export type DateOnly = string; // YYYY-MM-DD format
export type DayOfYearOnly = string; // MM-DD format
export type TimeOnly = string; // THH:MM:SS format with UTC

export type EventCondition = {
    type: "not",
    condition: EventCondition
} | {
    type: "and" | "or",
    conditions: EventCondition[]
} | {
    type: "date",
    date: DateOnly
} | {
    type: "dayOfWeek",
    /** 0 = Sunday, 1 = Monday, ..., 6 = Saturday */
    days: number[]
} | {
    type: "month",
    /** 1 = January, 2 = February, ..., 12 = December */
    months: number[]
} | {
    type: "year",
    /** e.g. 2024, 2025, etc. */
    years: number[]
} | {
    type: "dayOfMonth",
    /** 1 to 31 */
    days: number[]
} | {
    type: "weekOfMonth",
    /** 1 to 5 */
    weeks: number[]
} | {
    type: "dayOfYear",
    /** MM-DD format */
    days: DayOfYearOnly[]
} | {
    type: "weekOfYear",
    /** 1 to 53 */
    weeks: number[]
};

export type EventTime = {
    type: "single",
    /** Date/time */
    start: DateTime,
    /** Date/time */
    end: DateTime
} | {
    type: "recurring",
    /** Time only */
    start: TimeOnly,
    /** Time only */
    end: TimeOnly,
    condition: EventCondition
} | {
    type: "allDay",
    /** Date only */
    date: DateOnly
} | {
    type: "allDayRecurring",
    condition: EventCondition
};

export type Attribute = {
    type: AttributeType.CalendarEvent,
    title: string,
    enabled: boolean,
    times: EventTime[]
} | {
    type: AttributeType.CalendarDeadline,
    title: string,
    enabled: boolean,
    /** Date/time */
    due: DateTime
};