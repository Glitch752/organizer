/**
 * A simple EventEmitter implementation.  
 * I like how well-typed NodeJS' EventEmitter is, so this is inspired by that.
 */
export class EventEmitter<Events extends Record<string, any>> {
    private listeners: {
        [K in keyof Events]?: Array<(payload: Events[K]) => void>;
    } = {};

    public on<K extends keyof Events>(event: K, listener: (payload: Events[K]) => void): void {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event]!.push(listener);
    }

    public once<K extends keyof Events>(event: K, listener: (payload: Events[K]) => void): void {
        const onceListener = (payload: Events[K]) => {
            this.off(event, onceListener);
            listener(payload);
        };
        this.on(event, onceListener);
    }

    public off<K extends keyof Events>(event: K, listener: (payload: Events[K]) => void): void {
        this.listeners[event] = this.listeners[event]?.filter(l => l !== listener);
    }

    public emit<K extends keyof Events>(event: K, payload: Events[K]): void {
        this.listeners[event]?.forEach(listener => listener(payload));
    }
}