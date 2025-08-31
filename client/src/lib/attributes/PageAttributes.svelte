<script lang="ts">
    import { onMount } from "svelte";
    import { attributeTypes } from ".";
    import type { Client } from "../client";
    import AttributeDisplay from "./AttributeDisplay.svelte";
    import { fly } from "svelte/transition";
    import { easeInOutQuad } from "../util/time";
    import { clickOff } from "../actions/clickOff.svelte";

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

<div class="attributes">
    {#each attributes as attribute, i}
        <AttributeDisplay bind:data={attributes[i]} onchange={(data) => {
            if(!attributeArray) return;
            attributeArray.doc.transact(() => {
                if(!attributeArray) return;
                attributeArray.delete(i);
                attributeArray.insert(i, [data]);
                console.log(data);
            });
        }} onremove={() => {
            if(!attributeArray) return;
            attributeArray.delete(i);
        }} />
    {/each}
    <div class="buttons">
        <button class="add" title="Add attribute" onclick={() => adding = !adding} aria-label="Add attribute">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" class="humbleicons hi-plus"><g xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-linecap="round" stroke-width="2"><path d="M12 19V5M19 12H5"/></g></svg>
        </button>
        <button title="Paste attribute" onclick={async () => {
            if(!attributeArray) return;
            try {
                const text = await navigator.clipboard.readText();
                const data = JSON.parse(text);
                if(typeof data !== "object" || data === null || !("type" in data) || !(data.type in attributeTypes)) {
                    return;
                }

                attributeArray.push([ data ]);
            } catch {
                console.log("Failed to paste attribute from clipboard");
            }
        }} aria-label="Paste attribute">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" class="humbleicons hi-clipboard"><path xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="M9 4H6a1 1 0 00-1 1v15a1 1 0 001 1h12a1 1 0 001-1V5a1 1 0 00-1-1h-3M9 3h6v4H9V3z"/></svg>    
        </button>
    </div>
    {#if adding}
        <ul
            class="options"
            transition:fly={{ duration: 150, easing: easeInOutQuad, y: -15 }}
            use:clickOff={() => adding = false}
        >
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

.buttons {
    display: flex;
    flex-direction: row;
    gap: 0.5rem;
    
    button {
        background-color: transparent;
        border-color: var(--subtle-background-highlight);
        color: var(--subtle-text);
        transition: border-color 0.2s ease, color 0.2s ease;
        display: grid;
        place-items: center;

        &:hover {
            border-color: var(--surface-1-border);
            color: var(--color-text);
        }

        svg {
            width: 1.25rem;
            height: 1.25rem;
        }
    }

    .add {
        flex: 1;
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