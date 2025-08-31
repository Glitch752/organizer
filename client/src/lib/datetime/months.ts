import { Temporal } from "@js-temporal/polyfill";
import { memoize } from "../util/memoize";

export function getDaysInMonth(year: number, month: number): number {
    const date = Temporal.PlainDate.from({ year, month, day: 1 });
    return date.daysInMonth;
}

export function getFirstDayOfMonth(year: number, month: number): number {
    const date = Temporal.PlainDate.from({ year, month, day: 1 });
    // Temporal.PlainDate.dayOfWeek: 1 = Monday, 7 = Sunday
    // Convert to 0 = Sunday, 6 = Saturday
    return date.dayOfWeek % 7;
}

// Generate calendar days for a specific month
function getCalendarDaysInner(year: number, month: number) {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days: { day: number; month: number }[] = [];

    // Days from previous month
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
    
    const nextMonth = month === 12 ? 1 : month + 1;
    
    // Days in previous month
    for(let i = firstDay - 1; i >= 0; i--) {
        days.push({ day: daysInPrevMonth - i, month: prevMonth });
    }

    for(let i = 1; i <= daysInMonth; i++) {
        days.push({ day: i, month: month });
    }

    // Remaining days from next month
    while(days.length < 7 * 6) {
        days.push({ day: days.length - daysInMonth - firstDay + 1, month: nextMonth });
    }

    return days;
}

export const getCalendarDays = memoize(getCalendarDaysInner);