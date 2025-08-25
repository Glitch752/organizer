<script lang="ts">
    import type { Client } from "../client";

    const { client }: { client: Client } = $props();

    const attributes = client.attributes;
</script>

<div>
{#if attributes}
    {#each attributes as attribute}
        <span>{attribute}</span>
    {/each}
    <button class="add" title="Add attribute">+</button>
    <ul class="options">
        <!-- {#each } -->
        <!-- TODO -->
    </ul>
{/if}
</div>

<style>
div {
    width: 100%;
    display: flex;
    flex-direction: column;
    padding: 0.5rem 0;
}

button.add {
    display: block;
    width: 100%;
    background-color: transparent;
    border-color: var(--subtle-background-highlight);
    color: var(--subtle-text);
    transition: border-color 0.2s ease, color 0.2s ease;

    &:hover {
        border-color: var(--surface-1-border);
        color: var(--color-text);
    }
}
</style>