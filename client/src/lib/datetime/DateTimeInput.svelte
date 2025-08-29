<script lang="ts">
    import { fly } from "svelte/transition";
    import { easeInOutQuad } from "../util/time";
    import DatePicker from "./DatePicker.svelte";
    import TimePicker from "./TimePicker.svelte";
    import { parseFuzzyDateTime } from "./fuzzyDate";
    import { makeZonedDateTime, parseZonedDateTime, type ZonedDateTimeString } from "./time";
    import TimeZonePicker from "./TimeZonePicker.svelte";
    import Portal from "../Portal.svelte";

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

    let pickerOpen = $state(false);

    function windowClick(e: MouseEvent) {
        const target = e.target as HTMLElement;
        if(pickerOpen && !target.closest(".picker") && !target.closest(".datetime-input")) {
            pickerOpen = false;
        }
    }

    let interpretInputDate = $state(formatDatetime(value));
</script>

<svelte:window onclick={windowClick} />

<div>
    <button onclick={() => pickerOpen = !pickerOpen} class="datetime-input" title={value}>
        {formatDatetime(value)}
    </button>

    {#if pickerOpen}
        <Portal target="body">
            <dialog
                open
                onclose={() => pickerOpen = false}
                transition:fly={{ duration: 150, easing: easeInOutQuad, y: -15 }}
                class="picker"
            >
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
            </dialog>
        </Portal>
    {/if}
</div>

<style lang="scss">
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

.column-separator {
    display: none;
}
.content {
    display: flex;
    flex-direction: row;

    .column {
        display: flex;
        flex-direction: column;
    }
}
</style>