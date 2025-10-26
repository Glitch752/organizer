import { PlainDateString, PlainMonthDayString, PlainTimeString, ZonedDateTimeString, ZonedTimeString } from "../../datetime";
import type { HexString } from "./color";

export enum AttributeType {
    CalendarEvent = "calendarEvent",
    CalendarDeadline = "calendarDeadline"
}

export enum EventConditionType {
    Not = "not",
    And = "and",
    Or = "or",
    True = "true",
    False = "false",

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

export type EventCondition = {
    type: EventConditionType.Not,
    condition: EventCondition
} | {
    type: EventConditionType.And | EventConditionType.Or,
    conditions: EventCondition[]
} | {
    type: EventConditionType.Date,
    dates: PlainDateString[]
} | {
    type: EventConditionType.DateRange,
    start: PlainDateString,
    end: PlainDateString
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
    days: PlainMonthDayString[]
} | {
    type: EventConditionType.WeekOfYear,
    /** 1 to 53 */
    weeks: number[]
} | {
    type: EventConditionType.True | EventConditionType.False
};

export enum TimeType {
    Single = "single",
    Recurring = "recurring",
    AllDay = "allDay",
    AllDayRecurring = "allDayRecurring"
}

export type EventTime = {
    type: TimeType.Single,
    start: ZonedDateTimeString,
    end: ZonedDateTimeString
} | {
    type: TimeType.Recurring,
    start: ZonedTimeString | PlainTimeString,
    end: ZonedTimeString | PlainTimeString,
    condition: EventCondition
} | {
    type: TimeType.AllDay,
    date: PlainDateString
} | {
    type: TimeType.AllDayRecurring,
    condition: EventCondition
};

export type Attribute = {
    type: AttributeType.CalendarEvent,
    title?: string,
    enabled: boolean,
    weekViewOnly?: boolean,
    color?: HexString,
    times: EventTime[]
} | {
    type: AttributeType.CalendarDeadline,
    title?: string,
    enabled: boolean,
    color?: HexString,
    due: ZonedDateTimeString
};