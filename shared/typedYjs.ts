import * as Y from 'yjs';

// Based primarily on https://gist.github.com/BitPhinix/a98b5f35a0be9cd8700103c8fd406d4d
// with modifications for our use case

export type YType = YMap<any> | YArray<any> | Y.Text;

export type Json = JsonScalar | JsonArray | JsonObject;
export type JsonScalar = string | number | boolean | null;
export type JsonArray = Json[];
export type JsonObject = { [key: string]: Json | undefined };

export type YValue = YType | Json;

export type YTypeConstructor<T extends YType> =
    new () => T extends YMap<any> ? YMap<any> : YArray<any>;

type KeysThatExtend<T, V> = keyof {
    [K in keyof T as T[K] extends V ? K : never]: T[K];
};

type OptionalKeys<T> = {
    [K in keyof T]-?: undefined extends T[K] ? K : never;
}[keyof T];

type ToJsonValue<T extends YValue> = T extends YType ? undefined : T;
type MapJsonValue<TData extends Record<string, YValue>> = {
  [K in keyof TData]: ToJsonValue<TData[K]>;
};

export type ToJson<T extends YValue> = T extends YMap<infer TData>
  ? {
        [K in keyof TData as K extends Json ? K : never]: ToJsonValue<TData[K]>;
    }
  : T extends YArray<infer TData>
  ? (TData extends Json ? TData : never)[]
  : T extends Json
  ? T
  : never;
export type ToJsonDeep<T extends YValue> = T extends YArray<infer TValue>
  ? ToJsonDeep<TValue>
  : T extends YMap<infer TData>
  ? {
      [K in keyof TData]: ToJsonDeep<TData[K]>;
    }
  : T extends Json
  ? T
  : never;

export type YDocSchema = Record<string, YType>;

type YDocTypings<T extends YDocSchema> = {
    get<TKey extends keyof T, TValue extends T[TKey]>(
        key: TKey,
        typeConstructor: YTypeConstructor<TValue>
    ): T[TKey];
    get<TKey extends keyof T>(key: TKey): T[TKey] | undefined;
    getMap<TKey extends KeysThatExtend<T, YType>>(
        key: TKey,
    ): T[TKey] extends YMap<infer U> ? YMap<U> : never;
    getArray<TKey extends KeysThatExtend<T, YType>>(
        key: TKey,
    ): T[TKey] extends YArray<infer U> ? YArray<U> : never;
};

/**
 * Extended YDoc interface with better typing.
 */
export type YDoc<T extends YDocSchema> = Omit<Y.Doc, keyof YDocTypings<T>> & YDocTypings<T>;
export const YDoc = Y.Doc as new <T extends YDocSchema>() => YDoc<T>;

type YMapTypings<ElementTypes extends Record<string, YValue>> = {
    doc: Y.Doc;
    
    observe(f: (event: Y.YMapEvent<ElementTypes[keyof ElementTypes]>, transaction: Y.Transaction) => void): void;
    unobserve(f: (event: Y.YMapEvent<ElementTypes[keyof ElementTypes]>, transaction: Y.Transaction) => void): void;
    observeDeep(f: (events: Array<Y.YEvent<any>>, transaction: Y.Transaction) => void): void;
    unobserveDeep(f: (events: Array<Y.YEvent<any>>, transaction: Y.Transaction) => void): void;
    
    clone(): YMap<ElementTypes>;
    toJSON(): MapJsonValue<ElementTypes>;

    // These just use `string` as the key type instead of `keyof ElementTypes` because
    // that breaks TS for some reason...
    keys(): IterableIterator<string>;
    values(): IterableIterator<ElementTypes[keyof ElementTypes]>;
    entries(): IterableIterator<[string, ElementTypes[keyof ElementTypes]]>;
    forEach(fn: (
        value: ElementTypes[keyof ElementTypes],
        key: string,
        self: YMap<ElementTypes>,
    ) => void): void;
    [Symbol.iterator](): IterableIterator<[string, ElementTypes[keyof ElementTypes]]>;

    delete<Key extends OptionalKeys<ElementTypes>>(key: Key): void;
    set<TKey extends keyof ElementTypes, TValue extends ElementTypes[TKey]>(
        key: TKey,
        value: TValue,
    ): TValue;
    get<TKey extends keyof ElementTypes>(key: TKey): ElementTypes[TKey];
    has<TKey extends keyof ElementTypes>(key: TKey): boolean;
};

/**
 * Extended YMap interface that includes observer methods that exist at runtime
 * but are missing from the TypeScript definitions (for some reason).
 * Also has better typing than the normal Y.Map<K, V> interface.
 */
export type YMap<ElementTypes extends Record<string, YValue>> =
    Omit<Y.Map<ElementTypes>, keyof YMapTypings<ElementTypes>> &
    YMapTypings<ElementTypes>;

export const YMap = Y.Map as new <ElementTypes extends Record<string, YValue>>(
    entries?: [keyof ElementTypes, ElementTypes[keyof ElementTypes]][],
) => YMap<ElementTypes>;

type YArrayTypings<ItemType extends YValue> = {
    doc: Y.Doc;
    
    observe(f: (event: Y.YArrayEvent<any>, transaction: Y.Transaction) => void): void;
    unobserve(f: (event: Y.YArrayEvent<any>, transaction: Y.Transaction) => void): void;
    observeDeep(f: (events: Array<Y.YEvent<any>>, transaction: Y.Transaction) => void): void;
    unobserveDeep(f: (events: Array<Y.YEvent<any>>, transaction: Y.Transaction) => void): void;

    toJSON(): ToJson<ItemType>[];

    get(index: number): ItemType | undefined;
    insert(index: number, content: ItemType[]): void;
    delete(index: number, length?: number): void;
    push(content: ItemType[]): void;
};

/**
 * Extended YArray interface that includes observer methods that exist at runtime
 * but are missing from the TypeScript definitions (for some reason).
 * Also has better typing than the normal Y.Array<T> interface.
 */
export type YArray<ItemType extends YValue> =
    Omit<Y.Array<ItemType>, keyof YArrayTypings<ItemType>> &
    YArrayTypings<ItemType>;
export const YArray = Y.Array as new <ItemType extends YValue>(entries?: ItemType[]) => YArray<ItemType>;