<script lang="ts">
    let { days = $bindable(), onchange }: {
        days: string[],
        onchange: () => void
    } = $props();
</script>

<!-- TODO -->