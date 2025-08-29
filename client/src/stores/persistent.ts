import { writable, type Writable } from "svelte/store";

export function persistentState<T>(name: string, defaultValue: T): Writable<T> {
    const stored = localStorage.getItem(name);
    let state = writable(stored ? JSON.parse(stored) : defaultValue);
    state.subscribe((value) => {
        localStorage.setItem(name, JSON.stringify(value));
    });

    return state;
}