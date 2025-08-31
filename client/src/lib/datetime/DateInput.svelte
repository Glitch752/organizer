<script lang="ts">
    import CalendarDatePicker from "./calendarDatePicker/CalendarDatePicker.svelte";
    import { parseFuzzyDate } from "./fuzzyDate";
    import { makePlainDate, parsePlainDate, type PlainDateString } from "./time";
    import PopupButton from "../PopupButton.svelte";

    let { value = $bindable(), onchange }: {
        value: PlainDateString,
        onchange: () => void
    } = $props();

    function formatDate(value: PlainDateString) {
        return parsePlainDate(value).toLocaleString(undefined, {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    }

    let interpretInputDate = $state(formatDate(value));
</script>

<PopupButton text={formatDate(value)} title={value}>
    <div class="interpret">
        <input type="text" bind:value={interpretInputDate} />
        <button onclick={() => {
            const date = parseFuzzyDate(interpretInputDate);
            if(date && date.result) {
                value = makePlainDate(date.result);
                onchange();
                interpretInputDate = formatDate(value);
            }
        }}>Set</button>
    </div>
    <svelte:boundary>
        {@const date = parseFuzzyDate(interpretInputDate)}
        {#if date && date.result}
            <span class="interpreting-as" title={date.explanation}>Interpreting {formatDate(makePlainDate(date.result))}</span>
        {:else}
            <span class="could-not-interpret">Could not interpret date</span>
        {/if}
    </svelte:boundary>
    <hr />
    <div class="content">
        <CalendarDatePicker bind:value onchange={() => { onchange(); }} />
    </div>
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

.content {
    font-size: 1rem;
}
</style>