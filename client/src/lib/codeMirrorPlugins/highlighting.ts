import { HighlightStyle, syntaxTree } from "@codemirror/language";
import { tagHighlighter, tags as t } from "@lezer/highlight";
import * as ct from "../markdown/customTags";
import { decoratorStateField } from "./util";
import type { Range, EditorState } from "@codemirror/state";
import { Decoration } from "@codemirror/view";

export function customMarkdownStyle() {
    tagHighlighter; // ??
    return HighlightStyle.define([
        { tag: t.heading1, class: "editor-h1" },
        { tag: t.heading2, class: "editor-h2" },
        { tag: t.heading3, class: "editor-h3" },
        { tag: t.link, class: "editor-link" },
        { tag: t.meta, class: "editor-meta" },
        { tag: t.quote, class: "editor-quote" },
        { tag: t.monospace, class: "editor-code" },
        { tag: t.url, class: "editor-url" },
        { tag: ct.WikiLinkTag, class: "editor-wiki-link" },
        { tag: ct.WikiLinkPageTag, class: "editor-wiki-link-page" },
        { tag: ct.TaskTag, class: "editor-task" },
        { tag: ct.TaskMarkTag, class: "editor-task-mark" },
        { tag: ct.TaskStateTag, class: "editor-task-state" },
        { tag: ct.CodeInfoTag, class: "editor-code-info" },
        { tag: ct.CommentTag, class: "editor-comment" },
        { tag: ct.CommentMarkerTag, class: "editor-comment-marker" },
        { tag: ct.Highlight, class: "editor-highlight" },
        { tag: t.emphasis, class: "editor-emphasis" },
        { tag: t.strong, class: "editor-strong" },
        { tag: t.atom, class: "editor-atom" },
        { tag: t.bool, class: "editor-bool" },
        { tag: t.url, class: "editor-url" },
        { tag: t.inserted, class: "editor-inserted" },
        { tag: t.deleted, class: "editor-deleted" },
        { tag: t.literal, class: "editor-literal" },
        { tag: t.keyword, class: "editor-keyword" },
        { tag: t.list, class: "editor-list" },
        { tag: t.operator, class: "editor-operator" },
        { tag: t.regexp, class: "editor-string" },
        { tag: t.string, class: "editor-string" },
        { tag: t.number, class: "editor-number" },
        { tag: [t.regexp, t.escape, t.special(t.string)], class: "editor-escapedOrString" },
        { tag: t.variableName, class: "editor-variableName" },
        { tag: t.typeName, class: "editor-typeName" },
        { tag: t.strikethrough, class: "editor-strikethrough" },
        { tag: t.comment, class: "editor-comment" },
        { tag: t.invalid, class: "editor-invalid" },
        { tag: t.processingInstruction, class: "editor-meta" },
        { tag: t.punctuation, class: "editor-punctuation" },
        { tag: ct.HorizontalRuleTag, class: "editor-hr" },
        { tag: ct.NakedURLTag, class: "editor-naked-url" },
        { tag: ct.TaskDeadlineTag, class: "editor-task-deadline" },
        { tag: ct.SubscriptTag, class: "editor-sub" },
        { tag: ct.SuperscriptTag, class: "editor-sup" }
    ]);
}


interface WrapElement {
    selector: string;
    class: string;
    nesting?: boolean;
}

function wrapLinesDecarator(wrapElements: WrapElement[]) {
    return decoratorStateField((state: EditorState) => {
        const widgets: Range<Decoration>[] = [];
        const elementStack: string[] = [];
        const doc = state.doc;
        syntaxTree(state).iterate({
            enter: ({ type, from, to }) => {
                for (const wrapElement of wrapElements) {
                    if (type.name == wrapElement.selector) {
                        if (wrapElement.nesting) {
                            elementStack.push(type.name);
                        }
                        const bodyText = doc.sliceString(from, to);
                        let idx = from;
                        for (const line of bodyText.split("\n")) {
                            let cls = wrapElement.class;
                            if (wrapElement.nesting) {
                                cls = `${cls} ${cls}-${elementStack.length}`;
                            }
                            widgets.push(
                                Decoration.line({
                                    class: cls,
                                }).range(doc.lineAt(idx).from),
                            );
                            idx += line.length + 1;
                        }
                    }
                }
            },
            leave({ type }) {
                for (const wrapElement of wrapElements) {
                    if (type.name == wrapElement.selector && wrapElement.nesting) {
                        elementStack.pop();
                    }
                }
            },
        });
        
        return Decoration.set(widgets, true);
    });
}

export function lineWrapper() {
    return wrapLinesDecarator([
        { selector: "ATXHeading1", class: "editor-line-h1" },
        { selector: "ATXHeading2", class: "editor-line-h2" },
        { selector: "ATXHeading3", class: "editor-line-h3" },
        { selector: "ATXHeading4", class: "editor-line-h4" },
        { selector: "ATXHeading5", class: "editor-line-h5" },
        { selector: "ATXHeading6", class: "editor-line-h6" },
        { selector: "ListItem", class: "editor-line-li", nesting: true },
        { selector: "Blockquote", class: "editor-line-blockquote" },
        { selector: "Task", class: "editor-line-task" },
        { selector: "CodeBlock", class: "editor-line-code" },
        { selector: "FencedCode", class: "editor-line-fenced-code" },
        { selector: "Comment", class: "editor-line-comment" },
        { selector: "BulletList", class: "editor-line-ul" },
        { selector: "OrderedList", class: "editor-line-ol" },
        { selector: "TableHeader", class: "editor-line-tbl-header" },
        {
            selector: "FrontMatter",
            class: "editor-frontmatter",
        }
    ]);
}