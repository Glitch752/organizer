<script lang="ts">
    import { TimeType, timeTypes, type EventTime } from ".";
    import DateInput from "./DateInput.svelte";
    import DateTimeInput from "./DateTimeInput.svelte";
  import TimeInput from "./TimeInput.svelte";

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
        <DateTimeInput bind:value={time.start} {onchange} />
        to
        <DateTimeInput bind:value={time.end} {onchange} />
    {:else if time.type === TimeType.Recurring}
        <TimeInput bind:value={time.start} {onchange} />
        to
        <TimeInput bind:value={time.end} {onchange} />
        
        {time.condition.type}
    {:else if time.type === TimeType.AllDay}
        <DateInput bind:value={time.date} {onchange} />
    {:else if time.type === TimeType.AllDayRecurring}
        {time.condition.type}
    {/if}
</div>

<style lang="scss">
.time {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    border-radius: 5px;
    margin-left: 1rem;
    border: 2px solid var(--surface-1-border);

    font-family: var(--font-body);
    padding: 0 0.5rem;
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