<script lang="ts">
    import DatePicker from "./DatePicker.svelte";
    import TimePicker from "./TimePicker.svelte";
    import { parseFuzzyDateTime } from "./fuzzyDate";
    import { makeZonedDateTime, parseZonedDateTime, type ZonedDateTimeString } from "./time";
    import TimeZonePicker from "./TimeZonePicker.svelte";
    import PopupButton from "../PopupButton.svelte";

    let { value = $bindable(), onchange }: {
        value: ZonedDateTimeString,
        onchange: () => void
    } = $props();

    function formatDatetime(value: ZonedDateTimeString) {
        const zdt = parseZonedDateTime(value);
        return zdt.toLocaleString(undefined, {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            second: zdt.second !== 0 ? "2-digit" : undefined,
            timeZoneName: "shortGeneric"
        });
    }

    let interpretInputDate = $state(formatDatetime(value));
</script>

<PopupButton text={formatDatetime(value)} title={value}>
    <div class="interpret">
        <input type="text" bind:value={interpretInputDate} />
        <button onclick={() => {
            const date = parseFuzzyDateTime(interpretInputDate);
            if(date && date.result) {
                value = makeZonedDateTime(date.result);
                onchange();
                interpretInputDate = formatDatetime(value);
            }
        }}>Set</button>
    </div>
    <svelte:boundary>
        {@const date = parseFuzzyDateTime(interpretInputDate)}
        {#if date && date.result}
            <span class="interpreting-as" title={date.explanation}>Interpreting {formatDatetime(makeZonedDateTime(date.result))}</span>
        {:else}
            <span class="could-not-interpret">Could not interpret date</span>
        {/if}
    </svelte:boundary>
    <hr />
    <div class="content">
        <DatePicker bind:value onchange={() => { onchange(); }} />
        <hr class="column-separator" />
        <div class="column">
            <TimePicker bind:value onchange={() => { onchange(); }} />
            <hr />
            <TimeZonePicker bind:value {onchange} />
        </div>
    </div>
</PopupButton>

<style lang="scss">
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

.column-separator {
    display: none;
}
.content {
    display: flex;
    flex-direction: row;
    gap: 0.75rem;

    hr {
        border: none;
        margin-top: 0;
    }
    .column {
        display: flex;
        flex-direction: column;
    }
}
</style>