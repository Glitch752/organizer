// Forked from https://codeberg.org/retronav/ixora
// Original author: Pranav Karawale
// License: Apache License 2.0.

import type { Range } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import { Decoration, WidgetType } from "@codemirror/view";
import { decoratorStateField, isCursorInRange } from "./util";

const bulletListMarkerRE = /^[-+*]/;

export function listBulletPlugin() {
    return decoratorStateField((state) => {
        const widgets: Range<Decoration>[] = [];
        syntaxTree(state).iterate({
            enter: ({ type, from, to }) => {
                if(type.name === "ListMark") {
                    if(isCursorInRange(state, [from, to])) {
                        // Cursor is in the list mark; render normally
                        widgets.push(
                            Decoration.mark({
                                class: "editor-li-cursor",
                            }).range(from, to),
                        );
                    } else {
                        // Cursor is outside the list mark, render as a bullet
                        const listMark = state.sliceDoc(from, to);
                        if(bulletListMarkerRE.test(listMark)) {
                            const dec = Decoration.replace({
                                widget: new ListBulletWidget(listMark),
                            });
                            widgets.push(dec.range(from, to));
                        } else {
                            // Ordered list; just add a class
                            widgets.push(
                                Decoration.mark({
                                    class: "editor-ol",
                                }).range(from, to),
                            );
                        }
                    }
                }
            },
        });
        return Decoration.set(widgets, true);
    });
}

/**
 * Widget to render list bullet mark.
 */
class ListBulletWidget extends WidgetType {
    constructor(readonly bullet: string) {
        super();
    }
    
    toDOM(): HTMLElement {
        const listBullet = document.createElement("span");
        listBullet.textContent = this.bullet;
        listBullet.className = "cm-list-bullet";
        return listBullet;
    }
}