<script lang="ts">
    import type { CalendarDisplay } from "../../stores/calendar";
    import { Temporal } from "@js-temporal/polyfill";

    let {
        display = $bindable()
    }: {
        display: CalendarDisplay
    } = $props();

    const shortWeekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const weekDays = $derived(() => {
        const selectedDate = Temporal.PlainDate.from({
            year: display.selectedDay.year,
            month: display.selectedDay.month,
            day: display.selectedDay.day
        });

        // Find the start of the week (Sunday)
        const dayOfWeek = selectedDate.dayOfWeek % 7; // Convert to 0=Sunday, 6=Saturday
        const startOfWeek = selectedDate.subtract({ days: dayOfWeek });

        return Array.from({ length: 7 }, (_, i) => {
            const date = startOfWeek.add({ days: i });
            return {
                date,
                dayName: shortWeekdays[i],
                dayNumber: date.day,
                isToday: isToday(date),
                isSelected: date.equals(selectedDate)
            };
        });
    });

    const timeSlots = Array.from({ length: 24 }, (_, hour) => {
        const time12 = hour === 0 ? '12am' : 
            hour < 12 ? `${hour}am` : 
            hour === 12 ? '12pm' : 
            `${hour - 12}pm`;
        return {
            hour,
            time12,
            time24: `${hour.toString().padStart(2, '0')}:00`
        };
    });

    function isToday(date: Temporal.PlainDate): boolean {
        return date.equals(Temporal.Now.plainDateISO());
    }

    function selectDay(date: Temporal.PlainDate) {
        display.selectedDay.year = date.year;
        display.selectedDay.month = date.month;
        display.selectedDay.day = date.day;
    }
</script>

<div class="week-view">
    <div class="time-labels">
        {#each timeSlots as timeSlot}
            <div class="time-label">
                <span>{timeSlot.time12}</span>
            </div>
        {/each}
    </div>

    <div class="header-row">
        <span class="timezone">
            <!-- TODO -->
            GMT+1 idk
        </span>
        {#each weekDays() as dayInfo}
            <button 
                class="day-header blue"
                class:active={dayInfo.isSelected}
                class:today={dayInfo.isToday}
                onclick={() => selectDay(dayInfo.date)}
            >
                <div class="day-name">{dayInfo.dayName}</div>
                <div class="day-number">{dayInfo.dayNumber}</div>
            </button>
        {/each}
    </div>

    <div class="day-columns">
        {#each weekDays() as dayInfo}
            <div 
                class="day-column"
                class:today-column={dayInfo.isToday}
                class:selected-column={dayInfo.isSelected}
            >
            </div>
        {/each}
    </div>

    <div class="time-gridlines">
        {#each timeSlots as _timeSlot}
            <div class="time-gridline"></div>
        {/each}
    </div>
</div>

<style lang="scss">
    :root {
        --calendar-time-slot-height: 3rem;
    }

    .week-view {
        flex: 1;
        display: grid;
        overflow: auto;
        position: relative;
        grid-template-columns: 6rem repeat(7, 1fr);
        grid-template-rows: auto 1fr;
        height: 100%;

        // Overscroll just looks odd, especially on Firefox
        overscroll-behavior: none;
    }
    
    .header-row {
        grid-row: 1 / 2;
        grid-column: 1 / -1;

        display: grid;
        grid-template-columns: subgrid;
        background-color: var(--surface-0);
        position: sticky;
        top: 0;
        z-index: 10;

        .timezone {
            background-color: var(--surface-0);
            border-right: 1px solid var(--surface-1-border);
            color: var(--subtle-text);
            display: flex;
            align-items: flex-end;
            justify-content: flex-end;
            position: sticky;
            left: 0;
            padding: 0.5rem;
            font-size: 0.75rem;
        }

        .day-header {
            display: flex;
            flex-direction: column;
            align-items: center;
            border-radius: 0;
            border: 1px solid transparent;
            border-right: 1px solid var(--surface-1-border);
            background-color: var(--surface-0);
            cursor: pointer;
            transition: background-color 150ms;

            gap: 0.25rem;
            padding: 0.25rem 0;

            &:hover {
                background-color: var(--surface-1);
            }

            &.today {
                border-color: var(--blue-text);
                .day-number {
                    color: var(--blue-text);
                }
            }

            &.active {
                .day-name, .day-number {
                    color: var(--blue-text);
                }
            }

            .day-name {
                font-size: 0.75rem;
                font-weight: 600;
                color: var(--subtle-text);
                letter-spacing: 0.5px;
                transition: color 200ms ease;
            }
            .day-number {
                font-size: 1.25rem;
                font-weight: 500;
                color: var(--color-text);
                transition: color 200ms ease;
            }
        }
    }

    .time-labels {
        grid-row: 2 / -1;
        grid-column: 1 / 2;

        background-color: var(--surface-0);
        border-right: 1px solid var(--surface-1-border);
        position: sticky;
        left: 0;
        z-index: 5;
        display: flex;
        flex-direction: column;

        .time-label {
            --line-width: 0.5rem;

            height: var(--calendar-time-slot-height);
            position: relative;

            > span {
                position: absolute;
                right: var(--line-width);
                padding-right: 0.5rem;
                font-size: 0.75rem;
                transform: translateY(-50%);
            }

            &::after {
                content: "";
                position: absolute;
                right: 0;
                width: var(--line-width);
                border-top: 1px solid var(--surface-1-border);
            }

            &:first-of-type > span {
                display: none;
            }
    
            /* Visual separation for major time blocks */
            &:nth-child(6n + 1) {
                border-width: 2px;

                &::after {
                    border-top-width: 2px;
                }
            }
        }
    }

    .time-gridlines {
        grid-row: 2 / -1;
        grid-column: 2 / -1;
        pointer-events: none;
        z-index: 1;

        .time-gridline {
            height: var(--calendar-time-slot-height);
            border-top: 1px solid var(--surface-1-border);

            /* Visual separation for major time blocks */
            &:nth-child(6n + 1) {
                border-width: 2px;
            }
        }
    }

    .day-columns {
        display: grid;
        grid-template-columns: subgrid;
        grid-row: 2 / -1;
        grid-column: 2 / -1;
        
        .day-column {
            position: relative;
            border-right: 1px solid var(--surface-1-border);
            background-color: var(--background);
            min-width: 8rem;
        }
    }
</style>