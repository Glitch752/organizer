<script lang="ts">
    import type { CalendarDisplay } from "../../stores/calendar";
    import { Temporal } from "@js-temporal/polyfill";
    import { getCalendarObjects } from "./calendar";
    import type { Client } from "../client";
    import CalendarAttributeButton from "./CalendarAttributeButton.svelte";

    let {
        display = $bindable(), client
    }: {
        display: CalendarDisplay, client: Client
    } = $props();

    const shortWeekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    async function getWeekDays(selectedDay: { year: number; month: number; day: number; }) {
        const selectedDate = Temporal.PlainDate.from({
            year: selectedDay.year,
            month: selectedDay.month,
            day: selectedDay.day
        });

        // Find the start of the week (Sunday)
        const dayOfWeek = selectedDate.dayOfWeek % 7; // Convert to 0=Sunday, 6=Saturday
        const startOfWeek = selectedDate.subtract({ days: dayOfWeek });

        return await Promise.all(Array.from({ length: 7 }, async (_, i) => {
            const date = startOfWeek.add({ days: i });
            return {
                date,
                dayName: shortWeekdays[i],
                dayNumber: date.day,
                isToday: isToday(date),
                isSelected: date.equals(selectedDate),
                calendarObjects: await getCalendarObjects(client, date)
            };
        }));
    }

    let weekDays = $derived(getWeekDays(display.selectedDay));

    $effect(() => {
        let unsub: (() => void) | undefined;
        client.listenToAttributeChanges(() => {
            weekDays = getWeekDays(display.selectedDay);
        }).then(u => {
            unsub = u;
        });

        return () => {
            unsub?.();
        };
    });

    const timeSlots = Array.from({ length: 25 }, (_, hour) => {
        const time12 = hour === 0 || hour === 25 ? "12am" :
            hour < 12 ? `${hour}am` :
            hour === 12 ? "12pm" :
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

    function getCurrentTimezone() {
        // Get the current time zone short name
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const parts = new Intl.DateTimeFormat([], { timeZone: tz, timeZoneName: 'shortOffset' }).formatToParts(new Date());
        const tzPart = parts.find(part => part.type === 'timeZoneName');
        return tzPart ? tzPart.value : tz;
    }

    /** Gets the time of day as decimal hours. */
    function timeToPosition(time: Temporal.PlainTime): number {
        return time.hour + time.minute / 60 + time.second / 3600;
    }
    function getCurrentTime(): number {
        return timeToPosition(Temporal.Now.plainTimeISO());
    }
    let currentTime = $state(getCurrentTime());

    // Update the current time every minute
    $effect(() => {
        const interval = setInterval(() => {
            currentTime = getCurrentTime();
        }, 60000);
        return () => clearInterval(interval);
    });
</script>

<div class="week-view">
    <div class="time-column">
        <div class="time-labels">
            {#each timeSlots as timeSlot}
                <div class="time-label">
                    <span>{timeSlot.time12}</span>
                </div>
            {/each}
        </div>
    </div>

    {#await weekDays then days}
        <div class="header-row">
            <span class="timezone">
                {getCurrentTimezone()}
            </span>
            {#each days as dayInfo}
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
            {#each days as dayInfo}
                <div 
                    class="day-column"
                    class:today-column={dayInfo.isToday}
                    class:selected-column={dayInfo.isSelected}
                >
                    <div class="day-content">
                        <!-- If this is today, draw the current time line -->
                        {#if dayInfo.isToday}
                            <div 
                                class="current-time-line" 
                                style="--pos: {currentTime}"
                            ></div>
                        {/if}

                        {#each dayInfo.calendarObjects as object}
                            {#if object.type === "deadline"}
                                <div
                                    class="deadline"
                                    style="--pos: {timeToPosition(object.time)}"
                                >
                                    <CalendarAttributeButton {object} {client} />
                                </div>
                            {:else if object.type === "event"}
                                <div
                                    class="event"
                                    style="--start: {object.start ? timeToPosition(object.start) : 0}; --end: {object.end ? timeToPosition(object.end) : 24}"
                                    class:hasStart={!!object.start}
                                    class:hasEnd={!!object.end}
                                    class:low={(object.end ? timeToPosition(object.end) : 24) > 23}
                                >
                                    <CalendarAttributeButton {object} {client}>
                                        <div class="event-content">
                                            <span class="event-title">
                                                {object.title}{#if
                                                    // If the task is shorter than 30 minutes, write the time inline
                                                    // Formatting is weird to avoid whitespace
                                                    object.end && object.start && object.end.since(object.start).total("minutes") <= 30
                                                }<span class="inline-time">, {
                                                    object.start.toLocaleString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })
                                                }</span>{/if}
                                            </span>
                                            <span class="event-time">
                                                <!-- Funky formatting to avoid whitespace -->
                                                {#if !object.start && !object.end}
                                                    All day
                                                {:else}
                                                    {`${
                                                        (object.start ?
                                                            object.start.toLocaleString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }) :
                                                            object.startDay.toLocaleString(undefined, { month: 'short', day: 'numeric'})
                                                        )
                                                    }–${
                                                        (object.end ?
                                                            object.end.toLocaleString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }) :
                                                            object.endDay.toLocaleString(undefined, { month: 'short', day: 'numeric' })
                                                        )
                                                    }`}
                                                {/if}
                                            </span>
                                        </div>
                                    </CalendarAttributeButton>
                                </div>
                            {/if}
                        {/each}
                    </div>
                </div>
            {/each}
        </div>

        <div class="time-gridlines">
            {#each timeSlots as _timeSlot}
                <div class="time-gridline"></div>
            {/each}
        </div>
    {/await}
</div>

<style lang="scss">
    // event-small has higher priority
    @layer event-normal, event-medium, event-small;

    :root {
        --calendar-time-slot-height: 3rem;
    }

    .week-view {
        flex: 1;
        display: grid;
        overflow: auto;
        position: relative;
        grid-template-columns: 5rem repeat(7, 1fr);
        grid-template-rows: auto 1rem 1fr 1rem;
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
            border-bottom: 1px solid var(--surface-1-border);
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

    .time-column {
        grid-row: 2 / -1;
        grid-column: 1 / 2;

        background-color: var(--surface-0);
        border-right: 1px solid var(--surface-1-border);
        position: sticky;
        left: 0;
        z-index: 5;
        display: grid;
        grid-template-rows: subgrid;

        .time-labels {
            grid-row: 2;
        }

        .time-label {
            --line-width: 0.5rem;

            height: var(--calendar-time-slot-height);
            &:last-child {
                height: 0;
            }
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

            // &:first-of-type > span, &:first-of-type::after {
            //     display: none;
            // }
    
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
        grid-row: 3 / -1;
        grid-column: 2 / -1;
        pointer-events: none;
        z-index: 1;

        .time-gridline {
            height: var(--calendar-time-slot-height);
            border-top: 1px solid var(--surface-1-border);

            &:last-child {
                height: 0;
            }

            /* Visual separation for major time blocks */
            &:nth-child(6n + 1) {
                border-width: 2px;
            }
        }
    }

    .day-columns {
        display: grid;
        grid-template-rows: subgrid;
        grid-template-columns: subgrid;
        grid-row: 2 / -1;
        grid-column: 2 / -1;
        
        .day-column {
            display: grid;
            grid-row: 1 / -1;
            grid-template-rows: subgrid;
            border-right: 1px solid var(--surface-1-border);
            min-width: 8rem;
        }
        .day-content {
            grid-row: 2;
            position: relative;
        }

        .current-time-line, .deadline {
            position: absolute;
            top: calc(var(--pos) * var(--calendar-time-slot-height));
            left: 0;
            right: 0;
            height: 0.75rem;
            border-color: transparent;
            border-top: 2px solid var(--color);
            transition: border-color 200ms ease;
            z-index: 2;

            &:has(:global(dialog)) {
                z-index: 10;
            }

            &::before {
                content: "";
                position: absolute;
                transition: background-color 200ms ease;
                background-color: var(--color);
                top: -5px;
                left: -5px;
                width: 8px;
                height: 8px;
                border-radius: 50%;
            }
        }
        .current-time-line {
            --color: var(--red-background);
            z-index: 4;
        }
        .deadline {
            --color: var(--blue-background);
            position: relative;
            
            :global(> div) {
                position: absolute;
                transition: background-color 200ms ease;
                background-color: var(--color);
                border-radius: 0 0 0.25rem 0.25rem;

                max-width: calc(100% - 1rem);
                
                top: 0;
                right: 0;

                display: flex;

                :global(> button) {
                    padding: 0 0.25rem;
                    box-sizing: content-box;
                    border-color: transparent;
                    background-color: transparent;

                    font-size: 0.675rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
            }

            &:hover {
                --color: var(--blue-background-hover);
            }
        }

        .event {
            position: absolute;
            --min-height: 1rem;
            
            top: calc(min(100% - var(--min-height), var(--start) * var(--calendar-time-slot-height)));
            height: calc((var(--end) - var(--start)) * var(--calendar-time-slot-height));
            min-height: var(--min-height);

            left: 0.25rem;
            right: 0.5rem;
            box-sizing: border-box;
            z-index: 3;

            border-radius: 5px;

            transition: background-color 200ms ease, transform 200ms ease;
            background-color: var(--blue-background);

            transform: translateX(0);

            &:hover {
                background-color: var(--blue-background-hover);
                transform: translateX(0.125rem);
            }

            &:not(.hasStart)::before, &:not(.hasEnd)::after {
                content: "";
                position: absolute;
                left: 0;
                right: 0;
                height: 8px;
                transition: background 200ms ease;
                background: repeating-linear-gradient(
                    var(--angle),
                    var(--blue-background) 0 3px,
                    transparent 3px 6px
                );
                z-index: 2;
            }

            &:not(.hasStart)::before {
                --angle: 135deg;
                top: -8px;
                border-top-left-radius: 5px;
                border-top-right-radius: 5px;
            }
            &:not(.hasEnd)::after {
                --angle: 45deg;
                bottom: -8px;
                border-bottom-left-radius: 5px;
                border-bottom-right-radius: 5px;
            }

            &:not(.hasStart) {
                border-top-left-radius: 0;
                border-top-right-radius: 0;
            }
            &:not(.hasEnd) {
                border-bottom-left-radius: 0;
                border-bottom-right-radius: 0;
            }


            &:has(:global(dialog)) {
                z-index: 5;
            }

            :global(> div) {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                box-sizing: border-box;

                display: flex;
                align-items: center;

                :global(> button) {
                    width: 100%;
                    height: 100%;

                    padding: 0.25rem;
                    box-sizing: border-box;
                    border-color: transparent;
                    background-color: transparent;
                }
            }

            &.hasStart {
                border-top-left-radius: 0.25rem;
                border-top-right-radius: 0.25rem;
            }
            &.hasEnd {
                border-bottom-left-radius: 0.25rem;
                border-bottom-right-radius: 0.25rem;
            }

            container: event / size;

            @layer event-normal {
                .event-content {
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    min-height: 100%;
                    text-align: left;
                }
                .event-title {
                    font-size: 0.75rem;
                    font-weight: 600;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .inline-time {
                    font-weight: normal;
                    font-size: 0.675rem;
                    color: var(--color-text);
                    opacity: 0.75; // Subtle text is too light
                }
                .event-time {
                    font-size: 0.675rem;
                    color: var(--color-text);
                    opacity: 0.8; // Subtle text is too light
                }
            }

            @layer event-small {
                @container event (max-height: 1.25rem) {
                    .event-title {
                        font-size: 0.675rem;
                        height: 2rem;
                        position: absolute;
                        top: 0;
                        left: 0.25rem;
                        right: 0.5rem;
                    }
                    .event-time {
                        opacity: 0;
                        transition: opacity 200ms ease;
                        height: 2rem;
                        position: absolute;
                        bottom: -2.25rem;
                    }
                    &.low .event-time {
                        top: -1rem;
                    }
                    &:hover .event-time {
                        opacity: 0.8;
                    }
                }
            }
            
            @layer event-medium {
                @container event (max-height: 2rem) {
                    .event-title {
                        font-size: 0.75rem;
                        height: 2rem;
                        position: absolute;
                        top: 0.125rem;
                        left: 0.375rem;
                        right: 0.5rem;
                    }
                    .event-time {
                        opacity: 0;
                        transition: opacity 200ms ease;
                        position: absolute;
                        bottom: -1rem;
                    }
                    &.low .event-time {
                        top: -1rem;
                    }
                    &:hover .event-time {
                        opacity: 0.8;
                    }
                }
            }
        }
    }
</style>