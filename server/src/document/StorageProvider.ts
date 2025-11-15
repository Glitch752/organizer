import type { DocumentID } from "@shared/connection/Document";
import * as Y from 'yjs';

export interface StorageProvider {
    /**
     * Load the document from storage. Return a Yjs update that fully describes
     * the document's state, or null if no stored document exists.
     */
    load(id: DocumentID): Promise<Uint8Array | null>;

    /**
     * Save the document to storage. Implementations may serialize the Y.Doc in a
     * provider-specific way, e.g. saving the primary text or a Yjs-encoded
     * update.
     */
    save(id: DocumentID, doc: Y.Doc): Promise<void>;
}
