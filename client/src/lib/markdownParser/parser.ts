import { styleTags, type Tag, tags as t } from "@lezer/highlight";
import {
    type MarkdownConfig,
    Strikethrough,
    Subscript,
    Superscript,
    Table,
} from "@lezer/markdown";
import { markdown } from "@codemirror/lang-markdown";
import { foldNodeProp } from "@codemirror/language";
import * as ct from "./customTags";
import { TaskList } from "./extendedTask";
import { pWikiLinkRegex, tagRegex } from "./constants";
import { parse, type ParseTree } from "./parseTree";

const WikiLink: MarkdownConfig = {
    defineNodes: [
        { name: "WikiLink", style: ct.WikiLinkTag },
        { name: "WikiLinkPage", style: ct.WikiLinkPageTag },
        { name: "WikiLinkAlias", style: ct.WikiLinkPageTag },
        { name: "WikiLinkDimensions", style: ct.WikiLinkPageTag },
        { name: "WikiLinkMark", style: t.processingInstruction },
    ],
    parseInline: [
        {
            name: "WikiLink",
            parse(cx, next, pos) {
                let match: RegExpMatchArray | null;
                if (
                    next != 91 /* '[' */ &&
                    next != 33 /* '!' */ ||
                    !(match = pWikiLinkRegex.exec(cx.slice(pos, cx.end)))
                ) {
                    return -1;
                }
                
                const [fullMatch, firstMark, page, alias, _lastMark] = match;
                const endPos = pos + fullMatch.length;
                let aliasElts: any[] = [];
                if (alias) {
                    const pipeStartPos = pos + firstMark.length + page.length;
                    aliasElts = [
                        cx.elt("WikiLinkMark", pipeStartPos, pipeStartPos + 1),
                        cx.elt(
                            "WikiLinkAlias",
                            pipeStartPos + 1,
                            pipeStartPos + 1 + alias.length,
                        ),
                    ];
                }
                
                let allElts = cx.elt("WikiLink", pos, endPos, [
                    cx.elt("WikiLinkMark", pos, pos + firstMark.length),
                    cx.elt(
                        "WikiLinkPage",
                        pos + firstMark.length,
                        pos + firstMark.length + page.length,
                    ),
                    ...aliasElts,
                    cx.elt("WikiLinkMark", endPos - 2, endPos),
                ]);
                
                // Inline image
                if(next == 33) {
                    allElts = cx.elt("Image", pos, endPos, [allElts]);
                }
                
                return cx.addElement(allElts);
            },
            after: "Emphasis",
        },
    ],
};

const HighlightDelim = { resolve: "Highlight", mark: "HighlightMark" };

export const Highlight: MarkdownConfig = {
    defineNodes: [
        {
            name: "Highlight",
            style: { "Highlight/...": ct.Highlight },
        },
        {
            name: "HighlightMark",
            style: t.processingInstruction,
        },
    ],
    parseInline: [
        {
            name: "Highlight",
            parse(cx, next, pos) {
                if (next != 61 /* '=' */ || cx.char(pos + 1) != 61) return -1;
                return cx.addDelimiter(HighlightDelim, pos, pos + 2, true, true);
            },
            after: "Emphasis",
        },
    ],
};

type RegexParserExtension = {
    // unicode char code for efficiency .charCodeAt(0)
    firstCharCode: number;
    regex: RegExp;
    nodeType: string;
    tag: Tag;
    className?: string;
};

function regexParser({
    regex,
    firstCharCode,
    nodeType,
}: RegexParserExtension): MarkdownConfig {
    return {
        defineNodes: [nodeType],
        parseInline: [
            {
                name: nodeType,
                parse(cx, next, pos) {
                    if (firstCharCode !== next) {
                        return -1;
                    }
                    const match = regex.exec(cx.slice(pos, cx.end));
                    if (!match) {
                        return -1;
                    }
                    return cx.addElement(cx.elt(nodeType, pos, pos + match[0].length));
                },
            },
        ],
    };
}

const NakedURL = regexParser({
    firstCharCode: 104, // h
    regex:
    /(^https?:\/\/([-a-zA-Z0-9@:%_\+~#=]|(?:[.](?!(\s|$)))){1,256})(([-a-zA-Z0-9(@:%_\+~#?&=\/]|(?:[.,:;)](?!(\s|$))))*)/,
    nodeType: "NakedURL",
    className: "editor-naked-url",
    tag: ct.NakedURLTag,
});

const Hashtag = regexParser({
    firstCharCode: 35, // #
    regex: new RegExp(`^${tagRegex.source}`),
    nodeType: "Hashtag",
    className: "editor-hashtag-text",
    tag: ct.HashtagTag,
});

export const extendedMarkdownLanguage = markdown({
    extensions: [
        WikiLink,
        TaskList,
        Highlight,
        Strikethrough,
        Table,
        NakedURL,
        Hashtag,
        Superscript,
        Subscript,
        {
            props: [
                foldNodeProp.add({
                    // Don't fold at the list level
                    BulletList: () => null,
                    OrderedList: () => null,
                    // Fold list items
                    ListItem: (tree, state) => ({
                        from: state.doc.lineAt(tree.from).to,
                        to: tree.to,
                    })
                }),
                
                styleTags({
                    Task: ct.TaskTag,
                    TaskMark: ct.TaskMarkTag,
                    Comment: ct.CommentTag,
                    "Subscript": ct.SubscriptTag,
                    "Superscript": ct.SuperscriptTag,
                    "TableDelimiter StrikethroughMark": t.processingInstruction,
                    "TableHeader/...": t.heading,
                    TableCell: t.content,
                    CodeInfo: ct.CodeInfoTag,
                    HorizontalRule: ct.HorizontalRuleTag,
                    Hashtag: ct.HashtagTag,
                    NakedURL: ct.NakedURLTag,
                    DeadlineDate: ct.TaskDeadlineTag,
                    NamedAnchor: ct.NamedAnchorTag,
                }),
            ],
        },
    ],
}).language;

export function parseMarkdown(text: string): ParseTree {
    return parse(extendedMarkdownLanguage, text);
}