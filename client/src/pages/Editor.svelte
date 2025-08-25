<script lang="ts">
    import { onMount } from "svelte";
    import { EditorView } from "codemirror";
    import { EditorState } from "@codemirror/state";
    import { yCollab } from 'y-codemirror.next';
    import { keymap, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, scrollPastEnd } from "@codemirror/view";
    import { indentOnInput, bracketMatching } from "@codemirror/language";
    import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
    import { searchKeymap } from "@codemirror/search";
    import { completionKeymap, closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
    import { customPlugins } from "../lib/codeMirrorPlugins";
    import "../styles/editor/editor.scss";
    import type { Client } from "../lib/client";
    import { pageAttributes } from "../lib/codeMirrorPlugins/pageAttributes";

    const { id, client }: { id: string, client: Client } = $props();
    
    let editorContainer: HTMLDivElement;

    onMount(() => {
        const { sub, text: yText, selection, undoManager } = client.loadPage(id, () => {
            view.dispatch({
                selection: selection.selection,
                effects: selection.scrollEffect(view)
            });
        });
        const state = EditorState.create({
            doc: yText.toString(),
            extensions: [
                pageAttributes(client),

                highlightSpecialChars(),
                history(),
                
                drawSelection(),
                dropCursor(),
                rectangularSelection(),
                crosshairCursor(),
                
                EditorState.allowMultipleSelections.of(true),
                EditorView.theme({}, { dark: true }),
                EditorView.lineWrapping,
                scrollPastEnd(),
                
                indentOnInput(),
                
                bracketMatching(),
                closeBrackets(),
                
                keymap.of([
                    ...closeBracketsKeymap,
                    ...defaultKeymap,
                    ...searchKeymap,
                    ...historyKeymap,
                    ...completionKeymap
                ]),

                ...customPlugins(client),

                // Update selection whenever our selection changes
                EditorView.updateListener.of((v) => {
                    if(v.selectionSet) selection.selection = v.state.selection;
                }),

                // Update scroll position when the dom event fires
                EditorView.domEventHandlers({
                    scroll(event, view) {
                        selection.updateScrollPos(view);
                    }
                }),

                yCollab(yText, sub.awareness, { undoManager })
            ]
        });

        const view = new EditorView({
            state,
            parent: editorContainer
        });
        if(client.activePage) client.activePage.editorView = view;

        view.focus();

        return () => {
            view.destroy();
            if(client.activePage) client.activePage.editorView = null;
        };
    });
</script>

<div bind:this={editorContainer}></div>

<style lang="scss">
    div {
        height: 100%;
    }
</style>