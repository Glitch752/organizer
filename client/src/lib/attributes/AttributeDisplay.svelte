<script lang="ts">
    import { AttributeType, attributeTypes, type Attribute } from ".";
  import DateTimeInput from "../datetime/DateTimeInput.svelte";
    import CalendarEventTimes from "./CalendarEventTimes.svelte";

    const { data = $bindable(), onchange, onremove }: {
        data: Attribute,
        onchange: (data: Attribute) => void,
        onremove: () => void
    } = $props();
</script>

<div class="attribute">
    <header>
        <h3 title={attributeTypes[data.type].description}>{attributeTypes[data.type].name}</h3>
        <button class="remove" title="Remove attribute" onclick={onremove}>×</button>
    </header>

    <svelte:boundary>
        {#if data.type === AttributeType.CalendarEvent}
        <label>
            Enabled <input type="checkbox" bind:checked={data.enabled} onchange={() => onchange(data)} />
        </label>
        <CalendarEventTimes bind:times={data.times} onchange={() => onchange(data)} />
        {:else if data.type === AttributeType.CalendarDeadline}
        <label>
            Enabled <input type="checkbox" bind:checked={data.enabled} onchange={() => onchange(data)} />
        </label>
        <label>
            Due <DateTimeInput bind:value={data.due} onchange={() => onchange(data)} />
        </label>
        {:else}
        <span>Unknown attribute type {(data as any).type}</span>
        {/if}
        
        {#snippet failed(error)}
            <p>Failed to render attribute data. Try removing and re-adding it.</p>
        {/snippet}
    </svelte:boundary>
</div>

<style>
.attribute {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 10px;

    border-radius: 5px;
    background-color: var(--surface-0);

    font-family: var(--font-body);
    padding: 0.25rem 0.75rem 0.5rem 0.75rem;
}

header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

h3 {
    padding: 0;
    margin: 0;
    font-weight: 600;
    color: var(--color-important-text);
    font-size: 1.25rem;
}
label {
    font-size: 1rem;
    margin-top: 0.25rem;
    color: var(--color-text);
    display: flex;
    flex-direction: row;
    gap: 1rem;
    align-items: center;
    padding: 0 0.5rem;

    input[type=text] {
        flex: 1;
    }
}

.remove {
    background: transparent;
    border-color: transparent;
    font-size: 1.5rem;
    line-height: 1.5rem;
    color: var(--subtle-text);
    cursor: pointer;

    &:hover {
        color: var(--color-text);
    }
}
</style>