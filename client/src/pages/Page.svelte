<script lang="ts">
    import { client } from "../lib/client";
    import { route } from "../stores/router";
    import Editor from "./Editor.svelte";

    // lmao
    let [id] = $derived([route.matches?.at(1), $route]);
</script>

{#if id}
    {#key id}
        <Editor {id} {client} />
    {/key}
{/if}