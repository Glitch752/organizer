<script lang="ts">
    import { Temporal } from "@js-temporal/polyfill";
    import type { CalendarObject } from "./calendar";
    import CalendarAttributeButton from "./CalendarAttributeButton.svelte";
    import type { Client } from "../client";

    const { object, client }: { object: CalendarObject, client: Client } = $props();

    function formatShortTime(time: Temporal.PlainTime) {
        return time.toLocaleString(undefined, {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })
            .replace(/ /g, '')
            .replace(':00', '')
            .toLocaleLowerCase();
    }
</script>

{#if object.type === "allDayEvent"}
    <div
        class="object all-day-event"
        style="
            {object.color ? `--obj-color: ${object.color};` : ""}
        "
    >
        <CalendarAttributeButton {object} {client}>
            <span class="title">{object.title}</span>
        </CalendarAttributeButton>
    </div>
{:else if object.type === "deadline"}
    <div
        class="object deadline"
        style="
            {object.color ? `--obj-color: ${object.color};` : ""}
        "
    >
        <CalendarAttributeButton {object} {client}>
            <span class="time">{formatShortTime(object.time)}</span>
            <span class="title">{object.title}</span>
        </CalendarAttributeButton>
    </div>
{:else if object.type === "event"}
    {@const startTimeString = object.start ?
        formatShortTime(object.start) :
        object.startDay.toLocaleString(undefined, { month: 'short', day: 'numeric'})}
    
    <div
        class="object event"
        class:hasStart={!!object.start}
        class:hasEnd={!!object.end}
        style="
            {object.color ? `--obj-color: ${object.color};` : ""}
        "
    >
        <CalendarAttributeButton {object} {client}>
            <div class="event-content">
                <span class="time">
                    <!-- Funky formatting to avoid whitespace -->
                    {startTimeString}&nbsp;
                </span>
                <span class="title">{object.title}</span>
            </div>
        </CalendarAttributeButton>
    </div>
{/if}

<style lang="scss">
    .object {
        width: 100%;
        margin-bottom: 0.125rem;
        line-height: 1;

        :global(> div > button) {
            width: 100%;
            padding: 0 0.25rem;
            font-size: 0.8rem;
            text-align: left;
            border-color: transparent;
            background-color: transparent;
            transition: background-color 200ms ease;

            &:hover {
                background-color: var(--surface-1);
            }
        }
    }

    .all-day-event {
        --color: var(--obj-color, var(--blue-background));
        color: var(--blue-text);
        border-radius: 5px;

        transition: background-color 200ms ease;
        background-color: var(--color);

        .title {
            color: var(--color-text);
        }

        &:hover {
            --color: color-mix(in srgb, var(--obj-color, var(--blue-background)) 85%, white);
        }
        :global(> div > button):hover {
            background-color: transparent;
        }
    }

    .time {
        color: var(--color-text);
        opacity: 0.8; // --subtle-text is too light
    }

    .title {
        color: color-mix(in srgb, var(--obj-color, var(--blue-background)) 80%, var(--color-text));
    }
</style>