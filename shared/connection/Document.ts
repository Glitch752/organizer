import * as Y from "yjs";
import { YMap } from "../typedYjs";

export type DocumentID = string & { readonly __brand: unique symbol };

export type DocumentSchema = {
    content: Y.Text;
    selection: SelectionCRDTSchema;
};

export type ScrollTargetInfo = {
    cursorPos: number,
    y: number,
    x: number
};

export type SelectionCRDTSchema = YMap<{
    latestSelection: any,
    latestScrollPos: ScrollTargetInfo
}>;