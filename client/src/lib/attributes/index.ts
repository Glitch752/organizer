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
export type LocalTimeOnly = string; // THH:MM:SS format with no timezone offset; always uses the local timezone for times
export type ZonedTimeOnly = string; // THH:MM:SS+/-HH:MM format with timezone offset

export enum EventConditionType {
    Not = "not",
    And = "and",
    Or = "or",
    Date = "date",
    DateRange = "dateRange",
    DayOfWeek = "dayOfWeek",
    Month = "month",
    Year = "year",
    DayOfMonth = "dayOfMonth",
    WeekOfMonth = "weekOfMonth",
    DayOfYear = "dayOfYear",
    WeekOfYear = "weekOfYear"
}

export function currentDayPlus(days: number = 0): DateOnly {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split("T")[0];
}

function currentWeek(): number {
    const date = new Date();
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.valueOf() - firstDayOfYear.valueOf()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

export const conditionTypes: {
    [type in EventConditionType]: {
        name: string,
        default: () => (EventCondition & {
            type: type
        })
    }
} = {
    [EventConditionType.Not]: {
        name: "Not",
        default: () => ({
            type: EventConditionType.Not,
            condition: {
                type: EventConditionType.Date,
                date: currentDayPlus()
            }
        })
    },
    [EventConditionType.And]: {
        name: "All of",
        default: () => ({
            type: EventConditionType.And,
            conditions: [
                {
                    type: EventConditionType.Date,
                    date: currentDayPlus()
                }
            ]
        })
    },
    [EventConditionType.Or]: {
        name: "Any of",
        default: () => ({
            type: EventConditionType.Or,
            conditions: [
                {
                    type: EventConditionType.Date,
                    date: currentDayPlus()
                }
            ]
        })
    },
    [EventConditionType.Date]: {
        name: "Date",
        default: () => ({
            type: EventConditionType.Date,
            date: currentDayPlus()
        })
    },
    [EventConditionType.DateRange]: {
        name: "Date range",
        default: () => ({
            type: EventConditionType.DateRange,
            start: currentDayPlus(),
            end: currentDayPlus(30)
        })
    },
    [EventConditionType.DayOfWeek]: {
        name: "Day of Week",
        default: () => ({
            type: EventConditionType.DayOfWeek,
            days: [new Date().getDay()] // Current day of the week
        })
    },
    [EventConditionType.Month]: {
        name: "Month",
        default: () => ({
            type: EventConditionType.Month,
            months: [new Date().getMonth() + 1] // Current month (0-indexed in JS)
        })
    },
    [EventConditionType.Year]: {
        name: "Year",
        default: () => ({
            type: EventConditionType.Year,
            years: [new Date().getFullYear()] // Current year
        })
    },
    [EventConditionType.DayOfMonth]: {
        name: "Day of Month",
        default: () => ({
            type: EventConditionType.DayOfMonth,
            days: [new Date().getDate()] // Current day of the month
        })
    },
    [EventConditionType.WeekOfMonth]: {
        name: "Week of Month",
        default: () => ({
            type: EventConditionType.WeekOfMonth,
            weeks: [Math.ceil(new Date().getDate() / 7)] // Current week of the month
        })
    },
    [EventConditionType.DayOfYear]: {
        name: "Day of Year",
        default: () => ({
            type: EventConditionType.DayOfYear,
            days: [new Date().toISOString().split("T")[0].slice(5)] // Current day of the year in MM-DD format
        })
    },
    [EventConditionType.WeekOfYear]: {
        name: "Week of Year",
        default: () => ({
            type: EventConditionType.WeekOfYear,
            weeks: [currentWeek()]
        })
    }
};

export type EventCondition = {
    type: EventConditionType.Not,
    condition: EventCondition
} | {
    type: EventConditionType.And | EventConditionType.Or,
    conditions: EventCondition[]
} | {
    type: EventConditionType.Date,
    date: DateOnly
} | {
    type: EventConditionType.DateRange,
    start: DateOnly,
    end: DateOnly
} | {
    type: EventConditionType.DayOfWeek,
    /** 0 = Sunday, 1 = Monday, ..., 6 = Saturday */
    days: number[]
} | {
    type: EventConditionType.Month,
    /** 1 = January, 2 = February, ..., 12 = December */
    months: number[]
} | {
    type: EventConditionType.Year,
    /** e.g. 2024, 2025, etc. */
    years: number[]
} | {
    type: EventConditionType.DayOfMonth,
    /** 1 to 31 */
    days: number[]
} | {
    type: EventConditionType.WeekOfMonth,
    /** 1 to 5 */
    weeks: number[]
} | {
    type: EventConditionType.DayOfYear,
    /** MM-DD format */
    days: DayOfYearOnly[]
} | {
    type: EventConditionType.WeekOfYear,
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
                type: EventConditionType.DayOfWeek,
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
                type: EventConditionType.Month,
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
    /** Local or zoned time only */
    start: LocalTimeOnly | ZonedTimeOnly,
    /** Local or zoned time only */
    end: LocalTimeOnly | ZonedTimeOnly,
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
    enabled: boolean,
    times: EventTime[]
} | {
    type: AttributeType.CalendarDeadline,
    enabled: boolean,
    /** Date/time */
    due: DateTime
};