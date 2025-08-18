<script lang="ts">
    import { route } from "../stores/router";
    import type { PageType } from "../stores/sync";
    import Self from "./NavRouteButton.svelte";
    const { page }: { page: PageType } = $props();

    const active = $derived([route.onRoute("page", [page.value.id]), $route]);
</script>

<li>
    <button
        class="blue monospace"
        class:active={active[0]}
        onclick={() => route.navigate(`/page/${page.value.id}`)}
    >
        {page.value.name}
    </button>

    {#if Object.values(page.children).length > 0}
        <ul>
            {#each Object.values(page.children) as child}
                <Self page={child} />
            {/each}
        </ul>
    {/if}
</li>

<style lang="scss">
    ul {
        padding: 0;
        position: relative;
        list-style: none;
        margin: 0;
    }
    
    button {
        padding: 0 0.25rem;
        text-align: left;
        margin-right: auto;
    }
    
    li > :global(ul) {
        padding-left: 1.5rem;
    }

    li {
        --child-line-height: 1rem;
        --child-line-padding: 0.5rem;
        padding: 0.25rem 0 0 0;
        position: relative;
    }

    /* Connector line beside each item */
    li > :global(ul > li::before) {
        content: "";
        position: absolute;
        top: var(--child-line-padding);
        left: -1rem;
        border-left: 2px solid var(--surface-1-border);
        height: 100%;
    }
    li > :global(ul > li:last-child::before) {
        height: calc(var(--child-line-height) - var(--child-line-padding));
    }

    /* Horizontal connector to parent */
    li > :global(ul > li::after) {
        content: "";
        position: absolute;
        top: var(--child-line-height);
        left: -1rem;
        width: calc(1rem - var(--child-line-padding));
        border-top: 2px solid var(--surface-1-border);
    }
</style>