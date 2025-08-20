declare module 'y-codemirror' {
    // CodemirrorBinding
    import * as Y from "yjs";
    import { EditorView } from "codemirror";
    
    export class CodemirrorBinding {
        constructor(ytext: Y.Text, editor: EditorView, awareness?: any, options?: {
            yUndoManager?: Y.UndoManager
        } );
    }
};