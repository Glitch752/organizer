import { StorageProvider } from "./StorageProvider";
import { DocumentID, NoteSchema } from "@shared/connection/Document";
import { DataStore } from "../DataStore";
import * as Y from "yjs";
import { RawStorageProvider } from "./RawStorageProvider";
import { YDoc } from "@shared/typedYjs";

function stipPagePrefix(id: DocumentID): DocumentID {
    if(id.startsWith("page:")) {
        return id.slice(5) as DocumentID;
    }
    return id;
}

export class NoteStorageProvider implements StorageProvider {
    private cacheRawProvider: RawStorageProvider;

    constructor(private dataStore: DataStore) {
        this.cacheRawProvider = new RawStorageProvider(dataStore, ".pageCache", {
            "content": null,
            "selection": "map"
        });
    }

    public async load(id: DocumentID): Promise<Uint8Array | null> {
        // Load raw text from DataStore and return it encoded as a Yjs state update.
        const text = await this.dataStore.readDocument(stipPagePrefix(id));
        if(text === null) return null;

        const doc = new Y.Doc();
        // Set content text if it exists
        const ytext = doc.getText("content");
        if(text.length > 0) ytext.insert(0, text);

        const update = await this.cacheRawProvider.load(stipPagePrefix(id));
        if(update) {
            Y.applyUpdate(doc, update);
        }

        // Return encoded Yjs state
        return Y.encodeStateAsUpdate(doc);
    }

    public async save(id: DocumentID, doc: YDoc<NoteSchema>): Promise<void> {
        // For now, persist only the main content text as plain markdown.
        const content = doc.getText("content").toString();
        await this.dataStore.updateDocument(stipPagePrefix(id), content);

        // Save other Yjs data (e.g. selection) via RawStorageProvider
        await this.cacheRawProvider.save(stipPagePrefix(id), doc);
    }

    public createInitialDocument(id: DocumentID, doc: YDoc<NoteSchema>): void {
        doc.getText("content").insert(0, "initial page!");
        doc.getMap("selection").set("latestSelection", null);
        doc.getMap("selection").set("latestScrollPos", null);

        console.log(`Created initial document for note ${id}`);
    }
}
