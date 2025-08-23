<script lang="ts">
  	import { route } from "../stores/router";
  import { client } from "./client";
    import NavRouteButton from "./NavRouteButton.svelte";

    const treeview = client.immutablePageTreeView;
</script>

<nav>
    <button class="blue" class:active={$route == "/calendar"} onclick={() => route.navigate("/calendar")}>Calendar</button>
    <div class="separator"></div>
    <div class="controls">

    </div>
    <ul>
        {#each $treeview.sort((b, a) => {
            // Sort by name; the view is already sorted by ID, so ties are handled appropriately.
            return b.value.name.localeCompare(a.value.name);
        }) as page}
            <NavRouteButton {page} />
        {/each}
    </ul>
</nav>

<style lang="scss">
    nav {
        grid-column: -2 / -1;
        grid-row: 1 / -1;

        background-color: var(--surface-0);

		border-left: 2px solid var(--surface-1-border);

        display: flex;
        flex-direction: column;
        padding: 0.5rem;
        margin: 0;
        gap: 0.5rem;

        > button {
            text-align: left;
            padding: 0.25rem 0.5rem;
        }

        > ul {
            overflow-y: auto;
            overflow-x: hidden;
        }
        > ul > :global(li:first-child) {
            padding-top: 0;
        }
    }

    ul {
        padding: 0;
        position: relative;
        list-style: none;
        margin: 0;
    }
    
    .separator {
        border-bottom: 2px solid var(--surface-1-border);
        display: block;
    }
</style>