<script lang="ts">
    import { fly } from "svelte/transition";
    import { easeInOutQuad } from "../util/time";
    import DatePicker from "./DatePicker.svelte";
    import { parseFuzzyDate } from "./fuzzyDate";
    import { parseZonedDateTime, type ZonedDateTimeString } from "./time";
    import { Temporal } from "@js-temporal/polyfill";

    let { value = $bindable(), onchange }: {
        value: ZonedDateTimeString,
        onchange: () => void
    } = $props();

    function formatDate(value: ZonedDateTimeString) {
        const zdt = parseZonedDateTime(value);
        const currentZone = Temporal.Now.timeZoneId();
        return zdt.toLocaleString(undefined, {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            timeZoneName: currentZone === zdt.timeZoneId ? undefined : "short",
        });
    }

    let pickerOpen = $state(false);

    function windowClick(e: MouseEvent) {
        const target = e.target as HTMLElement;
        if(pickerOpen && !target.closest(".picker") && !target.closest(".date-input")) {
            pickerOpen = false;
        }
    }

    let interpretInputDate = $state(formatDate(value));
</script>

<svelte:window onclick={windowClick} />

<div>
    <button onclick={() => pickerOpen = !pickerOpen} class="date-input" title={value}>
        {formatDate(value)}
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
                    const date = parseFuzzyDate(interpretInputDate);
                    if(date && date.result) {
                        value = date.result;
                        onchange();
                        interpretInputDate = formatDate(value);
                    }
                }}>Set</button>
            </div>
            <svelte:boundary>
                {@const date = parseFuzzyDate(interpretInputDate)}
                {#if date && date.dateString}
                    <span class="interpreting-as" title={date.explanation}>Interpreting {formatDate(date.dateString)}</span>
                {:else}
                    <span class="could-not-interpret">Could not interpret date</span>
                {/if}
            </svelte:boundary>
            <hr />
            <DatePicker bind:value onchange={() => { onchange(); }} />
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