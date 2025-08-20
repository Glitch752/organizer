<script lang="ts">
    import { route } from "../stores/router";
    import Editor from "./Editor.svelte";

    // lmao
    let [id] = $derived([route.matches?.at(1), $route]);
</script>

{#if id}
    {#key id}
        <Editor {id} />
    {/key}
{/if}