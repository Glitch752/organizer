<script lang="ts">
    import type { ActionReturn } from "svelte/action";
    import { route } from "../stores/router";
    import { client, type PageType } from "./client";
    import ContextMenu from "./ContextMenu.svelte";
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

    let renaming = $state(false);

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

    function focusFull(target: HTMLInputElement): ActionReturn {
        target.focus();
        target.setSelectionRange(0, target.value.length);
        return {}
    }
</script>

<li
    ondrop={onDrop}
    class:dragging={$dragState.draggedPageId === page.id}
>
    <!-- TODO: Collapsing nav routes (and persist that?) -->
    <!-- TODO: Right click context menu -->
    <ContextMenu
        items={[
            {
                onClick: () => route.navigate(`/page/${page.id}`),
                label: "Open"
            },
            {
                onClick: () => window.open(route.url(`/page/${page.id}`), '_blank'),
                label: "Open in new tab"
            },
            { type: "hr", },
            {
                onClick: () => client.createPage({ parentId: page.id }),
                label: "Create new page"
            },
            {
                onClick: () => renaming = true,
                label: "Rename"
            },
            {
                // TODO: Confirmation?
                onClick: () => client.deletePage(page.id),
                label: "Delete page"
            }
        ]}
    >
        <button
            draggable={!renaming}
            ondragstart={handleDragStart}
            ondragend={handleDragEnd}
            ondragover={handleDragOver}
            ondragleave={handleDragLeave}
            class="blue monospace"
            class:dragging-over={$dragState.dragOverPageId === page.id && $dragState.dragOverPosition === 'child'}
            class:active={$route.onRoute("page", [page.id])}
            class:renaming={renaming}
            title={page.id}
            onclick={() => {
                if(!renaming) client.openPage(page.id)
            }}
        >
            {#if renaming}
                <input use:focusFull value={page.value.name} onblur={(e) => {
                    client.renamePage(page.id, (e.target as HTMLInputElement).value);
                    renaming = false;
                }}/>
            {:else}
                {page.value.name}
            {/if}
        </button>
    </ContextMenu>

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
            border-radius: 4px;
        }

        input {
            font: inherit;
            color: inherit;
            background-color: transparent;
            border: 1px solid var(--blue);
            width: calc(100% - 0.5rem);
            padding: 0;
            outline: none;
        }

        &.renaming {
            pointer-events: none;
            background-color: var(--surface-1) !important;
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