<script lang="ts">
    import type { Snippet } from "svelte";
    import Portal from "./Portal.svelte";
    import { easeInOutQuad } from "./util/time";
    import { fly } from "svelte/transition";
    import { clickOff } from "./actions/clickOff.svelte";

    const { text, title, children }: {
        text: string,
        title?: string,
        children: Snippet
    } = $props();

    let pickerOpen = $state(false);

    // svelte-ignore non_reactive_update Seems fine idk
    let button: HTMLButtonElement;
    
    function anchor(el: HTMLElement, options: {
        to: HTMLElement,
        
        top?: "top" | "bottom",
        left?: "left" | "right",
        bottom?: "top" | "bottom",
        right?: "left" | "right"
    }) {
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
                top = rect[options.top] - parentRect.top;
                left = rect[options.left] - parentRect.left;
            } else if(options.top && options.right) {
                top = rect[options.top] - parentRect.top;
                left = rect[options.right] - parentRect.left - elRect.width;
            } else if(options.bottom && options.left) {
                top = rect[options.bottom] - parentRect.top - elRect.height;
                left = rect[options.left] - parentRect.left;
            } else if(options.bottom && options.right) {
                top = rect[options.bottom] - parentRect.top - elRect.height;
                left = rect[options.right] - parentRect.left - elRect.width;
            }
            el.style.top = `${top}px`;
            el.style.left = `${left}px`;

            const newRect = el.getBoundingClientRect();
            
            // Clamp the popup within its nearest scrollable parent
            // We don't necessarily care that it's within

            if(scrollParent) {
                // Super hacky, but whatever
                const scrollRect = scrollParent.children[0].getBoundingClientRect();
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

        const ro = new ResizeObserver(() => console.log("resized"));
        ro.observe(options.to);

        window.addEventListener("scroll", update, true);

        return {
            destroy() {
                ro.disconnect();
                window.removeEventListener("scroll", update, true);
            }
        };
    }
</script>

<div>
    <button bind:this={button} onclick={() => pickerOpen = !pickerOpen} {title}>
        {text}
    </button>

    {#if pickerOpen}
        <!-- <Portal target="body"> -->
            <dialog
                use:anchor={{ to: button, top: "bottom", left: "left" }}
                use:clickOff={() => pickerOpen = false}
                open
                onclose={() => pickerOpen = false}
                transition:fly={{ duration: 150, delay: 30, easing: easeInOutQuad, y: -15 }}
                class="picker"
            >
                {@render children()}
            </dialog>
        <!-- </Portal> -->
    {/if}
</div>

<style lang="scss">
div {
    position: relative;
    display: inline;
}
dialog {
    border-radius: 5px;
    padding: 0.75rem;
    margin: 0;
    border: 2px solid var(--surface-1-border);
    background-color: var(--surface-0);
    z-index: 100;
    display: flex;
    flex-direction: column;
}
</style>