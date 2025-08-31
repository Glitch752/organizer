<script lang="ts">
    import type { CalendarDisplay } from "../../stores/calendar";
    import { Temporal } from "@js-temporal/polyfill";
    import { getCalendarDays, getDaysInMonth } from "../datetime/months";

    let {
        display = $bindable()
    }: {
        display: CalendarDisplay
    } = $props();

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // The current date for highlighting
    const today = $derived.by(() => {
        const now = Temporal.Now.plainDateISO();
        return { year: now.year, month: now.month, day: now.day };
    });

    function selectMonth(month: number) {
        display.displayType = "month";
        display.selectedDay.month = month;
        display.selectedDay.day = Math.min(display.selectedDay.day, getDaysInMonth(display.selectedDay.year, month));
    }

    function selectDay(month: number, day: number) {
        display.selectedDay.month = month;
        display.selectedDay.day = day;
    }
</script>

<div class="months-grid">
    {#each monthNames as monthName, monthIndex}
        {@const month = monthIndex + 1}
        {@const calendarDays = getCalendarDays(display.selectedDay.year, month)}
        
        <div class="month-container">
            <button 
                class="month-header blue"
                class:active={display.selectedDay.month === month}
                onclick={() => selectMonth(month)}
            >
                {monthName}
            </button>
            
            <div class="mini-calendar">
                <div class="day-headers">
                    <div class="day-header">S</div>
                    <div class="day-header">M</div>
                    <div class="day-header">T</div>
                    <div class="day-header">W</div>
                    <div class="day-header">T</div>
                    <div class="day-header">F</div>
                    <div class="day-header">S</div>
                </div>
                
                <div class="days-grid">
                    {#each calendarDays as day}
                        <button 
                            class="day blue"
                            class:in-month={day.month === month}
                            class:active={display.selectedDay.year === display.selectedDay.year && 
                                            display.selectedDay.month === month && 
                                            display.selectedDay.day === day.day && 
                                            day.month === month}
                            class:today={today.year === display.selectedDay.year && 
                                        today.month === month && 
                                        today.day === day.day && 
                                        day.month === month}
                            onclick={() => selectDay(day.month, day.day)}
                        >
                            {day.day}
                        </button>
                    {/each}
                </div>
            </div>
        </div>
    {/each}
</div>

<style lang="scss">
    .months-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
        padding: 1rem;
        gap: 1rem;
        flex: 1;
    }

    .month-container {
        display: flex;
        flex-direction: column;
        border-radius: 8px;
        background-color: var(--surface-0);
        overflow: hidden;
    }

    .month-header {
        border: none;
        padding: 0.75rem;
        cursor: pointer;
        transition: all 150ms;
        width: 100%;
        color: var(--color-text);

        font-size: 0.875rem;
        padding: 0.5rem 1rem;
        text-align: left;
        border-radius: 0;
    }

    .mini-calendar {
        padding: 0.5rem;
        flex: 1;
    }

    .day-headers {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 1px;
        margin-bottom: 0.25rem;
    }

    .day-header {
        text-align: center;
        font-size: 0.6rem;
        color: var(--subtle-text);
        font-weight: 600;
        padding: 0.125rem 0;
    }

    .days-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 1px;
    }

    .day {
        aspect-ratio: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.6rem;
        cursor: pointer;
        border: none;
        background: none;
        color: var(--subtle-text);
        border-radius: 2px;
        transition: background-color 150ms;
        min-height: 1.5rem;

        &.in-month {
            color: var(--color-text);

            &:hover:not(.active) {
                background-color: var(--subtle-background-highlight);
            }
        }
        
        &.today {
            color: var(--blue-text);
            font-weight: 600;
        }
        
        &.today.active {
            color: var(--color-text);
        }
    }
</style>