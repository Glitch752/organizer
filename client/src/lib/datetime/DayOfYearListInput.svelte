<script lang="ts">
    import { Temporal } from "@js-temporal/polyfill";
    import { makePlainMonthDay } from "./time";
    import DayOfYearInput from "./DayOfYearInput.svelte";
    import type { PlainMonthDayString } from "@shared/datetime";

    let { days = $bindable(), onchange }: {
        days: PlainMonthDayString[],
        onchange: () => void
    } = $props();

    function addDate() {
        const today = makePlainMonthDay(Temporal.Now.plainDateISO().toPlainMonthDay());
        days = [...days, today];
        onchange();
    }

    function removeDate(index: number) {
        days = days.filter((_, i) => i !== index);
        onchange();
    }
</script>

<div class="date-list-input">
    {#each days as day, i}
        <div class="date-item">
            <button 
                class="remove-button" 
                onclick={() => removeDate(i)}
                title="Remove this date"
            >
                -
            </button>
            <DayOfYearInput 
                bind:value={days[i]} 
                onchange={() => onchange()} 
            />{
                (i < days.length - 1 && days.length > 2) ? ", " : " "
            }
        </div>
    {/each}

    <button class="add-button blue" onclick={addDate}>
        + Add Day
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
