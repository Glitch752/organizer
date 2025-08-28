<script lang="ts">
    import type { DayOfYearOnly } from ".";
    import { fly } from "svelte/transition";
    import { easeInOutQuad } from "../util/time";
    import TimePicker from "./TimePicker.svelte";
    import TimeZonePicker from "./TimeZonePicker.svelte";
    import { parseFuzzyDayOfYear } from "./fuzzyDate";

    let { value = $bindable(), onchange }: {
        value: DayOfYearOnly,
        onchange: () => void
    } = $props();

    function formatDay(value: DayOfYearOnly) {
        const date = new Date((new Date()).getFullYear() + '-' + value);
        return date.toLocaleString(undefined, {
            month: "short",
            day: "numeric"
        });
    }

    let pickerOpen = $state(false);

    function windowClick(e: MouseEvent) {
        const target = e.target as HTMLElement;
        if(pickerOpen && !target.closest(".picker") && !target.closest(".time-input")) {
            pickerOpen = false;
        }
    }

    let interpretInputDate = $state(formatDay(value));
</script>

<svelte:window onclick={windowClick} />

<div>
    <button onclick={() => pickerOpen = !pickerOpen} class="time-input" title={value}>
        {formatDay(value)}
    </button>

    {#if pickerOpen}
        <dialog
            open
            onclose={() => pickerOpen = false}
            transition:fly={{ duration: 150, easing: easeInOutQuad, y: -15 }}
            class="picker"
        >
            <div class="interpret">
                <input type="text" bind:value={interpretInputDate} />
                <button onclick={() => {
                    const date = parseFuzzyDayOfYear(interpretInputDate);
                    if(date && date.dayOfYear) {
                        value = date.dayOfYear;
                        onchange();
                        interpretInputDate = formatDay(value);
                    }
                }}>Set</button>
            </div>
            <svelte:boundary>
                {@const date = parseFuzzyDayOfYear(interpretInputDate)}
                {#if date && date.dayOfYear}
                    <span class="interpreting-as" title={date.explanation}>Interpreting {formatDay(date.dayOfYear)}</span>
                {:else}
                    <span class="could-not-interpret">Could not interpret date</span>
                {/if}
            </svelte:boundary>
            <hr />
            <TimeZonePicker bind:value {onchange} />
            <hr />
            <TimePicker bind:value {onchange} />
        </dialog>
    {/if}
</div>

<style>
div {
    position: relative;
    display: inline;
}
dialog {
    border-radius: 5px;
    padding: 0.5rem;
    border: 2px solid var(--surface-1-border);
    background-color: var(--surface-0);
    position: absolute;
    top: 2rem;
    z-index: 100;
    display: flex;
    flex-direction: column;
}

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