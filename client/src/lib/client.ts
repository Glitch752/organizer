import * as Y from "yjs";
import { LimitedMap } from "./util/LimitedMap";
import { debounce } from "./util/time";
import type { EditorView } from "codemirror";
import { SelectionCRDT } from "./selection";
import { YTree, type TreeJsonStructure } from "../../../shared/ytree";
import { writable, type Writable } from "svelte/store";
import type { YArray, YMap } from "../../../shared/typedYjs";
import type { Attribute } from "./attributes";
import { v4 as uuidv4 } from "uuid";
import { route } from "../stores/router";
import { isMobile } from "./util/device.svelte";
import type { SyncedDocument } from "../connection/document";
import { getSyncedDocument } from "../connection";
import type { WorkspaceSchema } from "@shared/connection/Workspace";

type UserColor = {
    color: string,
    light: string
};
const userColors: UserColor[] = [
    { color: '#30bced', light: '#30bced33' },
    { color: '#6eeb83', light: '#6eeb8333' },
    { color: '#ffbc42', light: '#ffbc4233' },
    { color: '#ecd444', light: '#ecd44433' },
    { color: '#ee6352', light: '#ee635233' },
    { color: '#9ac2c9', light: '#9ac2c933' },
    { color: '#8acb88', light: '#8acb8833' },
    { color: '#1be7ff', light: '#1be7ff33' }
];

export type EditorInfo = {
    id: string,
    sub: SyncedDocument<any>,
    text: Y.Text,
    selection: SelectionCRDT,
    undoManager: Y.UndoManager,
    editorView: EditorView | null
};

export type PageMeta = {
    name: string,
    collapsed?: boolean
};
export type PageType = TreeJsonStructure<PageMeta>;

export class Client {
    activePage: EditorInfo | null;
    sessionColor: UserColor;

    public workspaceLoaded = false;
    private workspaceLoadCallbacks: (() => void)[] = [];
    public onWorkspaceLoaded(cb: () => void) {
        if(this.workspaceLoaded) cb();
        else this.workspaceLoadCallbacks.push(cb);
    }
    public async waitForWorkspaceLoad() {
        if(this.workspaceLoaded) return;
        return new Promise<void>(resolve => {
            this.onWorkspaceLoaded(() => resolve());
        });
    }

    private workspaceDocument = getSyncedDocument<WorkspaceSchema>("global", () => {
        this.resubscribeMeta();
        this.workspaceLoaded = true;
        for(const cb of this.workspaceLoadCallbacks) cb();
        this.workspaceLoadCallbacks = [];
    });

    public pageTree = new YTree<PageMeta>(this.workspaceDocument.doc.getMap("pages"));

    private attributesMap = this.workspaceDocument.doc.getMap("attributes") as YMap<{
        [key: string]: YArray<Attribute[]>
    }>;
    
    public immutablePageTreeView = writable(this.pageTree.toJsonStructure());

    constructor() {
        this.sessionColor = userColors[Math.floor(Math.random() * userColors.length)];
        this.activePage = null;
        
        this.pageTree.setOnChange(() => {
            this.immutablePageTreeView.set(this.pageTree.toJsonStructure());
        });
    }

    /**
     * Returns a map of the active page's attributes.
     * Attributes are additional data linked to pages used to connect organization systems.  
     * For example, an attribute could be machine-generated like backlinks, or it could be manually
     * input like a calendar item associated with this page.
     */
    get attributes(): YArray<Attribute> | null {
        if(!this.activePage?.id) return null;
        if(!this.workspaceLoaded) return null;
        
        if(!this.attributesMap.has(this.activePage.id)) {
            this.attributesMap.set(this.activePage.id, new Y.Array<Attribute>() as YArray<Attribute>);
        }

        return this.attributesMap.get(this.activePage?.id)!;
    }
    /**
     * Returns the metadata map of the active page.
     * Metadata is data about the page itself, like its title or creation date.  
     * This data is stored separately from the page content to allow for faster searching and indexing.
     */
    get metadata(): YMap<any> | null {
        return this.pageTree.getNode(this.activePage?.id)?.map ?? null;
    }

    private metadataStores = new Map<string, {
        writable: Writable<any>,
        resubscribe: () => void
    }>();

    /**
     * Gets a Svelte writable for a metadata item of the active page.
     * The store will update when the metadata changes, and all stores will be updated to reflect
     * the active page.
     */
    private writableMetadataItem<T>(key: keyof PageMeta): Writable<T | undefined> | null {
        if(this.metadataStores.has(key)) {
            return this.metadataStores.get(key)?.writable as Writable<T>;
        }

        const meta = this.metadata;
        
        const store = writable<T | undefined>(meta?.get(key) as T | undefined);
        
        // Keep references so we can unsubscribe when resubscribing
        let currentMeta: YMap<any> | null = this.metadata;
        let currentPageId: string | null = this.activePage?.id ?? null;

        // Unsubscription function for the meta map
        let metaObserver: ((event: Y.YMapEvent<T>, transaction: Y.Transaction) => void) | null = null;
        // Unsubscription function for the store
        let storeUnsub: (() => void) | null = null;
        let suppressLocal = false;
        // Technically could lead to race conditions, but very unlikely in practice
        const stopSuppressLocal = debounce(() => suppressLocal = false, 10);

        const resubscribe = () => {
            // Clean up previous observers
            try {
                if(metaObserver && currentMeta) {
                    currentMeta.unobserve(metaObserver);
                    metaObserver = null;
                }
                if(storeUnsub) {
                    storeUnsub();
                    storeUnsub = null;
                }
            } catch {}

            // Update references to the currently active page/meta
            currentMeta = this.metadata;
            currentPageId = this.activePage?.id ?? null;

            if(!currentMeta || currentPageId === null) {
                // No active page; clear store
                store.set(undefined);
                return;
            }

            // Initialize store value from current meta
            store.set(currentMeta.get(key) as T);

            // Yjs changes to local store
            metaObserver = (event: any) => {
                if(!currentMeta) return;
                if(this.activePage?.id === currentPageId && this.metadata === currentMeta && event.keysChanged && event.keysChanged.has(key)) {
                    suppressLocal = true;
                    store.set(currentMeta.get(key) as T);
                    stopSuppressLocal();
                }
            };
            currentMeta.observe(metaObserver);
            
            // Local store changes back to Yjs
            storeUnsub = store.subscribe(value => {
                if(!currentMeta || suppressLocal) return;
                if(this.activePage?.id === currentPageId && this.metadata === currentMeta) {
                    currentMeta.set(key, value);
                }
            });
        };
        resubscribe();

        this.metadataStores.set(key, {
            writable: store,
            resubscribe
        });
        return store;
    }

    public title = this.writableMetadataItem<string>("name");

    public loadPage(id: string, onLoad?: (() => void)): EditorInfo {
        if(this.activePage !== null) {
            this.activePage.sub.disconnect();
            this.activePage.undoManager.destroy();

            this.activePage = null;
        }

        const doc = getDocument(`doc:${id}`, onLoad);
        const yText = doc.doc.getText("content");
        const undoManager = new Y.UndoManager(yText);

        doc.awareness.setLocalStateField("user", {
            name: 'user' + Math.floor(Math.random() * 100),
            color: this.sessionColor.color,
            colorLight: this.sessionColor.light
        });

        this.activePage = {
            id,
            sub: doc,
            text: yText,
            selection: new SelectionCRDT(doc.doc.getMap("selection")),
            undoManager,
            editorView: null
        };

        this.resubscribeMeta();
        
        return this.activePage;
    }

    public createPage(path: { siblingId: string } | { parentId: string } | null) {
        if(!this.workspaceLoaded) throw new Error("Workspace not loaded");

        const id = uuidv4();
        
        let parentNode;
        if(!path) parentNode = this.pageTree.root();
        else if("siblingId" in path) parentNode = this.pageTree.getNode(path.siblingId)?.parent();
        else if("parentId" in path) parentNode = this.pageTree.getNode(path.parentId);
        
        if(!parentNode) throw new Error("Parent node not found");

        const node = parentNode.addChild(id, {
            name: "Untitled",
            collapsed: false
        });

        route.navigate(`/page/${id}`);
    }

    public deletePage(id: string) {
        if(!this.workspaceLoaded) throw new Error("Workspace not loaded");

        const node = this.pageTree.getNode(id);
        if(!node) throw new Error("Node not found");
        
        // Move to parent or root
        const parent = node.parent();
        if(parent) {
            route.navigate(`/page/${parent.id()}`);
        } else {
            route.navigate(`/`);
        }
        
        node.remove();
    }

    public openPage(id: string) {
        route.navigate(`/page/${id}`);
        if(isMobile()) {
            document.dispatchEvent(new CustomEvent("nav-close"));
        }
    }

    public renamePage(id: string, newName: string) {
        if(!this.workspaceLoaded) throw new Error("Workspace not loaded");
        
        const node = this.pageTree.getNode(id);
        if(!node) throw new Error("Node not found");
        
        const meta = node.map;
        meta.set("name", newName);
    }

    public toggleCollapse(id: string) {
        if(!this.workspaceLoaded) throw new Error("Workspace not loaded");
        const node = this.pageTree.getNode(id);
        if(!node) throw new Error("Node not found");
        
        const meta = node.map;
        meta.set("collapsed", !meta.get("collapsed"));
    }

    private resubscribeMeta() {
        for(const { resubscribe } of this.metadataStores.values()) resubscribe();
    }

    public getAllAttributes(): {
        pageId: string,
        attributes: Attribute[]
    }[] {
        if(!this.workspaceLoaded) return [];
        const result: {
            pageId: string,
            attributes: Attribute[]
        }[] = [];
        this.attributesMap.forEach((attrs, pageId) => {
            result.push({
                pageId,
                attributes: attrs.toArray()
            });
        });
        return result;
    }

    public attributesFor(pageId: string): YArray<Attribute> | null {
        if(!this.workspaceLoaded) return null;
        if(!this.attributesMap.has(pageId)) {
            this.attributesMap.set(pageId, new Y.Array<Attribute>() as YArray<Attribute>);
        }
        return this.attributesMap.get(pageId)!;
    }
    public async listenToAttributeChanges(f: () => void): Promise<() => void> {
        if(!this.workspaceLoaded) await this.waitForWorkspaceLoad();
        
        const observer = () => f();
        this.attributesMap.observeDeep(observer);
        return () => {
            this.attributesMap.unobserveDeep(observer);
        };
    };

    private widgetHeightCache = new LimitedMap<number>(JSON.parse(localStorage.getItem("widgetHeightCache") ?? "{}"));
    debouncedWidgetHeightCacheFlush = debounce(() => {
        localStorage.setItem("widgetHeightCache", JSON.stringify(this.widgetHeightCache.toJSON()))
    }, 2000);

    setCachedWidgetHeight(bodyText: string, height: number) {
        this.widgetHeightCache.set(bodyText, height);
        this.debouncedWidgetHeightCacheFlush();
    }

    getCachedWidgetHeight(bodyText: string): number {
        return this.widgetHeightCache.get(bodyText) ?? -1;
    }
}

export let client = new Client();