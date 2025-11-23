import { DocumentID } from "@shared/connection/Document";
import { DataStore } from "../DataStore";
import { RawStorageProvider } from "./RawStorageProvider";
import { YDoc } from "@shared/typedYjs";
import { WorkspaceSchema } from "@shared/connection/Workspace";

export class WorkspaceStorageProvider extends RawStorageProvider {
    constructor(dataStore: DataStore) {
        super(dataStore, "workspaces", {
            "pages": "map",
            "attributes": "map"
        });
    }

    public createInitialDocument(id: DocumentID, doc: YDoc<WorkspaceSchema>): void {
        // We don't need to set anything here yet
    }
}