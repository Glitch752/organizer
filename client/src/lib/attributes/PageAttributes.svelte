<script lang="ts">
    import { onMount } from "svelte";
    import { attributeTypes } from ".";
    import type { Client } from "../client";
    import AttributeDisplay from "./AttributeDisplay.svelte";

    const { client }: { client: Client } = $props();

    // svelte-ignore non_reactive_update
    let attributeArray = client.attributes;

    let adding = $state(false);

    const wasLoaded = client.workspaceLoaded;
    let attributes = $state(attributeArray?.toArray() ?? []);
    onMount(() => {
        client.onWorkspaceLoaded(() => {
            attributeArray = client.attributes;
            if(!attributeArray) return;

            if(!wasLoaded) attributes = attributeArray.toArray();

            const update = () => {
                attributes = attributeArray!.toArray();
            };
            attributeArray.observe(update);

            return () => {
                if(!attributeArray) return;
                attributeArray.unobserve(update);
            };
        });
    });
</script>

<svelte:window onclick={(e) => {
    if(!(e.target as HTMLElement).closest('.options') && !(e.target as HTMLElement).closest('.add')) adding = false
}} />

<div class="attributes">
{#each attributes as attribute, i}
    <AttributeDisplay data={attribute} onchange={(data) => {
        if(!attributeArray) return;
        attributeArray.doc.transact(() => {
            if(!attributeArray) return;
            attributeArray.delete(i);
            attributeArray.insert(i, [data]);
        });
    }} onremove={() => {
        if(!attributeArray) return;
        attributeArray.delete(i);
    }} />
{/each}
<button class="add" title="Add attribute" onclick={() => adding = !adding}>+</button>
{#if adding}
    <ul class="options">
        {#each Object.entries(attributeTypes) as [type, data]}
            <li>
                <button onclick={() => {
                    if(!attributeArray) return;
                    attributeArray.push([ data.default() ]);
                    adding = false;
                }}>
                    <em>{data.name}</em>
                    <small>{data.description}</small>
                </button>
            </li>
        {/each}
    </ul>
{/if}
</div>

<style>
.attributes {
    width: 100%;
    display: flex;
    flex-direction: column;
    padding: 0.5rem 0;
    position: relative;
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

.options {
    position: absolute;
    z-index: 10;
    top: calc(100% - 1.5rem);
    left: 0;
    right: 0;

    list-style: none;
    border-radius: 4px;
    background-color: var(--surface-0);
    border: 2px solid var(--surface-1-border);
    
    display: flex;
    flex-direction: column;
    padding: 0;

    button {
        width: 100%;
        text-align: left;
        padding: 0.5rem;
        background-color: transparent;
        border: none;
        border-radius: 0;
        color: var(--color-text);

        &:not(:last-of-type) {
            border-bottom: 1px solid var(--surface-1-border);
        }

        &:hover {
            background-color: var(--surface-1);
        }

        em {
            font-style: normal;
            font-weight: 600;
            display: block;
        }

        small {
            font-size: 0.875rem;
            color: var(--subtle-text);
        }
    }
}
</style>