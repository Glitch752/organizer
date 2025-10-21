import type { Client, PageMeta } from "../client";
import JSZip from "jszip";
import { type YTreeNode } from "../../../../shared/ytree";
import { type DocSubscription } from "../../connection";
import { getDocument } from "../../connection/document";

async function addPages(zip: JSZip, node: YTreeNode<PageMeta>, client: Client) {
    const doc = await new Promise<DocSubscription>((resolve) => {
        const val = getDocument(`doc:${node.id()}`, () => {
            resolve(val);
        });
    });

    const pageName = node.get("name") ?? "untitled";
    const info = {
        id: node.id(),
        name: pageName,
        attributes: client.attributesFor(node.id())?.toJSON()
    };
    zip.file(pageName + ".json", JSON.stringify(info, null, 2), { binary: false });
    zip.file(pageName + ".md", doc.doc.getText("content").toString() || "", { binary: false });

    doc.disconnect();

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