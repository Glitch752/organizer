<script lang="ts" module>
    export function timeToPosition(time: Temporal.PlainTime): number {
        return time.hour + time.minute / 60 + time.second / 3600;
    }
</script>

<script lang="ts">
    import { Temporal } from "@js-temporal/polyfill";
    import type { CalendarObject } from "./calendar";
    import CalendarAttributeButton from "./CalendarAttributeButton.svelte";
    import type { Client } from "../client";

    const { object, client }: { object: CalendarObject, client: Client } = $props();
</script>

{#if object.type === "allDayEvent"}
    <div class="all-day-event" style="
        {object.color ? `--obj-color: ${object.color};` : ""}
    ">
        <CalendarAttributeButton {object} {client}>
            <span class="title">{object.title}</span>
        </CalendarAttributeButton>
    </div>
{:else if object.type === "deadline"}
    <div
        class="deadline"
        style="
            --pos: {timeToPosition(object.time)};
            {object.color ? `--obj-color: ${object.color};` : ""}
        "
    >
        <CalendarAttributeButton {object} {client} />
    </div>
{:else if object.type === "event"}
    {@const startTimeString = object.start ?
        object.start.toLocaleString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }) :
        object.startDay.toLocaleString(undefined, { month: 'short', day: 'numeric'})}
    {@const endTimeString = object.end ?
        object.end.toLocaleString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }) :
        object.endDay.toLocaleString(undefined, { month: 'short', day: 'numeric' })}
    
    <div
        class="event"
        style="
            --start: {object.start ? timeToPosition(object.start) : 0};
            --end: {object.end ? timeToPosition(object.end) : 24};
            {object.color ? `--obj-color: ${object.color};` : ""}
        "
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
                    }<span class="inline-time">, {startTimeString}</span>{/if}
                </span>
                <span class="event-time">
                    <!-- Funky formatting to avoid whitespace -->
                    {#if !object.start && !object.end}
                        All day
                    {:else}
                        {`${startTimeString}–${endTimeString}`}
                    {/if}
                </span>
            </div>
        </CalendarAttributeButton>
    </div>
{/if}

<style lang="scss">
    // event-small has higher priority
    @layer event-normal, event-medium, event-small;

    .deadline {
        --color: var(--obj-color, var(--blue-background));
        position: relative;
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
            --color: color-mix(in srgb, var(--obj-color, var(--blue-background)) 85%, white);
        }
    }

    .event {
        --color: var(--obj-color, var(--blue-background));

        position: absolute;
        --min-height: 1rem;
        
        top: calc(min(100% - var(--min-height), var(--start) * var(--calendar-time-slot-height)));
        height: calc((var(--end) - var(--start)) * var(--calendar-time-slot-height));
        min-height: var(--min-height);

        left: 0.25rem;
        right: 0.5rem;
        box-sizing: border-box;
        z-index: 2;

        border-radius: 5px;

        transition: background-color 200ms ease, transform 200ms ease;
        background-color: var(--color);

        transform: translateX(0);

        &:hover {
            --color: color-mix(in srgb, var(--obj-color, var(--blue-background)) 85%, white);
            transform: translateX(0.125rem);
        }

        &:not(.hasStart)::before, &:not(.hasEnd)::after {
            content: "";
            position: absolute;
            left: 0;
            right: 0;
            height: 8px;
            background: repeating-linear-gradient(
                var(--angle),
                var(--obj-color, var(--blue-background)) 0 3px,
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

    .all-day-event {
        position: relative;
        height: 1.25rem;
        
        :global(> div) {
            position: absolute;
            left: 0;
            right: 0;
            
            :global(> button) {
                --color: var(--obj-color, var(--blue-background));
                border-color: transparent;
                width: 100%;

                font-size: 0.75rem;
                text-align: left;

                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;

                transition: background-color 200ms ease;
                background-color: var(--color);

                &:hover {
                    --color: color-mix(in srgb, var(--obj-color, var(--blue-background)) 85%, white);
                }
            }
        }
    }
</style>