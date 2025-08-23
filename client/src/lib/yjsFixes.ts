import * as Y from 'yjs';

/**
 * Extended YMap interface that includes observer methods that exist at runtime
 * but are missing from the TypeScript definitions (for some reason)
 */
export interface YMap<T> extends Y.Map<T> {
    observe(f: (event: Y.YMapEvent<T>, transaction: Y.Transaction) => void): void;
    unobserve(f: (event: Y.YMapEvent<T>, transaction: Y.Transaction) => void): void;
    observeDeep(f: (events: Array<Y.YEvent<any>>, transaction: Y.Transaction) => void): void;
    unobserveDeep(f: (events: Array<Y.YEvent<any>>, transaction: Y.Transaction) => void): void;
}