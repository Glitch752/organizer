<script lang="ts">
    import { Temporal } from "@js-temporal/polyfill";
    import { calendarDisplay, type CalendarDisplay } from "../stores/calendar";

    function formatDate(display: CalendarDisplay) {
        switch(display.displayType) {
            case "year":
                return display.selectedDay.year.toString();
            case "month":
                // E.g. "August 2025"
                return new Temporal.PlainDate(display.selectedDay.year, display.selectedDay.month, 1).toLocaleString(undefined, {
                    year: "numeric",
                    month: "long"
                });
            case "week":
                // E.g. "August 2025" if a single month, Aug-Sep 2025 if two
                const start = new Temporal.PlainDate(display.selectedDay.year, display.selectedDay.month, display.selectedDay.day);
                const end = start.add({ days: 6 });
                if(start.month === end.month) {
                    return start.toLocaleString(undefined, {
                        year: "numeric",
                        month: "long"
                    });
                } else if(start.year === end.year) {
                    return `${start.toLocaleString(undefined, { month: "short" })} - ${end.toLocaleString(undefined, { month: "short", year: "numeric" })}`;
                } else {
                    return `${start.toLocaleString(undefined, { month: "short", year: "numeric" })} - ${end.toLocaleString(undefined, { month: "short", year: "numeric" })}`;
                }
        }
    }

    function previous() {
        calendarDisplay.update(display => {
            const { selectedDay, displayType } = display;
            switch (displayType) {
                case "year":
                    return {
                        ...display,
                        selectedDay: {
                            ...selectedDay,
                            year: selectedDay.year - 1
                        }
                    };
                case "month":
                    let prevMonth = selectedDay.month - 1;
                    let year = selectedDay.year;
                    if (prevMonth < 1) {
                        prevMonth = 12;
                        year -= 1;
                    }
                    return {
                        ...display,
                        selectedDay: {
                            ...selectedDay,
                            year,
                            month: prevMonth
                        }
                    };
                case "week":
                    const prevWeek = Temporal.PlainDate.from(selectedDay).subtract({ days: 7 });
                    return {
                        ...display,
                        selectedDay: {
                            year: prevWeek.year,
                            month: prevWeek.month,
                            day: prevWeek.day
                        }
                    };
                default:
                    return display;
            }
        });
    }

    function next() {
        calendarDisplay.update(display => {
            const { selectedDay, displayType } = display;
            switch (displayType) {
                case "year":
                    return {
                        ...display,
                        selectedDay: {
                            ...selectedDay,
                            year: selectedDay.year + 1
                        }
                    };
                case "month":
                    let nextMonth = selectedDay.month + 1;
                    let year = selectedDay.year;
                    if (nextMonth > 12) {
                        nextMonth = 1;
                        year += 1;
                    }
                    return {
                        ...display,
                        selectedDay: {
                            ...selectedDay,
                            year,
                            month: nextMonth
                        }
                    };
                case "week":
                    const nextWeek = Temporal.PlainDate.from(selectedDay).add({ days: 7 });
                    return {
                        ...display,
                        selectedDay: {
                            year: nextWeek.year,
                            month: nextWeek.month,
                            day: nextWeek.day
                        }
                    };
                default:
                    return display;
            }
        });
    }
</script>

<div class="content">
    <h2>Calendar</h2>
    <span class="date">{formatDate($calendarDisplay)}</span>
    <button onclick={previous} class="nav-button" title="Previous dates">‹</button>
    <button onclick={next} class="nav-button" title="Next dates">›</button>
    <div class="separator"></div>
    <select bind:value={$calendarDisplay.displayType}>
        <option value="year">Year</option>
        <option value="month">Month</option>
        <option value="week">Week</option>
    </select>
    <div class="separator"></div>
</div>

<style lang="scss">
    .content {
        display: flex;
        flex: 1;
        align-items: center;
        gap: 0.5rem;
    }
	h2 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: normal;

		color: var(--color-text);
		flex: 1;
	}

    span {
		font-size: 1.2rem;
        color: var(--color-text-important);
    }
    span.date {
        margin-right: 0.5rem;
    }
    .separator {
        height: 100%;
        border-left: 1px solid var(--surface-1-border);
    }

    select {
        height: 2rem;
    }

    button {
        width: 2rem;
        height: 2rem;
    }
</style>