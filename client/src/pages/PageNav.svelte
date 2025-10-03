<script lang="ts">
    import NavRouteButton from "../lib/NavRouteButton.svelte";
    import { client } from "../lib/client";
    import { writable } from "svelte/store";

    const treeview = client.immutablePageTreeView;
    // Drag and drop state
    const dragState = writable<{
        draggedPageId: string | null;
        dragOverPageId: string | null;
        dragOverPosition: 'child' | 'root' | null;
    }>({
        draggedPageId: null,
        dragOverPageId: null,
        dragOverPosition: null
    });

    function handleDrop(targetPageId: string | null, position: 'child' | 'root') {
        const draggedId = $dragState.draggedPageId;
        if(!draggedId || draggedId === targetPageId) return;

        const draggedNode = client.pageTree.getNode(draggedId);
        if(!draggedNode) return;

        if(position === 'root') {
            draggedNode.reparent(client.pageTree.root());
        } else if(targetPageId) {
            const targetNode = client.pageTree.getNode(targetPageId);
            if(!targetNode) return;

            draggedNode.reparent(targetNode);
        }

        // Clear drag state
        dragState.set({
            draggedPageId: null,
            dragOverPageId: null,
            dragOverPosition: null
        });
    }

    function handleRootDrop(event: DragEvent) {
        event.preventDefault();
        handleDrop(null, 'root');
    }

    function handleRootDragOver(event: DragEvent) {
        event.preventDefault();
        dragState.update(state => ({
            ...state,
            dragOverPageId: null,
            dragOverPosition: 'root'
        }));
    }

    function handleRootDragLeave(event: DragEvent) {
        // Only clear if we're actually leaving the root area
        const target = event.target as HTMLElement;
        if(target.classList.contains('root-drop-zone')) {
            dragState.update(state => ({
                ...state,
                dragOverPageId: null,
                dragOverPosition: null
            }));
        }
    }
</script>

<div class="controls">
    <button></button>
</div>
<ul>
    {#each $treeview.sort((b, a) => {
        // Sort by name; the view is already sorted by ID, so ties are handled appropriately.
        return b.value.name.localeCompare(a.value.name);
    }) as page}
        <NavRouteButton {page} {dragState} {handleDrop} />
    {/each}

    <li
        class="root-drop-zone" 
        class:drag-over={$dragState.dragOverPosition === 'root'}
        class:drag-active={$dragState.draggedPageId !== null}
        ondrop={handleRootDrop}
        ondragover={handleRootDragOver}
        ondragleave={handleRootDragLeave}
    >
        Drop here to move to root
    </li>
</ul>

<style>
    ul {
        padding: 0;
        position: relative;
        list-style: none;
        margin: 0;
        padding: 0.5rem;
        overflow-y: auto;
    }

    .root-drop-zone {
        padding: 0.5rem;
        margin: 0.5rem -3px 0 -3px;
        border-radius: 4px;
        border: 2px dashed transparent;
        text-align: center;
        font-size: 0.875rem;
        color: var(--subtle-text);
        opacity: 0;
        transition: all 0.2s ease;
        pointer-events: none;
        
        &.drag-active {
            opacity: 1;
            pointer-events: auto;
        }
        &.drag-over {
            opacity: 1;
            pointer-events: auto;
            border-color: var(--surface-1-border);
            color: var(--color-text);
        }
    }
</style>