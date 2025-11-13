<script lang="ts">
    import TimePicker from "./TimePicker.svelte";
    import { parseFuzzyTime } from "./fuzzyDate";
    import TimeZonePicker from "./TimeZonePicker.svelte";
    import { isZonedTime, makePlainTime, parsePlainTime, parseZonedTime } from "./time";
    import PopupButton from "../PopupButton.svelte";
    import { Temporal } from "@js-temporal/polyfill";
    import type { PlainTimeString, ZonedTimeString } from "@shared/datetime";

    let { value = $bindable(), onchange }: {
        value: ZonedTimeString | PlainTimeString,
        onchange: () => void
    } = $props();

    function formatTime(value: ZonedTimeString | PlainTimeString) {
        if(isZonedTime(value)) {
            // If the zone isn't our current timezone, show the local time
            const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const { time, zone } = parseZonedTime(value);
            // A zoned date time with the date set to today.
            const zdt = Temporal.Now.zonedDateTimeISO(zone).withPlainTime(time);

            const localTime = zone === localZone ? "" :
                " (" + zdt.withTimeZone(localZone).toLocaleString(undefined, { hour: "numeric", minute: "2-digit", timeZoneName: "short" }) + ")";
            
            return zdt.toLocaleString(undefined, {
                hour: "numeric",
                minute: "2-digit",
                second: time.second !== 0 ? "2-digit" : undefined,
                timeZoneName: "shortGeneric"
            }) + localTime;
        } else {
            const time = parsePlainTime(value);
            return time.toLocaleString(undefined, {
                hour: "numeric",
                minute: "2-digit",
                second: time.second !== 0 ? "2-digit" : undefined
            });
        }
    }

    let interpretInputDate = $state(formatTime(value));
</script>

<PopupButton text={formatTime(value)} title={value} portal={false}>
    <div class="interpret">
        <input type="text" bind:value={interpretInputDate} />
        <button onclick={() => {
            const date = parseFuzzyTime(interpretInputDate);
            if(date && date.result) {
                value = makePlainTime(date.result);
                onchange();
                interpretInputDate = formatTime(value);
            }
        }}>Set</button>
    </div>
    <svelte:boundary>
        {@const date = parseFuzzyTime(interpretInputDate)}
        {#if date && date.result}
            <span class="interpreting-as" title={date.explanation}>Interpreting {formatTime(makePlainTime(date.result))}</span>
        {:else}
            <span class="could-not-interpret">Could not interpret date</span>
        {/if}
    </svelte:boundary>
    <hr />
    <TimePicker bind:value {onchange} />
    <hr />
    <TimeZonePicker bind:value {onchange} />
</PopupButton>

<style>
hr {
    border: none;
    border-top: 1px solid var(--surface-1-border);
    margin: 0.5rem 0;
}

.interpret {
    display: flex;
    flex-direction: row;
    gap: 0.5rem;

    input {
        flex: 1;
    }
    button {
        flex-shrink: 0;
    }
}

.interpreting-as {
    color: var(--subtle-text);
    font-size: 0.875rem;
    margin-top: 0.25rem;
}
.could-not-interpret {
    color: var(--color-error-text);
    font-size: 0.875rem;
    margin-top: 0.25rem;
}
</style>