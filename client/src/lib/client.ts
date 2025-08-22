import { getDocument, type DocSubscription } from "../stores/sync";
import * as Y from "yjs";
import { LimitedMap } from "./util/LimitedMap";
import { debounce } from "./util/time";
import type { EditorView } from "codemirror";
import { SelectionCRDT } from "./selection";

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
    sub: DocSubscription,
    text: Y.Text,
    selection: SelectionCRDT,
    undoManager: Y.UndoManager,
    editorView: EditorView | null
};

export class Client {
    activePage: EditorInfo | null;
    sessionColor: UserColor;

    constructor() {
        this.sessionColor = userColors[Math.floor(Math.random() * userColors.length)];
        this.activePage = null;
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