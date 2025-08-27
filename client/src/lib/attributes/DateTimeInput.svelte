<script lang="ts">
    import type { DateTime } from ".";

    let { value = $bindable(), onchange }: {
        value: DateTime,
        onchange: () => void
    } = $props();

    function formatDatetime(value: DateTime) {
        const date = new Date(value);
        return date.toLocaleString(undefined, {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    let pickerOpen = $state(false);

    function windowClick() {
        
    }
</script>

<svelte:window onclick={windowClick} />

<button onclick={() => pickerOpen = true}>
    {formatDatetime(value)}
</button>

<dialog open={pickerOpen} onclose={() => pickerOpen = false} class="picker">
    todo
</dialog>

<style>

</style>