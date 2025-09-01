<script lang="ts">
    import { Temporal } from "@js-temporal/polyfill";
    import type { PlainDateString } from "./time";
    import { makePlainDate } from "./time";
    import DateInput from "./DateInput.svelte";

    let { dates = $bindable(), onchange }: {
        dates: PlainDateString[],
        onchange: () => void
    } = $props();

    function addDate() {
        const today = makePlainDate(Temporal.Now.plainDateISO());
        dates = [...dates, today];
        onchange();
    }

    function removeDate(index: number) {
        dates = dates.filter((_, i) => i !== index);
        onchange();
    }
</script>

<div class="date-list-input">
    {#each dates as date, i}
        <div class="date-item">
            <button 
                class="remove-button" 
                onclick={() => removeDate(i)}
                title="Remove this date"
            >
                -
            </button>
            <DateInput 
                bind:value={dates[i]} 
                onchange={() => onchange()} 
            />{
                (i < dates.length - 1 && dates.length > 2) ? ", " : " "
            }
        </div>
    {/each}

    <button class="add-button blue" onclick={addDate}>
        + Add Date
    </button>
</div>

<style lang="scss">
    .date-list-input {
        display: inline-flex;
        padding-right: 1rem;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
        vertical-align: top;
    }
</style>
