<script lang="ts">
    import { AttributeType, attributeTypes, type Attribute } from ".";

    const { data, onchange, onremove }: {
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

    {#if data.type === AttributeType.CalendarEvent}
    <label>
        Title <input type="text" bind:value={data.title} onchange={() => onchange(data)} />
    </label>
    <label>
        Enabled <input type="checkbox" bind:checked={data.enabled} onchange={() => onchange(data)} />
    </label>
    {:else if data.type === AttributeType.CalendarDeadline}
    <label>
        Title <input type="text" bind:value={data.title} onchange={() => onchange(data)} />
    </label>
    <label>
        Enabled <input type="checkbox" bind:checked={data.enabled} onchange={() => onchange(data)} />
    </label>
    {:else}
    <span>Unknown attribute type {(data as any).type}</span>
    {/if}
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
    padding: 0.25rem 0.75rem;
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
        background-color: var(--surface-1);
        border-radius: 5px;
        border: 2px solid var(--surface-1-border);
        outline: none;
        padding: 0.25rem 0.5rem;
        color: var(--color-text);

        &:focus-within {
            border-color: var(--blue-text);
        }
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