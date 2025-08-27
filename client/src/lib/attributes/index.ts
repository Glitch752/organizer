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
export type TimeOnly = string; // THH:MM:SS format with no timezone offset; we always use the local timezone for times

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

export enum TimeType {
    Single = "single",
    Recurring = "recurring",
    AllDay = "allDay",
    AllDayRecurring = "allDayRecurring"
}

export const timeTypes: {
    [type in TimeType]: {
        name: string,
        description: string,
        default: () => (EventTime & {
            type: type
        })
    }
} = {
    [TimeType.Single]: {
        name: "Single",
        description: "A one-time event with a specific start and end time.",
        default: () => ({
            type: TimeType.Single,
            start: new Date(new Date().toISOString().split(".")[0] + "Z").toISOString(),
            end: new Date(new Date().toISOString().split(".")[0] + "Z").toISOString()
        })
    },
    [TimeType.Recurring]: {
        name: "Recurring",
        description: "An event that recurs at the same time on specified days.",
        default: () => ({
            type: TimeType.Recurring,
            start: "T09:00:00",
            end: "T10:00:00",
            condition: {
                type: "dayOfWeek",
                days: [1, 3, 5] // Monday, Wednesday, Friday
            }
        })
    },
    [TimeType.AllDay]: {
        name: "All Day",
        description: "A one-time event that lasts all day.",
        default: () => ({
            type: TimeType.AllDay,
            date: new Date().toISOString().split("T")[0] // Current date in YYYY-MM-DD format
        })
    },
    [TimeType.AllDayRecurring]: {
        name: "All Day Recurring",
        description: "An event that recurs all day on specified dates or patterns.",
        default: () => ({
            type: TimeType.AllDayRecurring,
            condition: {
                type: "month",
                months: [1] // January
            }
        })
    }
};

export type EventTime = {
    type: TimeType.Single,
    /** Date/time */
    start: DateTime,
    /** Date/time */
    end: DateTime
} | {
    type: TimeType.Recurring,
    /** Time only */
    start: TimeOnly,
    /** Time only */
    end: TimeOnly,
    condition: EventCondition
} | {
    type: TimeType.AllDay,
    /** Date only */
    date: DateOnly
} | {
    type: TimeType.AllDayRecurring,
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