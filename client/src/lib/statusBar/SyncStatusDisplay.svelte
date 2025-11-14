<script lang="ts">
    import { SyncStatus } from "../../connection/document";

    const {
        currentStatus
    }: {
        currentStatus: SyncStatus
    } = $props();

    const syncStatusDisplay: {
        [status in SyncStatus]: { name: string, color: string }
    } = {
        [SyncStatus.None]:            { color: "inherit", name: "None" },
        [SyncStatus.UnsyncedChanges]: { color: "var(--yellow-text)", name: "Unsynced changes" },
        [SyncStatus.Synced]:          { color: "var(--green-text)", name: "Synced" },
        [SyncStatus.Disconnected]:    { color: "var(--red-text)", name: "Disconnected" },
        [SyncStatus.Connecting]:      { color: "var(--yellow-text)", name: "Connecting" },
        [SyncStatus.Error]:           { color: "var(--red-text)", name: "Error" },
    }
</script>

<span style="color: {syncStatusDisplay[currentStatus].color}">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 20v-5h-5M4 4v5h5m10.938 2A8.001 8.001 0 0 0 5.07 8m-1.008 5a8.001 8.001 0 0 0 14.868 3"/></svg>
    {syncStatusDisplay[currentStatus].name}
</span>

<style>
    svg {
        width: 1rem;
        height: 1rem;
        vertical-align: middle;
    }
</style>