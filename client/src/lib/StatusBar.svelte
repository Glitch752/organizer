<script lang="ts">
    import { SyncedDocument, SyncStatus } from "../connection/document";
    
    const syncStatus = SyncedDocument.globalSyncStatus;
    
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

<div class="statusbar">
    <button class="sync-status" style="color: {syncStatusDisplay[$syncStatus].color}">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 20v-5h-5M4 4v5h5m10.938 2A8.001 8.001 0 0 0 5.07 8m-1.008 5a8.001 8.001 0 0 0 14.868 3"/></svg>
        {syncStatusDisplay[$syncStatus].name}
    </button>
</div>


<style lang="scss">
    .statusbar {
        display: flex;
        flex-direction: row;
        // border-top: 1px solid var(--surface-1-border);
        background-color: var(--background);
        font-size: 0.875rem;
    }

    button {
        border: none;
        background-color: transparent;
        padding: 0 0.5rem;
        border-radius: 0;
        font-size: inherit;

        &:hover {
            background-color: var(--surface-0);
        }

        svg {
            width: 1rem;
            height: 1rem;
            vertical-align: middle;
        }
    }
</style>