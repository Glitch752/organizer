import type { Range, EditorState } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import { Decoration } from "@codemirror/view";
import {
    decoratorStateField,
    isCursorInRange
} from "./util";

export function fencedCodePlugin() {
    return decoratorStateField((state: EditorState) => {
        const widgets: Range<Decoration>[] = [];
        syntaxTree(state).iterate({
            enter({ from, to, name, node }) {
                if(name === "FencedCode") {
                    if(isCursorInRange(state, [from, to])) {
                        // Don't render the widget if the cursor is inside the fenced code
                        return;
                    }

                    // TODO: SB custom widgets
                    // const text = state.sliceDoc(from, to);
                    // const [_, lang] = text.match(/^(?:```+|~~~+)(\w+)?/)!;
                    // const codeWidgetCallback = client.clientSystem.codeWidgetHook
                    //     .codeWidgetCallbacks
                    //     .get(lang);
                    // if(codeWidgetCallback) {
                    //     // We got a custom renderer!
                    //     const lineStrings = text.split("\n");
                        
                    //     const lines: { from: number; to: number }[] = [];
                    //     let fromIt = from;
                    //     for(const line of lineStrings) {
                    //         lines.push({
                    //             from: fromIt,
                    //             to: fromIt + line.length,
                    //         });
                    //         fromIt += line.length + 1;
                    //     }
                        
                    //     const firstLine = lines[0], lastLine = lines[lines.length - 1];
                        
                    //     // In case of doubt, back out
                    //     if (!firstLine || !lastLine) return;
                        
                    //     widgets.push(
                    //         invisibleDecoration.range(firstLine.from, firstLine.to),
                    //     );
                    //     widgets.push(
                    //         invisibleDecoration.range(lastLine.from, lastLine.to),
                    //     );
                    //     widgets.push(
                    //         Decoration.line({
                    //             class: "editor-fenced-code-iframe",
                    //         }).range(firstLine.from),
                    //     );
                    //     widgets.push(
                    //         Decoration.line({
                    //             class: "editor-fenced-code-hide",
                    //         }).range(lastLine.from),
                    //     );
                        
                    //     lines.slice(1, lines.length - 1).forEach((line) => {
                    //         widgets.push(
                    //             Decoration.line({ class: "editor-line-table-outside" }).range(
                    //                 line.from,
                    //             ),
                    //         );
                    //     });
                        
                    //     const widget = new IFrameWidget(
                    //         from + lineStrings[0].length + 1,
                    //         to - lineStrings[lineStrings.length - 1].length - 1,
                    //         client,
                    //         lineStrings.slice(1, lineStrings.length - 1).join("\n"),
                    //         codeWidgetCallback,
                    //     );
                    //     widgets.push(
                    //         Decoration.widget({
                    //             widget: widget,
                    //         }).range(from),
                    //     );
                    //     return false;
                    // }

                    return true;
                }

                if(name === "CodeMark") {
                    const parent = node.parent!;
                    // Hide only if CodeMark is not inside backticks (InlineCode) and the cursor is placed outside
                    if(parent.node.name !== "InlineCode" && !isCursorInRange(state, [parent.from, parent.to])) {
                        widgets.push(
                            Decoration.line({
                                class: "editor-line-code-outside",
                            }).range(state.doc.lineAt(from).from),
                        );
                    }
                }
            },
        });
        return Decoration.set(widgets, true);
    });
}