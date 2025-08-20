import { autocompletion } from "@codemirror/autocomplete";

export function autoCompletion() {
    return autocompletion({
        override: [
            // client.editorComplete.bind(client),
            // client.clientSystem.slashCommandHook!.slashCommandCompleter.bind(
            //     client.clientSystem.slashCommandHook,
            // ),
        ],
        optionClass(completion: any) {
            if(completion.cssClass) {
                return "test-class " + completion.cssClass;
            } else {
                return "";
            }
        },
    });
}