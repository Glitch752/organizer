import { DocumentID } from "@shared/connection/Document";
import fs from "fs";
import path from "path";

/**
 * Handles data storage.  
 * Data is grouped into two types:
 * - Ephemeral data: data that we store to disk but CAN be recreated if lost, like cache data and mappings of IDs to file paths.
 * - Persistent data: user data and documents that can't be recreated.
 */
export class DataStore {
    constructor(private basePath: string) {
        // Make sure the relavent paths exist
        fs.mkdirSync(path.join(basePath, "documents"), { recursive: true });
    }

    private getDocumentPath(id: DocumentID): string {
        return path.join(this.basePath, "documents", `${id}.md`);
    }

    public async createDocument(id: DocumentID): Promise<boolean> {
        const filePath = this.getDocumentPath(id);
        try {
            await fs.promises.access(filePath); // Will throw if file doesn't exist
            return false;
        } catch {
            // Heck yeah. Exceptions as the normal flow of control.
            await fs.promises.writeFile(filePath, "", { flag: "wx" });
            return true;
        }
    }

    public async deleteDocument(id: DocumentID): Promise<boolean> {
        const filePath = this.getDocumentPath(id);
        try {
            await fs.promises.unlink(filePath);
            return true;
        } catch {
            return false;
        }
    }

    public async updateDocument(id: DocumentID, data: string): Promise<void> {
        const filePath = this.getDocumentPath(id);
        await fs.promises.writeFile(filePath, data, { encoding: "utf-8" });
    }
}