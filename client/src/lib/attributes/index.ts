import { currentDateTimePlus, currentDayPlus, currentPlainTimePlus, getCurrentMonth, getDayOfMonth, getDayOfWeek, getDayOfYear, getWeekOfMonth, getWeekOfYear, getYear } from "../datetime/time";
import { AttributeType, EventConditionType, TimeType, type Attribute, type EventCondition, type EventTime } from "@shared/connection/attributes";

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
            enabled: true,
            due: currentDateTimePlus()
        })
    }
};

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
                type: EventConditionType.True
            }
        })
    },
    [EventConditionType.And]: {
        name: "All of",
        default: () => ({
            type: EventConditionType.And,
            conditions: [
                {
                    type: EventConditionType.True
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
                    type: EventConditionType.True
                }
            ]
        })
    },
    [EventConditionType.True]: {
        name: "Always True",
        default: () => ({
            type: EventConditionType.True
        })
    },
    [EventConditionType.False]: {
        name: "Always False",
        default: () => ({
            type: EventConditionType.False
        })
    },
    [EventConditionType.Date]: {
        name: "Date",
        default: () => ({
            type: EventConditionType.Date,
            dates: [currentDayPlus()]
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
            days: [getDayOfWeek()]
        })
    },
    [EventConditionType.Month]: {
        name: "Month",
        default: () => ({
            type: EventConditionType.Month,
            months: [getCurrentMonth()]
        })
    },
    [EventConditionType.Year]: {
        name: "Year",
        default: () => ({
            type: EventConditionType.Year,
            years: [getYear()]
        })
    },
    [EventConditionType.DayOfMonth]: {
        name: "Day of Month",
        default: () => ({
            type: EventConditionType.DayOfMonth,
            days: [getDayOfMonth()]
        })
    },
    [EventConditionType.WeekOfMonth]: {
        name: "Week of Month",
        default: () => ({
            type: EventConditionType.WeekOfMonth,
            weeks: [getWeekOfMonth()]
        })
    },
    [EventConditionType.DayOfYear]: {
        name: "Day of Year",
        default: () => ({
            type: EventConditionType.DayOfYear,
            days: [getDayOfYear()]
        })
    },
    [EventConditionType.WeekOfYear]: {
        name: "Week of Year",
        default: () => ({
            type: EventConditionType.WeekOfYear,
            weeks: [getWeekOfYear()]
        })
    }
};

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
            start: currentDateTimePlus(),
            end: currentDateTimePlus({ hours: 1 })
        })
    },
    [TimeType.Recurring]: {
        name: "Recurring",
        description: "An event that recurs at the same time on specified days.",
        default: () => ({
            type: TimeType.Recurring,
            start: currentPlainTimePlus(),
            end: currentPlainTimePlus(1),
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
            date: currentDayPlus()
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