// Forked from https://codeberg.org/retronav/ixora
// Original author: Pranav Karawale
// License: Apache License 2.0.

import type { Range, EditorState } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import { Decoration } from "@codemirror/view";
import {
    checkRangeOverlap,
    decoratorStateField,
    invisibleDecoration,
    isCursorInRange,
} from "./util";

/**
* These types contain markers as child elements that can be hidden.
*/
const typesWithMarks = [
    "Emphasis",
    "StrongEmphasis",
    "InlineCode",
    "Highlight",
    "Strikethrough",
    "Superscript",
    "Subscript",
];
/**
* The elements which are used as marks.
*/
const markTypes = [
    "EmphasisMark",
    "CodeMark",
    "HighlightMark",
    "StrikethroughMark",
    "SuperscriptMark",
    "SubscriptMark",
];

export function hideMarksPlugin() {
    return decoratorStateField((state: EditorState) => {
        const widgets: Range<Decoration>[] = [];
        let parentRange: [number, number];
        syntaxTree(state).iterate({
            enter: ({ type, from, to, node }) => {
                if(typesWithMarks.includes(type.name)) {
                    // The current node might be a child, like
                    // a bold node in a emphasis node, so check
                    // for that or else save the node range
                    if(
                        parentRange &&
                        checkRangeOverlap([from, to], parentRange)
                    ) {
                        return;
                    } else parentRange = [from, to];
                    if(isCursorInRange(state, [from, to])) return;
                    
                    const innerTree = node.toTree();
                    innerTree.iterate({
                        enter({ type, from: markFrom, to: markTo }) {
                            // Check for mark types and push the replace
                            // decoration
                            if(!markTypes.includes(type.name)) return;
                            widgets.push(
                                invisibleDecoration.range(
                                    from + markFrom,
                                    from + markTo,
                                ),
                            );
                        },
                    });
                }
            },
        });
        return Decoration.set(widgets, true);
    });
}

export function hideHeaderMarkPlugin() {
    return decoratorStateField((state) => {
        const widgets: Range<Decoration>[] = [];
        syntaxTree(state).iterate({
            enter: ({ type, from, to }) => {
                if(!type.name.startsWith("ATXHeading")) {
                    return;
                }

                // Get the active line
                const line = state.sliceDoc(from, to);
                if(line === "#") {
                    // Empty headers shouldn't be adjusted
                    return;
                }

                if(isCursorInRange(state, [from, to])) {
                    widgets.push(Decoration.line({ class: "editor-header-inside" }).range(from));
                    return;
                }
                
                const spacePos = line.indexOf(" ");
                // Incomplete header
                if(spacePos === -1) {
                    return;
                }

                widgets.push(invisibleDecoration.range(
                    from,
                    from + spacePos + 1,
                ));
            },
        });
        return Decoration.set(widgets, true);
    });
}