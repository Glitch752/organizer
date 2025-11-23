<script lang="ts">
    import type { CalendarDisplay } from "../../stores/calendar";
    import { Temporal } from "@js-temporal/polyfill";
    import { getCalendarDays } from "../datetime/months";
    import { client } from "../client";
    import CalendarMonthObject from "./CalendarMonthObject.svelte";
    import { measurePromise } from "../util/time";
    import { CalendarLoadingManager, CalendarViewType } from "./calendar";
    import { onDestroy } from "svelte";

    let {
        display = $bindable()
    }: {
        display: CalendarDisplay
    } = $props();

    const shortMonthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const shortWeekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const loadingManager = new CalendarLoadingManager(client, CalendarViewType.Month);
    onDestroy(() => loadingManager.unload());

    async function getDays(selectedDay: { year: number; month: number; day: number; }) {
        const days = getCalendarDays(selectedDay.year, selectedDay.month);
        return measurePromise(Promise.all(days.map(async d => ({
            month: d.month,
            day: d.day,
            objects: await loadingManager.getCalendarObjects(Temporal.PlainDate.from({
                year: d.year,
                month: d.month,
                day: d.day
            }))
        }))), "Day computation");
    }

    let calendarDays = $derived(getDays(display.selectedDay));

    $effect(() => {
        let unsub: (() => void) | undefined;
        client.listenToAttributeChanges(() => {
            calendarDays = getDays(display.selectedDay);
        }).then(u => {
            unsub = u;
        });

        return () => {
            unsub?.();
        };
    });

    // The current date for highlighting
    const today = $derived.by(() => {
        const now = Temporal.Now.plainDateISO();
        return { year: now.year, month: now.month, day: now.day };
    });

    function selectDay(month: number, day: number) {
        display.selectedDay.month = month;
        display.selectedDay.day = day;
        
        // If clicking on a day from a different month, adjust the year if needed
        if(month !== display.selectedDay.month) {
            if(month === 12 && display.selectedDay.month === 1) {
                display.selectedDay.year--;
            } else if(month === 1 && display.selectedDay.month === 12) {
                display.selectedDay.year++;
            }
        }
    }
</script>

<div class="calendar-grid">
    <div class="weekday-headers">
        {#each shortWeekdays as weekday, index}
            <span class="weekday-header" title={weekdays[index]}>{weekday}</span>
        {/each}
    </div>

    <div class="days-grid">
        {#await calendarDays then days}
            {@const firstCurrentMonthDayIndex =
                days.findIndex(day => day.month === display.selectedDay.month && day.day === 1)}
            {@const firstNextMonthDayIndex =
                days.findIndex(day => day.month !== display.selectedDay.month && day.day === 1)}
            
            {#each days as day, index}
                <div 
                    class="day"
                    class:in-month={day.month === display.selectedDay.month}
                    class:active={display.selectedDay.year === display.selectedDay.year && 
                                    display.selectedDay.month === day.month && 
                                    display.selectedDay.day === day.day}
                    class:today={today.year === display.selectedDay.year && 
                                today.month === day.month && 
                                today.day === day.day}
                >
                    <button
                        class="day-number"
                        onclick={() => selectDay(day.month, day.day)}
                    >
                        {index === firstCurrentMonthDayIndex || index === firstNextMonthDayIndex ? shortMonthNames[day.month - 1] : ""}
                        {day.day}
                    </button>

                    {#each day.objects as object}
                        <CalendarMonthObject {object} {client} />
                    {/each}
                </div>
            {/each}
        {/await}
    </div>
</div>

<style lang="scss">
    .calendar-grid {
        flex: 1;
        display: flex;
        flex-direction: column;
        margin: 0 auto;
        width: 100%;
        height: 100%;
    }

    .weekday-headers {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 1px;
    }

    .weekday-header {
        text-align: center;
        font-size: 0.875rem;
        color: var(--subtle-text);
        font-weight: 600;
        padding: 0.25rem 0 0 0;
        &:not(:first-child) {
            border-left: 1px solid var(--surface-1);
        }
    }

    .days-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        grid-auto-rows: minmax(80px, auto);
        gap: 1px;
        flex: 1;
    }

    .day {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        
        background-color: transparent;
        color: var(--subtle-text);
        border: 1px solid transparent;

        &:nth-child(n + 8) {
            border-top: 1px solid var(--surface-1);
        }
        &:not(:nth-child(7n+1)) {
            border-left: 1px solid var(--surface-1);
            // Center contents
            padding-left: 2px;
        }

        &.in-month {
            color: var(--color-text);
        }
        
        &.today {
            border-color: var(--blue-text);
        }
        
        &.active {
            .day-number {
                color: var(--blue-text);
            }
        }
    }

    .day-number {
        font-size: 0.875rem;
        padding-top: 0.25rem;
        font-weight: 500;
        width: 100%;
        border-radius: 0;
        border-color: transparent;
        background-color: transparent;
        color: inherit;
    }
</style>

