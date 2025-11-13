<script lang="ts">
    import type { Snippet } from "svelte";
    import { easeInOutQuad } from "./util/time";
    import { fly } from "svelte/transition";
    import { clickOff } from "./actions/clickOff.svelte";
    import Portal from "./Portal.svelte";

    const {
        text,
        buttonContent,
        title,
        children,
        anchorOptions = undefined,
        padding = true,
        onclose,
        portal = true,
        style = ""
    }: {
        text?: string,
        buttonContent?: Snippet,
        title?: string,
        children: Snippet,
        anchorOptions?: AnchorOptions,
        padding?: boolean,
        onclose?: () => void,
        portal?: boolean,
        style?: string
    } = $props();

    let pickerOpen = $state(false);

    let previousPickerOpen = false;
    $effect(() => {
        if(previousPickerOpen && !pickerOpen && onclose) onclose();
        previousPickerOpen = pickerOpen;
    });

    // svelte-ignore non_reactive_update Seems fine idk
    let button: HTMLButtonElement;

    export type AnchorOptions = {
        top?: "top" | "bottom",
        left?: "left" | "right",
        bottom?: "top" | "bottom",
        right?: "left" | "right",

        keepInViewport?: boolean
    };
    
    function anchor(el: HTMLElement, options: {
        to: HTMLElement
    } & AnchorOptions) {
        // Scroll-linked positioning is a bit gross, but anchor positioning isn't widely available yet
        // and the polyfill is a pain to use with Svelte

        el.style.position = "absolute";

        function nearestScrollableParent(el: HTMLElement): HTMLElement | null {
            let parent = el.parentElement;
            while(parent) {
                const style = window.getComputedStyle(parent);
                const isScrollable = /(auto|scroll|hidden)/.test(style.overflow + style.overflowX + style.overflowY);
                if(isScrollable) return parent;
                parent = parent.parentElement;
            }
            return null;
        }

        function nearestRelativeParent(el: HTMLElement): HTMLElement {
            let parent = el.parentElement;
            while(parent) {
                const style = window.getComputedStyle(parent);
                if(style.position !== "static") return parent;
                parent = parent.parentElement;
            }
            return document.body;
        }

        const scrollParent = nearestScrollableParent(options.to);
        const relativeParent = nearestRelativeParent(el);

        function update() {
            const rect = options.to.getBoundingClientRect();
            const elRect = el.getBoundingClientRect();
            
            const parentRect = relativeParent.getBoundingClientRect();

            // Calculate position relative to nearest positioned parent
            let top = 0, left = 0;
            if(options.top && options.left) {
                top = rect[options.top];
                left = rect[options.left];
            } else if(options.top && options.right) {
                top = rect[options.top];
                left = rect[options.right] - elRect.width;
            } else if(options.bottom && options.left) {
                top = rect[options.bottom] - elRect.height;
                left = rect[options.left];
            } else if(options.bottom && options.right) {
                top = rect[options.bottom] - elRect.height;
                left = rect[options.right] - elRect.width;
            }

            if(options.keepInViewport) {
                if(left < 0) left = 0;
                if(top < 0) top = 0;
                if(left + elRect.width > window.innerWidth) {
                    left = window.innerWidth - elRect.width;
                }
                if(top + elRect.height > window.innerHeight) {
                    top = window.innerHeight - elRect.height;
                }
            }

            top = top - parentRect.top;
            left = left - parentRect.left;

            el.style.top = `${top}px`;
            el.style.left = `${left}px`;

            const newRect = el.getBoundingClientRect();
            
            // Clamp the popup within its nearest scrollable parent

            if(scrollParent) {
                // Super hacky, but whatever
                let scrollRect = { 
                    left: Infinity, 
                    top: Infinity, 
                    right: -Infinity, 
                    bottom: -Infinity 
                };
                for(let i = 0; i < scrollParent.children.length; i++) {
                    const childRect = scrollParent.children[i].getBoundingClientRect();
                    scrollRect.left = Math.min(scrollRect.left, childRect.left);
                    scrollRect.top = Math.min(scrollRect.top, childRect.top);
                    scrollRect.right = Math.max(scrollRect.right, childRect.right);
                    scrollRect.bottom = Math.max(scrollRect.bottom, childRect.bottom);
                }
                // Fall back to scrollParent's own rect if no children
                if(scrollRect.left === Infinity) {
                    scrollRect = scrollParent.getBoundingClientRect();
                }
                if(newRect.right > scrollRect.right) {
                    const overflow = newRect.right - scrollRect.right;
                    el.style.left = `${left - overflow}px`;
                }
                if(newRect.left < scrollRect.left) {
                    const overflow = scrollRect.left - newRect.left;
                    el.style.left = `${left + overflow}px`;
                }
                if(newRect.bottom > scrollRect.bottom) {
                    const overflow = newRect.bottom - scrollRect.bottom;
                    el.style.top = `${top - overflow}px`;
                }
                if(newRect.top < scrollRect.top) {
                    const overflow = scrollRect.top - newRect.top;
                    el.style.top = `${top + overflow}px`;
                }
            }
        }
        update();

        const ro = new ResizeObserver(update);
        ro.observe(options.to);
        ro.observe(el);

        window.addEventListener("scroll", update, true);

        return {
            destroy() {
                ro.disconnect();
                window.removeEventListener("scroll", update, true);
            }
        };
    }
</script>

{#snippet btn()}
    <button bind:this={button} onclick={() => pickerOpen = !pickerOpen} {title} {style}>
        {@render buttonContent?.()}
        {text}
    </button>
{/snippet}

{#if portal}
    {@render btn()}

    {#if pickerOpen}
        <Portal target="body">
            <dialog
                use:anchor={{ to: button, top: "bottom", left: "left", ...(anchorOptions ?? {}) }}
                use:clickOff={() => pickerOpen = false}
                onclose={() => pickerOpen = false}
                transition:fly={{ duration: 150, delay: 30, easing: easeInOutQuad, y: -15 }}
                class="picker"
                class:padding
            >
                {@render children()}
            </dialog>
        </Portal>
    {/if}
{:else}
    <div>
        {@render btn()}

        {#if pickerOpen}
            <dialog
                use:anchor={{ to: button, top: "bottom", left: "left", ...(anchorOptions ?? {}) }}
                use:clickOff={() => pickerOpen = false}
                onclose={() => pickerOpen = false}
                transition:fly={{ duration: 150, delay: 30, easing: easeInOutQuad, y: -15 }}
                class="picker"
                class:padding
            >
                {@render children()}
            </dialog>
        {/if}
    </div>
{/if}

<style lang="scss">
div {
    position: relative;
    display: inline;
}
dialog {
    border-radius: 5px;
    padding: 0;
    &.padding {
        padding: 0.75rem;
    }
    margin: 0;
    border: 2px solid var(--surface-1-border);
    background-color: var(--surface-0);
    z-index: 100;
    display: flex;
    flex-direction: column;
}
</style>