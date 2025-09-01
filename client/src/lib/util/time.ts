export function debounce(func: () => void, delay: number): () => void {
    let timeoutId: ReturnType<typeof setTimeout>;
    return () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(func, delay);
    };
}

export function easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export function measurePromise<T>(promise: Promise<T>, name: string): Promise<T> {
    const start = performance.now();
    return promise.then((result) => {
        const end = performance.now();
        console.log(`${name} finished in ${end - start} ms`);
        return result;
    });
}