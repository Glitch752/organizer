import { DocumentID } from "@shared/connection/Document";
import { DataStore } from "../DataStore";
import { RawStorageProvider } from "./RawStorageProvider";
import { YDoc } from "@shared/typedYjs";
import { WorkspaceSchema } from "@shared/connection/Workspace";

// TODO: Delete removed documents

//     async onStoreDocument(data) {
//         if(data.documentName === "global") {
//             const tree = new YTree(data.document.getMap("pages") as YMap<any>);
            
//             const nodes = new Set(tree.getAllNodes().map(n => `page:${n.id()}`));
//             const docs = new Set(
//                 (await sqlite.getDocumentNames())
//                     .filter(n => n.startsWith("page:"))
//             );
            
//             const deletedDocs = docs.difference(nodes);
//             if(deletedDocs.size === 0) {
//                 return;
//             }
            
//             console.log(`Cleaning up ${deletedDocs.size} deleted documents: ${[...deletedDocs].join(", ")}`);
            
//             for(const doc of deletedDocs) {
//                 hocuspocus.closeConnections(doc);
//                 hocuspocus.documents.delete(doc);
//             }
//             sqlite.removeDocument(Array.from(deletedDocs));
//         }
//     },


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