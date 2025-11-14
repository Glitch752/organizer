<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { SyncedDocument } from "../../connection/document";
    import SyncStatusDisplay from "./SyncStatusDisplay.svelte";
    import type { SyncStatus } from "../../connection/document";
    import type { DocumentID } from "@shared/connection/Document";

    const globalSyncStatus = SyncedDocument.globalSyncStatus;

    // kept up-to-date by calling updateDocs
    let docs: Array<SyncedDocument<any>> = [];

    // per-document listeners so we can clean up properly
    const listeners = new Map<DocumentID, {
        doc: SyncedDocument<any>,
        listener: (s: SyncStatus) => void
    }>();

    function updateDocs() {
        const newDocs = SyncedDocument.listInstances().slice().sort((a, b) => a.id.localeCompare(b.id));
        const newIds = new Set(newDocs.map(d => d.id));

        // Add listeners for new documents
        for(const doc of newDocs) {
            if(!listeners.has(doc.id)) {
                const listener = (_s: SyncStatus) => {
                    // set docs to update the list reactively
                    docs = SyncedDocument.listInstances().slice().sort((a, b) => a.id.localeCompare(b.id));
                };
                listeners.set(doc.id, { doc, listener });
                doc.on("statusChange", listener);
            } else {
                // if the stored doc reference differs from the current instance, update it
                const entry = listeners.get(doc.id)!;
                if(entry.doc !== doc) {
                    entry.doc.off("statusChange", entry.listener);
                    entry.doc = doc;
                    doc.on("statusChange", entry.listener);
                }
            }
        }

        // Remove listeners for documents which are no longer present
        for (const [id, { doc, listener }] of Array.from(listeners.entries())) {
            if (!newIds.has(id)) {
                doc.off("statusChange", listener);
                listeners.delete(id);
            }
        }

        docs = newDocs;
    }

    onMount(() => {
        // update on mount and whenever the global sync status changes
        const unsub = globalSyncStatus.subscribe(() => updateDocs());
        updateDocs();
        return () => {
            unsub();
        }
    });

    onDestroy(() => {
        for(const { doc, listener } of listeners.values()) {
            doc.off("statusChange", listener);
        }
        listeners.clear();
    });
</script>

<div class="synced-doc-list">
    <h3>Synced Documents</h3>

    {#if docs.length > 0}
        <ul>
            {#each docs as doc (doc.id)}
            <li class="doc" title="Reference count: {doc.refCount}">
                <span class="id">{doc.id}</span>
                <SyncStatusDisplay currentStatus={doc.status} />
            </li>
            {/each}
        </ul>
    {:else}
        <span class="empty">No documents currently synced</span>
    {/if}
</div>

<style lang="scss">
    .synced-doc-list {
        min-width: 15rem;
        padding: 0.25rem;
    }
    h3 {
        margin: 0.25rem 0.5rem;
        font-weight: normal;
        color: var(--foreground);
    }
    ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }
    .doc {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.25rem 0.5rem;
        font-size: 0.875rem;
        border-radius: 3px;

        &:hover {
            background-color: var(--surface-1);
        }
        .id {
            font-family: var(--font-mono);
            color: var(--subtle-text);
            flex: 1;
        }
    }
    .empty {
        color: var(--subtle-text);
        padding: 0.25rem 0.5rem;
        margin-bottom: 0.25rem;
    }
</style>