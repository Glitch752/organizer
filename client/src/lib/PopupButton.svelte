<script lang="ts">
    import anchorPolyfill from "@oddbird/css-anchor-positioning/fn";
    import type { Snippet } from "svelte";
    import Portal from "./Portal.svelte";
    import { easeInOutQuad } from "./util/time";
    import { fly } from "svelte/transition";

    const id = `popup-button-${Math.random().toString(36).substring(2, 15)}`;

    const { text, title, children }: {
        text: string,
        title?: string,
        children: Snippet
    } = $props();

    let pickerOpen = $state(false);

    // function windowClick(e: MouseEvent) {
    //     const target = e.target as HTMLElement;
    //     if(pickerOpen && !target.closest(".picker") && !target.closest(".datetime-input")) {
    //         pickerOpen = false;
    //     }
    // }
</script>

<!-- <svelte:window onclick={windowClick} /> -->

<div>
    <button onclick={() => pickerOpen = !pickerOpen} {title} style="anchor-name: --{id}">
        {text}
    </button>

    {#if pickerOpen}
        <Portal target="body">
            <dialog
                open
                onclose={() => pickerOpen = false}
                transition:fly={{ duration: 150, delay: 100, easing: easeInOutQuad, y: -15 }}
                class="picker"
                style="top: anchor(--{id} bottom); left: anchor(--{id} left);"
            >
                {@render children()}
            </dialog>
        </Portal>
    {/if}
</div>

<style lang="scss">
div {
    position: relative;
    display: inline;
}
dialog {
    border-radius: 5px;
    padding: 0.5rem;
    border: 2px solid var(--surface-1-border);
    background-color: var(--surface-0);
    position: absolute;
    top: 2rem;
    z-index: 100;
    display: flex;
    flex-direction: column;
}
</style>