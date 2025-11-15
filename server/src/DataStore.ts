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

    // New: read the document content (returns null if it doesn't exist)
    public async readDocument(id: DocumentID): Promise<string | null> {
        const filePath = this.getDocumentPath(id);
        try {
            const data = await fs.promises.readFile(filePath, { encoding: "utf-8" });
            return data;
        } catch {
            return null;
        }
    }

    // New: JSON-based storage for arbitrary sub-paths (e.g. workspaces)
    private ensureSubdirExists(subdir: string) {
        const dir = path.join(this.basePath, subdir);
        fs.mkdirSync(dir, { recursive: true });
    }

    private getJsonFilePath(subdir: string, id: DocumentID): string {
        this.ensureSubdirExists(subdir);
        return path.join(this.basePath, subdir, `${id}.json`);
    }

    public async readJsonFile(subdir: string, id: DocumentID): Promise<any | null> {
        const filePath = this.getJsonFilePath(subdir, id);
        try {
            const data = await fs.promises.readFile(filePath, { encoding: "utf-8" });
            return JSON.parse(data);
        } catch {
            return null;
        }
    }

    public async updateJsonFile(subdir: string, id: DocumentID, data: any): Promise<void> {
        const filePath = this.getJsonFilePath(subdir, id);
        await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), { encoding: "utf-8" });
    }
}