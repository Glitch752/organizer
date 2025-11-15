import { StorageProvider } from "./StorageProvider";
import { DocumentID } from "@shared/connection/Document";
import { DataStore } from "../DataStore";
import * as Y from "yjs";
import { RawStorageProvider } from "./RawStorageProvider";

export class NoteStorageProvider implements StorageProvider {
    private rawProvider: RawStorageProvider;

    constructor(private dataStore: DataStore) {
        this.rawProvider = new RawStorageProvider(dataStore, ".pageCache", {
            "content": null,
            "selection": "map"
        });
    }

    public async load(id: DocumentID): Promise<Uint8Array | null> {
        // Load raw text from DataStore and return it encoded as a Yjs state update.
        const text = await this.dataStore.readDocument(id);
        if(text === null) return null;

        const doc = new Y.Doc();
        // Set content text if it exists
        const ytext = doc.getText("content");
        if(text.length > 0) ytext.insert(0, text);

        const update = await this.rawProvider.load(id);
        if(update) {
            Y.applyUpdate(doc, update);
        }

        // Return encoded Yjs state
        return Y.encodeStateAsUpdate(doc);
    }

    public async save(id: DocumentID, doc: Y.Doc): Promise<void> {
        // For now, persist only the main content text as plain markdown.
        const content = doc.getText("content").toString();
        await this.dataStore.updateDocument(id, content);

        // Save other Yjs data (e.g. selection) via RawStorageProvider
        await this.rawProvider.save(id, doc);
    }
}
