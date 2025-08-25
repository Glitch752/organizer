export enum AttributeType {
    CalendarEvent = "calendarEvent",
    CalendarDeadline = "calendarDeadline"
}

export const attributeTypes: {
    [type in AttributeType]: {
        name: string,
        description: string
    }
} = {
    [AttributeType.CalendarEvent]: {
        name: "Calendar Event",
        description: "An event with a specific start and end time."
    },
    [AttributeType.CalendarDeadline]: {
        name: "Calendar Deadline",
        description: "A deadline that must be met by a specific time."
    }
};

type DateTime = string; // ISO 8601 format with UTC - e.g. YYYY-MM-DDTHH:MM:SSZ
type DateOnly = string; // YYYY-MM-DD format
type DayOfYearOnly = string; // MM-DD format
type TimeOnly = string; // THH:MM:SS format with UTC

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
    days: number[] // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
} | {
    type: "month",
    months: number[] // 1 = January, 2 = February, ..., 12 = December
} | {
    type: "year",
    years: number[] // e.g. 2024, 2025, etc.
} | {
    type: "dayOfMonth",
    days: number[] // 1 to 31
} | {
    type: "weekOfMonth",
    weeks: number[] // 1 to 5
} | {
    type: "dayOfYear",
    days: DayOfYearOnly[] // MM-DD format
} | {
    type: "weekOfYear",
    weeks: number[] // 1 to 53
};

export type EventTime = {
    type: "single",
    start: DateTime,
    end: DateTime
} | {
    type: "recurring",
    start: TimeOnly,
    end: TimeOnly,
    condition: EventCondition
} | {
    type: "allDay",
    date: DateOnly
} | {
    type: "allDayRecurring",
    condition: EventCondition
};

export type Attribute = {
    type: AttributeType.CalendarEvent,
    enabled: boolean,
    times: EventTime[]
} | {
    type: AttributeType.CalendarDeadline,
    enabled: boolean,
    due: DateTime
};