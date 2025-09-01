<script lang="ts">
  import type { Snippet } from "svelte";
    import { link } from "../../stores/router";
    import AttributeDisplay from "../attributes/AttributeDisplay.svelte";
    import type { Client } from "../client";
    import PopupButton from "../PopupButton.svelte";
    import type { CalendarObject } from "./calendar";

    let {
        object,
        children,
        client
    }: {
        object: CalendarObject,
        children?: Snippet,
        client: Client
    } = $props();

    const attributeArray = client.attributesFor(object.pageId);
    let attribute = $state(attributeArray?.get(object.attributeIndex));

    let pageName = client.pageTree.getNode(object.pageId)?.get("name");
</script>

<PopupButton
    text={children ? undefined : object.title}
    title={object.title}
    onclose={() => {
        if(!attributeArray || !attribute) return;
        if(JSON.stringify(attribute) === JSON.stringify(attributeArray.get(object.attributeIndex))) return;
        
        attributeArray.doc.transact(() => {
            if(!attributeArray || !attribute) return;
            attributeArray.delete(object.attributeIndex);
            attributeArray.insert(object.attributeIndex, [$state.snapshot(attribute)]);
        });
    }}
    padding={false}
    keepInViewport={true}
    buttonContent={children}
>
    {#if attributeArray && attribute}
        <div class="attribute-preview">
            <span class="source">Attribute on <a use:link href={`/page/${object.pageId}`}>{pageName}</a></span>
            <AttributeDisplay bind:data={attribute} />
        </div>
    {:else}
        <div>Unable to find attribute</div>
    {/if}
</PopupButton>

<style lang="scss">
    .attribute-preview {
        min-width: 32rem;
        
        color: var(--color-text);

        .source {
            font-size: 0.875rem;
            color: var(--subtle-text);
            padding: 0.25rem 0.75rem;
            display: block;
        }
    }
</style>