import { getCurrentMonth, getDayOfMonth, getYear } from "../lib/datetime/time";
import { persistentState } from "./persistent";

export type CalendarDisplay = {
    displayType: "year" | "month" | "week",
    selectedDay: {
        year: number;
        month: number;
        day: number;
    }
}

export let calendarDisplay = persistentState<CalendarDisplay>("calendarDisplay", {
    displayType: "month",
    selectedDay: {
        year: getYear(),
        month: getCurrentMonth(),
        day: getDayOfMonth()
    }
});