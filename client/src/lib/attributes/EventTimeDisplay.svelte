<script lang="ts">
    import { TimeType, timeTypes, type EventTime } from ".";
    import DateInput from "../datetime/DateInput.svelte";
    import DateTimeInput from "../datetime/DateTimeInput.svelte";
    import TimeInput from "../datetime/TimeInput.svelte";
    import RecurrenceCondition from "./RecurrenceCondition.svelte";

    let { time = $bindable(), onchange, onremove }: {
        time: EventTime,
        onchange: () => void,
        onremove: () => void
    } = $props();
</script>

<div class="time">
    <header>
        <h4 title={timeTypes[time.type].description}>{timeTypes[time.type].name}</h4>
        <button class="remove" title="Remove attribute" onclick={onremove}>×</button>
    </header>

    {#if time.type === TimeType.Single}
        <span>
            <DateTimeInput bind:value={time.start} {onchange} />
            to
            <DateTimeInput bind:value={time.end} {onchange} />
        </span>
    {:else if time.type === TimeType.Recurring}
        <span>
            <TimeInput bind:value={time.start} {onchange} />
            to
            <TimeInput bind:value={time.end} {onchange} />
        </span>
        
        Recurrence condition
        <RecurrenceCondition bind:condition={time.condition} {onchange} />
    {:else if time.type === TimeType.AllDay}
        <DateInput bind:value={time.date} {onchange} />
    {:else if time.type === TimeType.AllDayRecurring}
        Recurrence condition
        <RecurrenceCondition bind:condition={time.condition} {onchange} />
    {/if}
</div>

<style lang="scss">
.time {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    border-radius: 5px;
    border: 2px solid var(--surface-1-border);

    font-family: var(--font-body);
    padding: 0 0.5rem 0.5rem 0.5rem;
}

header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

h4 {
    padding: 0;
    margin: 0;
    font-weight: normal;
    color: var(--color-important-text);
    font-size: 1rem;
}

.remove {
    background: transparent;
    border-color: transparent;
    font-size: 1.25rem;
    line-height: 1.25rem;
    color: var(--subtle-text);
    cursor: pointer;

    &:hover {
        color: var(--color-text);
    }
}
</style>