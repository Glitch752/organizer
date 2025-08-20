<script lang="ts">
    import { onMount } from "svelte";
    import { getDocument } from "../stores/sync";
    import { EditorView } from "codemirror";
    import { EditorState } from "@codemirror/state";
    import { yCollab } from 'y-codemirror.next';
    import { keymap, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor } from "@codemirror/view";
    import { indentOnInput, bracketMatching } from "@codemirror/language";
    import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
    import { searchKeymap } from "@codemirror/search";
    import { completionKeymap, closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
    import { customPlugins } from "../lib/codeMirrorPlugins";

    import * as Y from "yjs";

    const { id }: { id: string } = $props();
    
    let editorContainer: HTMLDivElement;

    const doc = getDocument(`doc:${id}`);
    const yText = doc.doc.getText("content");
    const undoManager = new Y.UndoManager(yText);

    const userColors = [
        { color: '#30bced', light: '#30bced33' },
        { color: '#6eeb83', light: '#6eeb8333' },
        { color: '#ffbc42', light: '#ffbc4233' },
        { color: '#ecd444', light: '#ecd44433' },
        { color: '#ee6352', light: '#ee635233' },
        { color: '#9ac2c9', light: '#9ac2c933' },
        { color: '#8acb88', light: '#8acb8833' },
        { color: '#1be7ff', light: '#1be7ff33' }
    ];
    const userColor = userColors[Math.floor(Math.random() * userColors.length)];

    doc.awareness.setLocalStateField("user", {
        name: 'user' + Math.floor(Math.random() * 100),
        color: userColor.color,
        colorLight: userColor.light
    });

    onMount(() => {
        const state = EditorState.create({
            doc: yText.toString(),
            extensions: [
                highlightSpecialChars(),
                history(),
                
                drawSelection(),
                dropCursor(),
                rectangularSelection(),
                crosshairCursor(),
                
                EditorState.allowMultipleSelections.of(true),
                EditorView.theme({}, { dark: true }),
                
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

                ...customPlugins(),

                yCollab(yText, doc.awareness, { undoManager })
            ]
        });

        const view = new EditorView({
            state,
            parent: editorContainer
        });

        return () => {
            view.destroy();
            doc.disconnect();
            undoManager.destroy();
        };
    });
</script>

<div bind:this={editorContainer}></div>

<style>
    div {
        height: 100%;
    }

    :global {
        /* todo */
        .cm-editor {
            height: 100%;
        }
    }
</style>