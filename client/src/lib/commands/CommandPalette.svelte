<script lang="ts" module>
    export function openPalette(startValue: string = "") {
        paletteOpen = true;
        paletteValue = startValue;
    }

    let paletteOpen = $state(false);
    let paletteValue = $state("");
</script>

<script lang="ts">
    import { fly } from "svelte/transition";
    import { clickOff } from "../actions/clickOff.svelte";
    import { easeInOutQuad } from "../util/time";
    import { commands } from "./commands";
    import { client } from "../client";
    import { route } from "../../stores/router";

    const SHIFT_CHORD_THRESHOLD = 300; // milliseconds
    let lastShiftTime = 0;

    function onkeydown(e: KeyboardEvent) {
        // shift-shift chord to open the command palette
        if(e.key === "Shift" && !e.repeat && !e.ctrlKey && !e.altKey && !e.metaKey) {
            const now = Date.now();
            if(now - lastShiftTime <= SHIFT_CHORD_THRESHOLD) {
                openPalette(">");
                e.preventDefault();
                lastShiftTime = 0;
                return;
            } else {
                lastShiftTime = now;
            }
        }

        // Ctrl+P opens the palette to search for pages, Ctrl+Shift+P opens it to search for commands
        if(e.key.toLowerCase() === "p" && e.ctrlKey && !e.altKey) {
            if(e.shiftKey) {
                openPalette(">");
            } else {
                openPalette("");
            }
            e.preventDefault();
        } else if(e.key === "Escape" && paletteOpen) {
            paletteOpen = false;
            e.preventDefault();
        } else if(e.key === "Enter" && paletteOpen) {
            if(searchResults.length > 0) {
                searchResults[selectedEntry].execute();
                paletteOpen = false;
            }
            e.preventDefault();
        } else if(e.key === "ArrowUp" && paletteOpen) {
            selectedEntry = (selectedEntry - 1 + searchResults.length) % searchResults.length;
            e.preventDefault();
        } else if(e.key === "ArrowDown" && paletteOpen) {
            selectedEntry = (selectedEntry + 1) % searchResults.length;
            e.preventDefault();
        }

        for(const command of commands) {
            if(command.binds) for(const bind of command.binds) {
                if(e.key.toLowerCase() === bind.key.toLowerCase()
                    && !!e.ctrlKey === !!bind.ctrl
                    && !!e.shiftKey === !!bind.shift
                    && !!e.altKey === !!bind.alt) {
                    command.execute(client);
                    e.preventDefault();
                    break;
                }
            }
        }
    }

    function focus(node: HTMLInputElement) {
        // Wait a tick to ensure the element is in the DOM
        let previouslyFocused = document.activeElement as HTMLElement;
        setTimeout(() => node.focus(), 0);
        return {
            destroy() {
                previouslyFocused?.focus();
            }
        };
    }

    let searchResults: {
        text: string,
        execute: () => void
    }[] = $derived.by(() => {
        if(paletteValue.startsWith(">")) {
            const commandSearch = paletteValue.slice(1).trim().toLowerCase();
            return commands
                .filter(c => c.name.toLowerCase().includes(commandSearch))
                .map(c => ({
                    text: c.name,
                    execute: () => c.execute(client)
                }));
        } else {
            const pageSearch = paletteValue.trim().toLowerCase();
            return client.pageTree.getAllNodes()
                .filter(p => p.get("name")?.toLowerCase().includes(pageSearch))
                .map(p => ({
                    text: p.get("name") || "Untitled",
                    execute: () => route.navigate(`/page/${p.id()}`)
                }));
        }
    });

    let selectedEntry = $state(0);

    $effect(() => {
        searchResults;
        selectedEntry = 0;
    });
</script>

<svelte:window {onkeydown} />

{#if paletteOpen}
    <div
        class="palette"
        transition:fly={{ duration: 150, delay: 30, easing: easeInOutQuad, y: -15 }}
        use:clickOff={() => paletteOpen = false}
    >
        <!-- svelte-ignore a11y_autofocus - This is fine -->
        <input
            type="text"
            placeholder="Type a command or search..."
            bind:value={paletteValue}
            use:focus
            tabindex="0"
        />

        {#if searchResults.length === 0}
            <em>No results</em>
        {:else}
            {#each searchResults as result, index}
                <button
                    class="result"
                    onclick={() => {
                        result.execute();
                        paletteOpen = false;
                    }}
                    class:selected={index === selectedEntry}
                >
                    {result.text}
                </button>
            {/each}
        {/if}
    </div>
{/if}

<style lang="scss">
    .palette {
        position: fixed;
        top: 40px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
        
        width: 40rem;
        max-width: 90vw;
        
        color: var(--color-text);
        background-color: var(--surface-0);
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.45);

        display: flex;
        flex-direction: column;
        
        padding: 0.5rem;
        gap: 0.5rem;
    }

    .palette input[type="text"] {
        width: 100%;
        border-radius: 4px;
        border: 2px solid var(--surface-1-border);
        outline: none;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        
        font-size: 1rem;
        padding: 0.5rem 0.75rem;
    }

    button {
        all: unset;
        cursor: pointer;
        padding: 0.5rem 0.75rem;
        border-radius: 4px;
        text-align: left;

        &:hover {
            background-color: var(--surface-1);
        }

        &.selected {
            background-color: var(--surface-1);
        }
    }
</style>