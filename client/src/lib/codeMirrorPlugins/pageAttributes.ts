import type { Extension } from "@codemirror/state";
import type { Client } from "../client";
import PageAttributes from "../attributes/PageAttributes.svelte";
import { mount } from "svelte";
import { Decoration, EditorView, WidgetType } from "@codemirror/view";

class PageAttributesWidget extends WidgetType {
    constructor(private client: Client) {
        super();
    }

    toDOM() {
        const el = document.createElement("div");

        mount(PageAttributes, {
            target: el,
            props: {
                client: this.client
            }
        });

        return el;
    }
}

export function pageAttributes(client: Client): Extension {
    return [
        EditorView.decorations.compute([], () => {
            return Decoration.set([
                Decoration.widget({
                    widget: new PageAttributesWidget(client),
                    side: -100,
                    block: true
                }).range(0)
            ]);
        })
    ];
}