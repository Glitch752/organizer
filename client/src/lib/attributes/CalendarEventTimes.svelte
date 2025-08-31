<script lang="ts">
    import { fly } from "svelte/transition";
    import { timeTypes, type EventTime } from ".";
    import { easeInOutQuad } from "../util/time";
    import EventTimeDisplay from "./EventTimeDisplay.svelte";
    import { clickOff } from "../actions/clickOff.svelte";

    let { times = $bindable(), onchange }: {
        times: EventTime[],
        onchange: () => void
    } = $props();

    let adding = $state(false);
</script>

<div class="header">
    <h4>Times</h4>
    <button class="add" title="Add attribute" onclick={() => adding = !adding}>+</button>
    {#if adding}
        <ul
            class="options"
            use:clickOff={() => adding = false}
            transition:fly={{ duration: 150, easing: easeInOutQuad, y: -15 }}
        >
            {#each Object.entries(timeTypes) as [type, data]}
            <li>
                <button onclick={() => {
                    times = [...times, data.default() ];
                    onchange();
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
<div class="event-times">
    {#each times as _, i}
        <EventTimeDisplay bind:time={times[i]} {onchange} onremove={() => {
            times.splice(i, 1);
            times = times;
            onchange();
        }} />
    {/each}
</div>

<style lang="scss">
.header {
    position: relative;
    display: flex;
    gap: 1rem;
    padding: 0 0.5rem;
    margin-top: 0.25rem;
}

h4 {
    display: inline-block;
    font-size: 1rem;
    margin: 0 0 0.25rem 0;
    font-weight: normal;
    font-size: 1rem;
    width: 4rem;
}

.event-times {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

button.add {
    display: inline;
    width: 6rem;
    color: var(--subtle-text);
    transition: color 0.2s ease;

    &:hover {
        color: var(--color-text);
    }
}

.options {
    position: absolute;
    z-index: 10;
    top: 0.75rem;
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