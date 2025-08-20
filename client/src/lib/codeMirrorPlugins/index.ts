import { markdown } from "@codemirror/lang-markdown";
import { extendedMarkdownLanguage } from "../markdownParser/parser";
import { autoCompletion } from "./autocompletion";
import { disableSpellcheck } from "./spellcheck";
import { LanguageDescription, LanguageSupport, syntaxHighlighting } from "@codemirror/language";
import { customMarkdownStyle, lineWrapper } from "./highlighting";
import { languageFor } from "../languages";
import type { Extension } from "@codemirror/state";
import { listBulletPlugin } from "./listBullet";
import { admonitionPlugin } from "./admonition";
import { blockquotePlugin } from "./blockquote";
import { horizontalRulePlugin } from "./horizontalRule";
import { cleanEscapePlugin } from "./escape";
import { fencedCodePlugin } from "./fencedCode";
import { hideHeaderMarkPlugin, hideMarksPlugin } from "./hideMark";

export function customPlugins(): Extension[] {
    return [
        autoCompletion(),

        extendedMarkdownLanguage.data.of({
            closeBrackets: {
                brackets: "{[("
            },
        }),
        
        disableSpellcheck(["InlineCode", "CodeText", "CodeInfo"]),
        
        markdown({
            base: extendedMarkdownLanguage,
            codeLanguages: (info) => {
                const lang = languageFor(info);
                if(lang) return LanguageDescription.of({
                    name: info,
                    support: new LanguageSupport(lang)
                });

                return null;
            },
            addKeymap: true,
        }),

        syntaxHighlighting(customMarkdownStyle()),
        lineWrapper(),

        // SB "clean mode"
        admonitionPlugin(),
        blockquotePlugin(),
        cleanEscapePlugin(),
        fencedCodePlugin(),
        hideHeaderMarkPlugin(),
        hideMarksPlugin(),
        horizontalRulePlugin(),
        // linkPlugin(client),
        listBulletPlugin(),
        // tablePlugin(client),
        // taskListPlugin({
        //     // TODO: Move this logic elsewhere?
        //     onCheckboxClick: (pos) => {
        //         // TODO: wut
        //         // const clickEvent: ClickEvent = {
        //         //     page: client.currentPage,
        //         //     altKey: false,
        //         //     ctrlKey: false,
        //         //     metaKey: false,
        //         //     pos: pos,
        //         // };
        //         // // Propagate click event from checkbox
        //         // client.dispatchClickEvent(clickEvent);
        //     }
        // })
    ];
}