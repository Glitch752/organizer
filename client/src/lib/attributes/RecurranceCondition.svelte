<script lang="ts">
    import { conditionTypes, EventConditionType, type EventCondition } from ".";
    import DateInput from "../datetime/DateInput.svelte";
    import DayOfYearListInput from "../datetime/DayOfYearListInput.svelte";
    import MonthInput from "../datetime/MonthInput.svelte";
    import WeekdayInput from "../datetime/WeekdayInput.svelte";
    import NumberListInput from "./NumberListInput.svelte";
    import RecurranceCondition from "./RecurranceCondition.svelte";
    import RecurranceConditionList from "./RecurranceConditionList.svelte";

    let { condition = $bindable(), onchange }: {
        condition: EventCondition,
        onchange: () => void
    } = $props();
</script>

<span>
    <select value={condition.type} onchange={(ev) => {
        // Update the condition to its default
        const type = (ev.target as HTMLSelectElement).value as EventConditionType;
        condition = conditionTypes[type].default();
        onchange();
    }}>
        {#each Object.entries(conditionTypes) as [type, data]}
            <option value={type}>{data.name}</option>
        {/each}
    </select>

    {#if condition.type === EventConditionType.DayOfMonth}
        &nbsp;is in&nbsp;
        <NumberListInput bind:value={condition.days} {onchange} min={1} max={31} />
    {:else if condition.type === EventConditionType.Month}
        &nbsp;is in&nbsp;
        <MonthInput bind:months={condition.months} {onchange} />
    {:else if condition.type === EventConditionType.DayOfWeek}
        &nbsp;is in&nbsp;
        <WeekdayInput bind:days={condition.days} {onchange} />
    {:else if condition.type === EventConditionType.Date}
        &nbsp;is&nbsp;
        <DateInput bind:value={condition.date} {onchange} />
    {:else if condition.type === EventConditionType.DateRange}
        &nbsp;is between&nbsp;
        <DateInput bind:value={condition.start} {onchange} />
        and&nbsp;
        <DateInput bind:value={condition.end} {onchange} />
    {:else if condition.type === EventConditionType.DayOfYear}
        &nbsp;is on&nbsp;
        <DayOfYearListInput bind:days={condition.days} {onchange} />
    {:else if condition.type === EventConditionType.WeekOfMonth}
        &nbsp;is in week&nbsp;
        <NumberListInput bind:value={condition.weeks} {onchange} min={1} max={5} />
        &nbsp;of the month
    {:else if condition.type === EventConditionType.WeekOfYear}
        &nbsp;is in week&nbsp;
        <NumberListInput bind:value={condition.weeks} {onchange} min={1} max={53} />
        &nbsp;of the year
    {:else if condition.type === EventConditionType.Year}
        &nbsp;is in&nbsp;
        <NumberListInput bind:value={condition.years} {onchange} min={1970} max={2100} />
    {:else if condition.type === EventConditionType.Not}
        <div class="nested">
            <RecurranceCondition bind:condition={condition.condition} {onchange} />
        </div>
        {:else if condition.type === EventConditionType.And}
        <div class="nested">
            <RecurranceConditionList bind:conditions={condition.conditions} {onchange} lastSeparator="and" />
        </div>
        {:else if condition.type === EventConditionType.Or}
        <div class="nested">
            <RecurranceConditionList bind:conditions={condition.conditions} {onchange} lastSeparator="or" />
        </div>
    {:else}
        <!-- Unknown condition type -->
        Unknown condition type: {condition.type}
    {/if}
</span>

<style lang="scss">
    select {
        display: inline;
    }
    .nested {
        margin-left: 0.5rem;
        padding-left: 0.5rem;
        border-left: 2px solid var(--surface-1-border);

        display: flex;
        flex-direction: column;
    }
</style>