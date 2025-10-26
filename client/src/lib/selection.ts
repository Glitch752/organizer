import { EditorSelection, StateEffect } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import * as Y from "yjs";
import { debounce } from "./util/time";
import type { ScrollTargetInfo, SelectionCRDTSchema } from "@shared/connection/Document";

export class SelectionCRDT {
    latestSelection: any;
    latestScrollSnapshot: ScrollTargetInfo = { cursorPos: 0, y: 0, x: 0 };

    constructor(private map: SelectionCRDTSchema) {
    }

    get selection(): EditorSelection {
        const sel = this.map.get("latestSelection");
        if(sel == null || typeof sel !== "object") {
            return EditorSelection.single(0);
        }
        return EditorSelection.fromJSON(sel);
    }

    selectionDebounce = debounce(() => {
        this.map.set("latestSelection", this.latestSelection);
    }, 250);

    set selection(sel: EditorSelection) {
        this.latestSelection = sel.toJSON();
        this.selectionDebounce();
    }


    scrollEffect(editor: EditorView): StateEffect<any> {
        const snapshot = this.map.get("latestScrollPos");
        if(!snapshot || typeof snapshot !== "object") {
            return new StateEffect();
        }

        // HACK
        const { cursorPos, y, x } = snapshot;
        const dummySnapshot = editor.scrollSnapshot();
        // @ts-ignore The less you think about it, the better.
        dummySnapshot.value.range = EditorSelection.cursor(cursorPos);
        // @ts-ignore
        dummySnapshot.value.yMargin = y;
        // @ts-ignore
        dummySnapshot.value.xMargin = x;

        return dummySnapshot;
    }

    scrollPosDebounce = debounce(() => {
        this.map.set("latestScrollPos", this.latestScrollSnapshot);
    }, 250);

    updateScrollPos(editor: EditorView) {
        // HACK wtf am I doing anymore
        const { scrollTop, scrollLeft } = editor.scrollDOM;
        const ref: any = (editor as any)["viewState"].scrollAnchorAt(scrollTop)

        let targetInfo: ScrollTargetInfo = {
            cursorPos: ref.from,
            y: ref.top - scrollTop,
            x: scrollLeft
        };

        this.latestScrollSnapshot = targetInfo;
        this.scrollPosDebounce();
    }
}