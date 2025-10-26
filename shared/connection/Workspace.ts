import { YArray, YMap } from "../typedYjs"
import { YTreeNodeData } from "../ytree";
import { Attribute } from "./attributes";

export type PageMeta = {
    name: string,
    collapsed?: boolean
};
export type WorkspaceSchema = {
    pages: YMap<{
        [id: string]: YTreeNodeData<PageMeta>
    }>,
    attributes: YMap<{
        [key: string]: YArray<Attribute>
    }>
};