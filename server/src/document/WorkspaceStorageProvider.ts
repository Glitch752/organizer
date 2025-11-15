import { DataStore } from "../DataStore";
import { RawStorageProvider } from "./RawStorageProvider";

export class WorkspaceStorageProvider extends RawStorageProvider {
    constructor(dataStore: DataStore) {
        super(dataStore, "workspaces", {
            "pages": "map",
            "attributes": "map"
        });
    }
}