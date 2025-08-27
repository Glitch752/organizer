<script lang="ts">
    import type { TimeOnly } from ".";
    import { fly } from "svelte/transition";
    import { easeInOutQuad } from "../util/time";
    import TimePicker from "./TimePicker.svelte";
    import { parseFuzzyTime } from "./fuzzyDate";

    let { value = $bindable(), onchange }: {
        value: TimeOnly,
        onchange: () => void
    } = $props();

    function formatTime(value: TimeOnly) {
        // Use the current day for this date
        const date = new Date((new Date()).toISOString().split('T')[0] + value);
        return date.toLocaleString(undefined, {
            hour: "numeric",
            minute: "2-digit"
        });
    }

    let pickerOpen = $state(false);

    function windowClick(e: MouseEvent) {
        const target = e.target as HTMLElement;
        if(pickerOpen && !target.closest(".picker") && !target.closest(".time-input")) {
            pickerOpen = false;
        }
    }

    let interpretInputDate = $state(formatTime(value));
</script>

<svelte:window onclick={windowClick} />

<div>
    <button onclick={() => pickerOpen = !pickerOpen} class="time-input" title={value}>
        {formatTime(value)}
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
                    const date = parseFuzzyTime(interpretInputDate);
                    if(date && date.isoTime) {
                        value = date.isoTime;
                        onchange();
                        interpretInputDate = formatTime(value);
                    }
                }}>Set</button>
            </div>
            <svelte:boundary>
                {@const date = parseFuzzyTime(interpretInputDate)}
                {#if date && date.isoTime}
                    <span class="interpreting-as" title={date.explanation}>Interpreting {formatTime(date.isoTime)}</span>
                {:else}
                    <span class="could-not-interpret">Could not interpret date</span>
                {/if}
            </svelte:boundary>
            <hr />
            <TimePicker bind:value onchange={() => { onchange(); }} />
        </dialog>
    {/if}
</div>

<style>
div {
    position: relative;
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