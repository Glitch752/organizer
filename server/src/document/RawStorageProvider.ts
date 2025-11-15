import { StorageProvider } from "./StorageProvider";
import { DocumentID } from "@shared/connection/Document";
import { DataStore } from "../DataStore";
import * as Y from "yjs";
import { YArray } from "@shared/typedYjs";

export type TopLevelType = "text" | "array" | "map";

type ValueType = TopLevelValueType | {
    type: "primitive",
    value: any
};

type TopLevelValueType = {
    type: "text",
    value: string
} | {
    type: "array",
    value: ValueType[]
} | {
    type: "map",
    value: { [key: string]: ValueType }
};

type RawDocData = {
    items: {
        [key: string]: TopLevelValueType
    }
};

type TopLevelTypes = {
    /** If null, skip. */
    [key: string]: TopLevelType | null
};

/**
 * RawStorageProvider persists YDoc top-level elements into a JSON file under
 * data/{subdir}/{id}.json. It stores an array of items with `key`, `type`, and `value`.
 */
export class RawStorageProvider implements StorageProvider {
    constructor(
        private dataStore: DataStore,
        private subdir: string,
        private topLevelTypes: TopLevelTypes
    ) {}

    private deserializeValue(item: ValueType): any {
        switch(item.type) {
            case "text":
                const ytext = new Y.Text();
                ytext.insert(0, item.value);
                return ytext;
            case "array":
                const yarray = new Y.Array<any>();
                yarray.push(
                    item.value.map(v => this.deserializeValue(v))
                );
                return yarray;
            case "map":
                const ymap = new Y.Map<any>();
                for(const [key, v] of Object.entries(item.value)) {
                    ymap.set(key, this.deserializeValue(v));
                }
                return ymap;
            case "primitive":
                return item.value;
        }
    }
    

    public async load(id: DocumentID): Promise<Uint8Array | null> {
        const raw: RawDocData = await this.dataStore.readJsonFile(this.subdir, id);
        if(!raw) return null;

        const doc = new Y.Doc();

        for(const [key, type] of Object.entries(this.topLevelTypes)) {
            const item = raw.items[key];
            if(!item) continue;

            if(item.type !== type) {
                console.warn(`Mismatched type for key ${key} in document ${id}, expected ${type} but got ${item.type}`);
            }
            
            switch(type) {
                case "text": {
                    const ytext = doc.getText(key);
                    ytext.insert(0, item.value as string);
                    break;
                }
                case "array": {
                    const yarray = doc.getArray<any>(key);
                    yarray.push(
                        (item.value as ValueType[]).map(v => this.deserializeValue(v))
                    );
                    break;
                }
                case "map": {
                    const ymap = doc.getMap<any>(key);
                    for(const [k, v] of Object.entries(item.value as { [key: string]: ValueType })) {
                        ymap.set(k, this.deserializeValue(v));
                    }
                    break;
                }
            }
        }

        return Y.encodeStateAsUpdate(doc);
    }

    private inferType(item: any): TopLevelType | "primitive" {
        if(item instanceof Y.Text) return "text";
        if(item instanceof Y.Array) return "array";
        if(item instanceof Y.Map) return "map";
        return "primitive";
    }

    private serializeValue(value: any, type: TopLevelType | "primitive"): ValueType {
        switch(type) {
            case "text":
                return {
                    type: "text",
                    value: value.toString()
                };
            case "array":
                if(!(value instanceof Y.Array)) {
                    throw new Error("Expected Y.Array for type 'array'");
                }
                const arrItems: ValueType[] = [];
                value.forEach((item: any) => {
                    arrItems.push(
                        this.serializeValue(item, this.inferType(item))
                    );
                });
                return {
                    type: "array",
                    value: arrItems
                };
            case "map":
                if(!(value instanceof Y.Map)) {
                    throw new Error("Expected Y.Map for type 'map'");
                }
                const mapItems: { [key: string]: ValueType } = {};
                value.forEach((item: any, key: string) => {
                    mapItems[key] = this.serializeValue(item, this.inferType(item));
                });
                return {
                    type: "map",
                    value: mapItems
                };
            default:
                return {
                    type: "primitive",
                    value: value
                };
        }
    }

    public async save(id: DocumentID, doc: Y.Doc): Promise<void> {
        const data: RawDocData = {
            items: {}
        };

        for(const [key, type] of Object.entries(this.topLevelTypes)) {
            if(type === null) {
                // Skip
                continue;
            }

            let value;
            switch(type) {
                case "text":
                    value = doc.getText(key);
                    break;
                case "array":
                    value = doc.getArray<any>(key);
                    break;
                case "map":
                    value = doc.getMap<any>(key);
                    break;
            }

            if(value !== undefined) {
                data.items[key] = this.serializeValue(
                    value,
                    type
                ) as TopLevelValueType;
            }
        }

        // Warn if there are any entries that aren't in the top level types
        for(const [key, _] of doc.share.entries()) {
            if(!(key in this.topLevelTypes)) {
                console.warn(`Key ${key} in document ${id} is not defined in topLevelTypes`);
            }
        }

        await this.dataStore.updateJsonFile(
            this.subdir,
            id,
            data
        );
    }
}
