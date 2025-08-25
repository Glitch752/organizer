<script lang="ts">
    import { route } from "../stores/router";
    import type { PageType } from "./client";
    import Self from "./NavRouteButton.svelte";
    import type { Writable } from "svelte/store";
    
    const { 
        page,
        dragState,
        handleDrop
    }: { 
        page: PageType;
        dragState: Writable<{
            draggedPageId: string | null;
            dragOverPageId: string | null;
            dragOverPosition: 'child' | 'root' | null;
        }>;
        handleDrop: (targetPageId: string | null, position: 'child' | 'root') => void;
    } = $props();

    const active = $derived([route.onRoute("page", [page.id]), $route]);

    function handleDragStart(event: DragEvent) {
        if(!event.dataTransfer) return;
        
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', page.id);
        
        dragState.update(state => ({
            ...state,
            draggedPageId: page.id
        }));
    }

    function handleDragEnd(event: DragEvent) {
        dragState.set({
            draggedPageId: null,
            dragOverPageId: null,
            dragOverPosition: null
        });
    }

    function handleDragOver(event: DragEvent) {
        event.preventDefault();
        if(!event.dataTransfer) return;
        
        const draggedId = $dragState.draggedPageId;
        if(!draggedId || draggedId === page.id) return;
        
        dragState.update(state => ({
            ...state,
            dragOverPageId: page.id,
            dragOverPosition: 'child'
        }));
    }

    function handleDragLeave(event: DragEvent) {
        // Only clear if we're actually leaving this element
        const relatedTarget = event.relatedTarget as HTMLElement;
        const currentTarget = event.currentTarget as HTMLElement;
        
        if(!relatedTarget || !currentTarget.contains(relatedTarget)) {
            dragState.update(state => ({
                ...state,
                dragOverPageId: state.dragOverPageId === page.id ? null : state.dragOverPageId,
                dragOverPosition: state.dragOverPageId === page.id ? null : state.dragOverPosition
            }));
        }
    }

    function onDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        
        const position = $dragState.dragOverPosition;
        if(position && position !== 'root') handleDrop(page.id, position);
    }
</script>

<li
    ondrop={onDrop}
    class:dragging={$dragState.draggedPageId === page.id}
>
    <button
        draggable="true"
        ondragstart={handleDragStart}
        ondragend={handleDragEnd}
        ondragover={handleDragOver}
        ondragleave={handleDragLeave}
        class="blue monospace"
        class:dragging-over={$dragState.dragOverPageId === page.id && $dragState.dragOverPosition === 'child'}
        class:active={active[0]}
        title={page.id}
        onclick={() => route.navigate(`/page/${page.id}`)}
    >
        {page.value.name}
    </button>

    {#if Object.values(page.children).length > 0}
        <ul>
            {#each Object.values(page.children).sort((b, a) => {
                // Sort by name; the view is already sorted by ID, so ties are handled appropriately.
                return b.value.name.localeCompare(a.value.name);
            }) as child}
                <Self page={child} {dragState} {handleDrop} />
            {/each}
        </ul>
    {/if}

    <div class="drag-highlight"></div>
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

        &.dragging-over {
            background-color: var(--accent-color-alpha);
            border-radius: 4px;
            color: var(--accent-color);
        }
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

    /* Drag and drop styles */
    li {
        cursor: grab;
        position: relative;
        
        &.dragging > button, &.dragging > ul {
            opacity: 0.7;
            border-radius: 5px;
            cursor: grabbing;
        }
        .drag-highlight {
            position: absolute;
            inset: 1px -3px -3px -3px;
            pointer-events: none;
            border-radius: 5px;
            border: 2px dashed transparent;
        }
        &.dragging > .drag-highlight {
            border-color: var(--surface-1-border);
        }
    }

    button {
        pointer-events: none;
    }
    
    li:not(.dragging) button {
        pointer-events: auto;
    }
</style>