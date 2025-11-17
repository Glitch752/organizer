<script lang="ts">
    import type { Snippet } from "svelte";
    import Portal from "./Portal.svelte";

    const { children, items }: {
        children: Snippet,
        items: ({
            type: "hr"
        } | {
            type?: "button",
            onClick: () => void,
            label: string
        })[]
    } = $props();

    let anchorPosition = $state({ x: 0, y: 0 });
    let size = $state({ w: 0, h: 0 }); // TODO: update on first click?
    let shown = $state(false);

    function rightClickContextMenu(e: MouseEvent) {
        e.preventDefault();

        shown = true;
        anchorPosition = {
            x: e.clientX,
            y: e.clientY
        };

        // Keep inside the window
        if(window.innerHeight -  anchorPosition.y < size.h)
            anchorPosition.y = anchorPosition.y - size.h;
        if(window.innerWidth -  anchorPosition.x < size.w)
            anchorPosition.x = anchorPosition.x - size.w;
    }

    function onPageClick(e: MouseEvent) {
        shown = false;
        e.preventDefault();
    }

    function getContextMenuDimension(node: HTMLElement) {
        let height = node.offsetHeight
        let width = node.offsetWidth
        size = {
            h: height,
            w: width
        }
    }
</script>

<!-- TODO: Can we add this to the parent instead of having an  unnecessary div? -->
<div role="region" oncontextmenu={rightClickContextMenu}>{@render children()}</div>

{#if shown}
<Portal>
    <div class="interact-overlay" onclick={onPageClick} oncontextmenu={onPageClick} aria-hidden="true">
        <nav use:getContextMenuDimension style="position: absolute; top: {anchorPosition.y}px; left: {anchorPosition.x}px">
            <ul>
                {#each items as item}
                    {#if item.type == "hr"}
                        <hr>
                    {:else}
                        <li>
                            <button onclick={item.onClick}>{item.label}</button>
                        </li>
                    {/if}
                {/each}
            </ul>
        </nav>
    </div>
</Portal>
{/if}

<style>
    * {
        padding: 0;
        margin: 0;
    }
    .interact-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 1000;
    }

    nav {
        display: inline-flex;
        border: 1px var(--surface-1-border) solid;
        width: 170px;
        background-color: var(--surface-1);
        border-radius: 3px;
        overflow: hidden;
        flex-direction: column;
        padding: 3px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.45);
    }
    ul li {
        display: block;
        list-style-type: none;
        width: 1fr;
    }
    ul li button {
        font-size: 1rem;
        color: var(--color-text);
        width: 100%;
        height: 30px;
        text-align: left;
        padding: 0 1rem;
        border: 0px;
        border-radius: 3px;
        background-color: transparent;
    }
    ul li button:hover {
        text-align: left;
        background-color: var(--blue-background);
    }
    hr {
        border: none;
        border-bottom: 1px solid var(--surface-1-border);
        margin: 5px 0px;
    }
</style>