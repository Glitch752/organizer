<script lang="ts">
    import { AttributeType, attributeTypes, type Attribute } from ".";
  import DateTimeInput from "../datetime/DateTimeInput.svelte";
    import CalendarEventTimes from "./CalendarEventTimes.svelte";

    const { data = $bindable(), onchange: changeHandler, onremove }: {
        data: Attribute,
        onchange?: (data: Attribute) => void,
        onremove?: () => void
    } = $props();

    const onchange = () => {
        changeHandler?.($state.snapshot(data));
    };
</script>

<div class="attribute">
    <header>
        <h3 title={attributeTypes[data.type].description}>{attributeTypes[data.type].name}</h3>
        <button title="Copy attribute" onclick={() => {
            navigator.clipboard.writeText(JSON.stringify(data));
        }} aria-label="Copy attribute">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" class="humbleicons hi-documents"><path xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="M13 3v7h7M6 7H5a1 1 0 00-1 1v12a1 1 0 001 1h9a1 1 0 001-1v-1M8 4v12a1 1 0 001 1h10a1 1 0 001-1V9.389a1 1 0 00-.263-.676l-4.94-5.389A1 1 0 0014.06 3H9a1 1 0 00-1 1z"/></svg>
        </button>
        {#if onremove}
            <button title="Cut attribute" onclick={() => {
                navigator.clipboard.writeText(JSON.stringify(data)).then(() => {
                    onremove();
                });
            }} aria-label="Cut attribute">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" class="humbleicons hi-scissors"><path xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 6c-3.573 2.225-5.943 3.854-8.55 6M20 18c-2.626-1.636-4.602-2.949-6.5-4.382M8.598 9.54a3 3 0 10-3.196-5.08 3 3 0 003.196 5.08zm0 0A89.3 89.3 0 0011.45 12m-2.852 2.46a3 3 0 10-3.196 5.079 3 3 0 003.196-5.078zm0 0A89.287 89.287 0 0111.45 12"/></svg>
            </button>
            <button title="Remove attribute" onclick={onremove} aria-label="Remove attribute">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" class="humbleicons hi-times"><g xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-linecap="round" stroke-width="2"><path d="M6 18L18 6M18 18L6 6"/></g></svg>
            </button>
        {/if}
    </header>

    <svelte:boundary>
        {#if data.type === AttributeType.CalendarEvent}
        <label>
            <span>Enabled</span> <input type="checkbox" bind:checked={data.enabled} {onchange} />
        </label>
        <label>
            <span>Title</span> <input type="text" bind:value={data.title} {onchange} placeholder="Leave blank to use page title" />
        </label>
        <CalendarEventTimes bind:times={data.times} {onchange} />
        {:else if data.type === AttributeType.CalendarDeadline}
        <label>
            <span>Enabled</span> <input type="checkbox" bind:checked={data.enabled} {onchange} />
        </label>
        <label>
            <span>Title</span> <input type="text" bind:value={data.title} {onchange} placeholder="Leave blank to use page title" />
        </label>
        <label>
            <span>Due</span> <DateTimeInput bind:value={data.due} {onchange} />
        </label>
        {:else}
        <span>Unknown attribute type {(data as any).type}</span>
        {/if}
        
        <!-- {#snippet failed(error)}
            <p {@attach () => {
                console.error(error);
            }}>Failed to render attribute data. Try removing and re-adding it.</p>
        {/snippet} -->
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

    color: var(--color-text);
}

header {
    display: flex;
    align-items: center;

    button {
        background: transparent;
        border-color: transparent;
        font-size: 1.5rem;
        line-height: 1.5rem;
        color: var(--subtle-text);
        cursor: pointer;
        padding: 0;
        transition: color 200ms ease;

        svg {
            width: 1.25rem;
            height: 1.25rem;
        }

        &:hover {
            color: var(--color-text);
        }
    }
}

h3 {
    padding: 0;
    margin: 0;
    font-weight: 600;
    color: var(--color-important-text);
    font-size: 1.25rem;
    flex: 1;
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

    /* Make text a consistent width */
    > span {
        width: 4rem;
    }

    input[type=text] {
        flex: 1;
    }
}
</style>