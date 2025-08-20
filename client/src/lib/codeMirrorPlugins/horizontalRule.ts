import type { Range, EditorState } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import { Decoration } from "@codemirror/view";
import {
    decoratorStateField,
    invisibleDecoration,
    isCursorInRange,
} from "./util";

export function horizontalRulePlugin() {
    return decoratorStateField(
        (state: EditorState) => {
            const widgets: Range<Decoration>[] = [];
            
            syntaxTree(state).iterate({
                enter(node) {
                    if (
                        node.name === "HorizontalRule" &&
                        !isCursorInRange(state, [node.from, node.to])
                    ) {
                        widgets.push(
                            Decoration.line({
                                class: "editor-line-hr",
                            }).range(node.from),
                        );
                    }
                },
            });
            return Decoration.set(widgets, true);
        },
    );
}