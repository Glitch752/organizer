import * as Y from 'yjs';

// Based primarily on https://gist.github.com/BitPhinix/a98b5f35a0be9cd8700103c8fd406d4d
// with modifications for our use case

export type YType = YMap<any> | YArray<any> | Y.Text;

export type Json = JsonScalar | JsonArray | JsonObject;
export type JsonScalar = string | number | boolean | null;
export type JsonArray = Json[];
export type JsonObject = { [key: string]: Json | undefined };

type Value = YType | Json;

export type YTypeConstructor<T extends YType> =
    new () => T extends YMap<any> ? YMap<any> : YArray<any>;

type KeysThatExtend<T, V> = keyof {
    [K in keyof T as T[K] extends V ? K : never]: T[K];
};
type EntryType<T extends Record<string, unknown>> = {
    [key in keyof T]: [key, T[key]];
}[keyof T];
type OptionalKeys<T> = {
    [K in keyof T]-?: undefined extends T[K] ? K : never;
}[keyof T];

type ToJsonValue<T extends Value> = T extends YType ? undefined : T;
type MapJsonValue<TData extends Record<string, Value>> = {
  [K in keyof TData]: ToJsonValue<TData[K]>;
};

export type ToJson<T extends Value> = T extends YMap<infer TData>
  ? {
        [K in keyof TData as K extends Json ? K : never]: ToJsonValue<TData[K]>;
    }
  : T extends YArray<infer TData>
  ? (TData extends Json ? TData : never)[]
  : T extends Json
  ? T
  : never;
export type ToJsonDeep<T extends Value> = T extends YArray<infer TValue>
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

type YMapTypings<T extends Record<string, Value>> = {
    doc: Y.Doc;
    
    observe(f: (event: Y.YMapEvent<T[keyof T]>, transaction: Y.Transaction) => void): void;
    unobserve(f: (event: Y.YMapEvent<T[keyof T]>, transaction: Y.Transaction) => void): void;
    observeDeep(f: (events: Array<Y.YEvent<any>>, transaction: Y.Transaction) => void): void;
    unobserveDeep(f: (events: Array<Y.YEvent<any>>, transaction: Y.Transaction) => void): void;
    
    clone(): YMap<T>;
    toJSON(): MapJsonValue<T>;

    keys(): IterableIterator<keyof T>;
    values(): IterableIterator<T[keyof T]>;
    entries(): IterableIterator<EntryType<T>>;
    forEach(fn: (
        key: keyof T,
        value: T[keyof T],
        self: YMap<T>,
    ) => void): void;
    [Symbol.iterator](): IterableIterator<EntryType<T>>;

    delete(key: OptionalKeys<T>): void;
    set<TKey extends keyof T, TValue extends T[TKey]>(
        key: TKey,
        value: TValue,
    ): TValue;
    get<TKey extends keyof T>(key: TKey): T[TKey];
    has<TKey extends keyof T>(key: TKey): boolean;
};

/**
 * Extended YMap interface that includes observer methods that exist at runtime
 * but are missing from the TypeScript definitions (for some reason).
 * Also has better typing than the normal Y.Map<K, V> interface.
 */
export type YMap<T extends Record<string, Value>> = Omit<Y.Map<T>, keyof YMapTypings<T>> & YMapTypings<T>;
export const YMap = Y.Map as new <T extends Record<string, Value>>(
    entries?: [keyof T, T[keyof T]][],
) => YMap<T>;

type YArrayTypings<T extends Value> = {
    doc: Y.Doc;
    
    observe(f: (event: Y.YArrayEvent<any>, transaction: Y.Transaction) => void): void;
    unobserve(f: (event: Y.YArrayEvent<any>, transaction: Y.Transaction) => void): void;
    observeDeep(f: (events: Array<Y.YEvent<any>>, transaction: Y.Transaction) => void): void;
    unobserveDeep(f: (events: Array<Y.YEvent<any>>, transaction: Y.Transaction) => void): void;

    toJSON(): ToJson<T>[];

    get(index: number): T | undefined;
    insert(index: number, content: T[]): void;
    delete(index: number, length?: number): void;
    push(content: T[]): void;
};

/**
 * Extended YArray interface that includes observer methods that exist at runtime
 * but are missing from the TypeScript definitions (for some reason).
 * Also has better typing than the normal Y.Array<T> interface.
 */
export type YArray<T extends Value> = Omit<Y.Array<T>, keyof YArrayTypings<T>> & YArrayTypings<T>;
export const YArray = Y.Array as new <T extends Value>(entries?: T[]) => YArray<T>;