export function debounce(func: () => void, delay: number): () => void {
    let timeoutId: ReturnType<typeof setTimeout>;
    return () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(func, delay);
    };
}