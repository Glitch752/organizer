import type { Client } from "../client";
import JSZip from "jszip";
import { type YTreeNode } from "../../../../shared/ytree";
import type { PageMeta } from "@shared/connection/Workspace";
import { getSyncedDocumentAsync } from "../../connection";
import type { NoteSchema } from "@shared/connection/Document";

function escapeName(name: string) {
    return name.replace(/[/\\?%*:|"<>]/g, "-").trim();
}

type BackupInfo = {
    id: string;
    name: string;
    attributes?: Record<string, any>;
}

async function addPages(zip: JSZip, node: YTreeNode<PageMeta>, client: Client) {
    const doc = await getSyncedDocumentAsync<NoteSchema>(`page:${node.id()}`);

    const pageName = escapeName(node.get("name") ?? "untitled");
    const info: BackupInfo = {
        id: node.id(),
        name: pageName,
        attributes: client.attributesFor(node.id())?.toJSON()
    };
    zip.file(pageName + ".json", JSON.stringify(info, null, 2), { binary: false });
    zip.file(pageName + ".md", doc.doc.getText("content").toString() || "", { binary: false });

    doc.release();

    // TODO: Attributes and other data

    for(const child of node.children()) {
        await addPages(zip.folder(node.get("name") ?? "")!, child, client);
    }
}

export async function backUpWorkspace(client: Client) {
    const root = client.pageTree.root();
    const zip = new JSZip();

    for(const child of root.children()) {
        await addPages(zip, child, client);
    }

    console.log("Generating backup zip...");

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);

    console.log("Downloading backup...");

    const a = document.createElement("a");
    a.href = url;
    a.download = "workspace-backup.zip";
    a.style.display = "none";
    document.body.appendChild(a);

    // For Firefox, trigger click after appending to DOM
    a.dispatchEvent(new MouseEvent("click"));

    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

export async function importBackup(client: Client) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".zip";
    input.style.display = "none";
    document.body.appendChild(input);
    
    input.addEventListener("change", async () => {
        if(!input.files || input.files.length === 0) {
            document.body.removeChild(input);
            return;
        }
        
        const file = input.files[0];
        const zip = await JSZip.loadAsync(file);
        
        // walk through the zip file and import pages
        const pageFiles: { info: BackupInfo, content: string, fullPath: string }[] = [];

        await Promise.all(Object.values(zip.files).map(async (file) => {
            if(file.dir) return; // Skip directories here

            if(file.name.endsWith(".json")) {
                const baseName = file.name.slice(0, -5); // Remove .json
                const mdFile = zip.file(baseName + ".md");
                if(!mdFile) {
                    console.warn(`Markdown file for ${file.name} not found, skipping.`);
                    return;
                }

                const infoStr = await file.async("string");
                const contentStr = await mdFile.async("string");

                const info = JSON.parse(infoStr) as BackupInfo;
                pageFiles.push({ info, content: contentStr, fullPath: file.name });
            }
        }));

        // Sort by the number of path segments to ensure parents are created before children
        pageFiles.sort((a, b) => {
            const aSegments = a.fullPath.split("/").length;
            const bSegments = b.fullPath.split("/").length;
            return aSegments - bSegments;
        });

        // Now, create pages in the client
        for(const { info, content, fullPath } of pageFiles) {
            let parentId: string | null = null;
            const pathParts = fullPath.split("/");
            if(pathParts.length > 1) {
                // Find parent by reconstructing the path
                pathParts.pop();
                const parentPath = pathParts.join("/");
                const parentFile = pageFiles.find(pf => pf.fullPath === parentPath + ".json");
                if(parentFile) {
                    parentId = parentFile.info.id;
                } else {
                    console.warn(`Parent page for ${info.name} not found, importing as root page.`);
                }
            }
            
            await client.importPage(info.id, info.name, content, info.attributes, parentId);
            console.log(`Imported page ${info.name} (${info.id}) under parent ${parentId}`);
        }
        
        document.body.removeChild(input);
    });
    
    input.dispatchEvent(new MouseEvent("click"));
}