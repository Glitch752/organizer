import * as Y from 'yjs';

export type YElementType = 
    | string
    | number
    | boolean
    | YMap<YMapType>
    | YArray<YArrayType>
    | {
        [key: string]: YElementType
    } | YElementType[];

export type YMapType = {
    [key: string]: YElementType;
} & { readonly __brand?: 'YMapType' };

export type YArrayType = YElementType[] & { readonly __brand?: 'YArrayType' };

export type YDocType = {
    [key: string]: YMap<YMapType> | YArray<YArrayType> | string;
} & { readonly __brand?: 'YDocType' };

type Jsonify<T extends YElementType> =
    T extends string | number | boolean ? T :
    T extends YMap<infer U> ? { [K in keyof U]: Jsonify<U[K]> } :
    T extends YArray<infer V> ? Jsonify<V[number]>[] :
    never;

const test: YMap<{
    [key: string]: YArray<{
        asdf: string    
    }[]>
}> = {} as any;

/**
 * Extended YDoc interface that has better typing than the normal Y.Doc interface.
 */
export interface YDoc<T extends YDocType> {
    getArray<K extends keyof T>(name: K): T[K] extends YArray<YArrayType> ? T[K] : never;
    getMap<K extends keyof T>(name: K): T[K] extends YMap<YMapType> ? T[K] : never;
    getText<K extends keyof T>(name: K): T[K] extends string ? T[K] : never;
}

/**
 * Extended YMap interface that includes observer methods that exist at runtime
 * but are missing from the TypeScript definitions (for some reason).
 * Also has better typing than the normal Y.Map<K, V> interface.
 */
export interface YMap<T extends YMapType> {
    doc: Y.Doc;
    
    observe(f: (event: Y.YMapEvent<T[keyof T]>, transaction: Y.Transaction) => void): void;
    unobserve(f: (event: Y.YMapEvent<T[keyof T]>, transaction: Y.Transaction) => void): void;
    observeDeep(f: (events: Array<Y.YEvent<any>>, transaction: Y.Transaction) => void): void;
    unobserveDeep(f: (events: Array<Y.YEvent<any>>, transaction: Y.Transaction) => void): void;

    get<K extends keyof T>(key: K): T[K];
    set<K extends keyof T>(key: K, value: T[K]): void;
    has<K extends keyof T>(key: K): boolean;
    delete<K extends keyof T>(key: K): void;

    toJSON(): { [K in keyof T]: Jsonify<T[K]> };
}

/**
 * Extended YArray interface that includes observer methods that exist at runtime
 * but are missing from the TypeScript definitions (for some reason).
 * Also has better typing than the normal Y.Array<T> interface.
 */
export interface YArray<T extends YArrayType> {
    doc: Y.Doc;
    
    observe(f: (event: Y.YArrayEvent<any>, transaction: Y.Transaction) => void): void;
    unobserve(f: (event: Y.YArrayEvent<any>, transaction: Y.Transaction) => void): void;
    observeDeep(f: (events: Array<Y.YEvent<any>>, transaction: Y.Transaction) => void): void;
    unobserveDeep(f: (events: Array<Y.YEvent<any>>, transaction: Y.Transaction) => void): void;

    get(index: number): T[number];
    insert(index: number, content: T[number][]): void;
    push(content: T[number][]): void;
    delete(index: number, length?: number): void;

    toJSON(): Jsonify<T[number]>[];
}