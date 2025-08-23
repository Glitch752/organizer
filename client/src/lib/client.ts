import { getDocument, type DocSubscription } from "../stores/sync";
import * as Y from "yjs";
import { LimitedMap } from "./util/LimitedMap";
import { debounce } from "./util/time";
import type { EditorView } from "codemirror";
import { SelectionCRDT } from "./selection";
import { YTree, type TreeJsonStructure } from "./ytree";
import { writable } from "svelte/store";

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

type EditorInfo = {
    id: string,
    sub: DocSubscription,
    text: Y.Text,
    selection: SelectionCRDT,
    undoManager: Y.UndoManager,
    editorView: EditorView | null
};

type PageMeta = {
    name: string
};
export type PageType = TreeJsonStructure<PageMeta>;

export class Client {
    activePage: EditorInfo | null;
    sessionColor: UserColor;

    private workspaceDocument = getDocument("global");
    public pageTree = new YTree<PageMeta>(this.workspaceDocument.doc.getMap("pages"));
    public pagesRoot = this.pageTree.root();
    
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
     * Attributes are additional data added to a page used to connect organization systems.  
     * For example, an attribute could be machine-generated like backlinks, or it could be manually
     * input like a calendar item associated with this page.
     */
    get attributes(): Y.Map<any> | null {
        return this.activePage ? this.activePage.sub.doc.getMap("attributes") : null;
    }
    /**
     * Returns the metadata map of the active page.
     * Metadata is data about the page itself, like its title or creation date.  
     * This data is stored separately from the page content to allow for faster searching and indexing.
     */
    get metadata(): Y.Map<any> | null {
        return this.pageTree.getNode(this.activePage?.id)?.map ?? null;
    }

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
        return this.activePage;
    }

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