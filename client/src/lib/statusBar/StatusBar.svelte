<script lang="ts">
    import { SyncedDocument } from "../../connection/document";
    import PopupButton from "../PopupButton.svelte";
    import SyncedDocumentList from "./SyncedDocumentList.svelte";
    import SyncStatusDisplay from "./SyncStatusDisplay.svelte";
    
    const currentStatus = SyncedDocument.globalSyncStatus;
</script>

<div class="statusbar">
    {#snippet syncStatus()}
        <SyncStatusDisplay currentStatus={$currentStatus} />
    {/snippet}
    <PopupButton
        buttonContent={syncStatus}
        anchorOptions={{
            bottom: "top",
            top: undefined
        }}
        padding={false}
    >
        <SyncedDocumentList />
    </PopupButton>
</div>


<style lang="scss">
    .statusbar {
        display: flex;
        flex-direction: row;
        // border-top: 1px solid var(--surface-1-border);
        background-color: var(--background);
        font-size: 0.875rem;
    }

    .statusbar > :global(button) {
        border: none;
        background-color: transparent;
        padding: 0 0.5rem;
        border-radius: 0;
        font-size: inherit;

        &:hover {
            background-color: var(--surface-1);
        }
    }
</style>