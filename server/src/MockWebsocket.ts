import { EventEmitter } from "stream";
import { WebSocketEventMap, EventListenerOptions } from "ws";
import * as WebSocket from "ws";

type MessageData = string | ArrayBuffer | Uint8Array;

interface MessageEventLike {
    data: MessageData | null;
    origin?: string;
}

type EventHandler = (ev: MessageEventLike) => void;

function toUint8Array(input: ArrayBuffer | Uint8Array): Uint8Array {
    if (input instanceof Uint8Array) return input;
    return new Uint8Array(input);
}

function concatUint8Arrays(...parts: Uint8Array[]): Uint8Array {
    const total = parts.reduce((sum, p) => sum + p.byteLength, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const p of parts) {
        out.set(p, offset);
        offset += p.byteLength;
    }
    return out;
}

/**
 * A mock WebSocket-like object. Created by MockWebsocketHub, which routes specific messages to it.
 */
export class MockSocket extends EventEmitter implements WebSocket {
    readonly prefix: string | null;
    readonly hub: MockWebsocketHub;
    readyState:
        | typeof WebSocket.CONNECTING
        | typeof WebSocket.OPEN
        | typeof WebSocket.CLOSING
        | typeof WebSocket.CLOSED;
    
    binaryType: "fragments" | "arraybuffer" | "nodebuffer" = "arraybuffer";
    
    // Garbage that we need but don't really handle
    readonly CONNECTING: typeof WebSocket.CONNECTING = WebSocket.CONNECTING;
    readonly OPEN: typeof WebSocket.OPEN = WebSocket.OPEN;
    readonly CLOSING: typeof WebSocket.CLOSING = WebSocket.CLOSING;
    readonly CLOSED: typeof WebSocket.CLOSED = WebSocket.CLOSED;
    get bufferedAmount(): number { return 0; }
    set bufferedAmount(_: number) { console.error("MockSocket: setting bufferedAmount is not supported"); }
    get extensions(): string { return ""; }
    set extensions(_: string) { console.error("MockSocket: setting extensions is not supported"); }
    get isPaused(): boolean { return false; }
    set isPaused(_: boolean) { console.error("MockSocket: setting isPaused is not supported"); }
    get protocol(): string { return ""; }
    set protocol(_: string) { console.error("MockSocket: setting protocol is not supported"); }
    get url(): string { return ""; }
    set url(_: string) { console.error("MockSocket: setting url is not supported"); }

    pong(data?: any, mask?: boolean, cb?: (err: Error) => void): void {
        console.error("MockSocket: pong called but not implemented");
    }
    pause(): void {
        console.error("MockSocket: pause called but not implemented");
    }
    resume(): void {
        console.error("MockSocket: resume called but not implemented");
    }

    onopen: ((event: WebSocket.Event) => void) | null = null;
    onerror: ((event: WebSocket.ErrorEvent) => void) | null = null;
    onclose: ((event: WebSocket.CloseEvent) => void) | null = null;
    onmessage: ((event: WebSocket.MessageEvent) => void) | null = null;

    private _listeners: Map<string, Set<EventHandler>> = new Map();

    constructor(hub: MockWebsocketHub, prefix: string | null) {
        super();
        this.hub = hub;
        this.prefix = prefix;
        this.readyState = this.OPEN;
    }

    addEventListener<K extends keyof WebSocketEventMap>(
        type: K,
        listener: ((event: WebSocketEventMap[K]) => void),
        options?: EventListenerOptions,
    ): void {
        if(!['message', 'open', 'close', 'error', 'pong'].includes(type)) {
            console.warn(`MockSocket: unsupported event type "${type}" in addEventListener()`);
            return this as any;
        }

        const set = this._listeners.get(type) ?? new Set<EventHandler>();
        set.add(listener as EventHandler);
        // We don't handle options for now, but whatever
        if(options?.once) {
            console.warn("MockSocket: addEventListener with options.once is not supported");
        }
        this._listeners.set(type, set);
    }

    removeEventListener<K extends keyof WebSocketEventMap>(
        type: K,
        listener: ((event: WebSocketEventMap[K]) => void),
    ): void {
        const set = this._listeners.get(type);
        if(!set) return;
        set.delete(listener as EventHandler);
        if(set.size === 0) this._listeners.delete(type);
    }

    // Note: These "on" functions actually pass different arguments than the standard WebSocket ones,
    // which makes this pretty annoying.

    // on(event: "close", listener: (this: WebSocket, code: number, reason: Buffer) => void): this;
    // on(event: "error", listener: (this: WebSocket, error: Error) => void): this;
    // on(event: "upgrade", listener: (this: WebSocket, request: IncomingMessage) => void): this;
    // on(event: "message", listener: (this: WebSocket, data: WebSocket.RawData, isBinary: boolean) => void): this;
    // on(event: "open", listener: (this: WebSocket) => void): this;
    // on(event: "ping" | "pong", listener: (this: WebSocket, data: Buffer) => void): this;
    // on(event: "redirect", listener: (this: WebSocket, url: string, request: ClientRequest) => void): this;
    // on(
    //     event: "unexpected-response",
    //     listener: (this: WebSocket, request: ClientRequest, response: IncomingMessage) => void,
    // ): this;
    
    private static onArgMap: { [event in keyof WebSocket.WebSocketEventMap]: (event: WebSocket.WebSocketEventMap[event]) => any[] } = {
        'message': (ev) => [ev.data, typeof ev.data === 'string' ? false : true],
        'open': (ev) => [],
        'close': (ev) => [ev.code, Buffer.from(ev.reason || '')],
        'error': (ev) => [new Error(ev.message)],
    };

    /** Probably not the cleanest way to structure this, but whatever */
    private onEvents: Map<(...args: any[]) => void, EventHandler> = new Map();

    // @ts-expect-error whatever at this point, node WS types are funky
    on(event: string | symbol, listener: (...args: any[]) => void): this {
        const cb = (ev: any) => {
            if(!MockSocket.onArgMap[event as keyof WebSocket.WebSocketEventMap]) {
                listener(ev);
            } else {
                const args = (MockSocket.onArgMap as any)[event as any]?.(ev) || [];
                listener(...args);
            }
        };
        this.onEvents.set(listener, cb);
        this.addEventListener(event as any, cb);
        return this;
    }
    // @ts-expect-error whatever at this point, node WS types are funky
    once(event: string | symbol, listener: (...args: any[]) => void): this {
        const wrapper = (...args: any[]) => {
            listener(...args);
            this.off(event, wrapper);
        }
        this.on(event, wrapper);
        return this;
    }
    // @ts-expect-error whatever at this point, node WS types are funky
    off(event: string | symbol, listener: (...args: any[]) => void): this {
        const cb = this.onEvents.get(listener);
        if(cb) {
            this.removeEventListener(event as any, cb);
            this.onEvents.delete(listener);
        }
        return this;
    }
    // @ts-expect-error whatever at this point, node WS types are funky
    addListener = this.on;
    // @ts-expect-error whatever at this point, node WS types are funky
    removeListener = this.off;

    removeAllListeners(eventName?: string | symbol | undefined): this {
        if(eventName && typeof eventName === 'string') {
            this._listeners.delete(eventName);
        } else {
            this._listeners.clear();
        }
        return this;
    }

    setMaxListeners(n: number): this {
        console.warn("MockSocket: setMaxListeners is not supported");
        return this;
    }
    getMaxListeners(): number {
        console.warn("MockSocket: getMaxListeners is not supported");
        return 0;
    }

    private dispatch(type: 'message' | 'open' | 'close' | 'error' | 'pong', ev: MessageEventLike) {
        const handler = {
            'message': this.onmessage,
            'open': this.onopen,
            'close': this.onclose,
            'error': this.onerror,
            'pong': null
        }[type];
        try {
            if(handler) {
                handler.call(this, ev as any);
            }
            const set = this._listeners.get(type);
            if(set) {
                for(const h of Array.from(set)) h(ev);
            }
        } catch(err) {
            // swallow handler exceptions so tests don't fail unexpectedly
            // but allow a hook via onerror
            if(type !== 'error' && this.onerror) {
                try {
                    this.onerror({
                        error: err,
                        message: (err as Error).message,
                        target: this,
                        type: 'error',
                    });
                } catch {}
            }
        }
    }
    dispatchEvent(event: Event): boolean {
        const type = event.type as 'message' | 'open' | 'close' | 'error';
        this.dispatch(type, event as any);
        return true;
    }

    send(data: MessageData) {
        if(this.readyState !== this.OPEN) {
            throw new Error('Socket is not open');
        }
        // If this is a child socket, sending should prefix and deliver to root.
        if(this.prefix !== null) {
            this.hub._childSend(this, data);
        } else {
            this.hub._rootSend(this, data);
        }
    }

    ping(data?: any, mask?: boolean, cb?: (err: Error) => void): void {
        if(this.readyState !== this.OPEN) {
            throw new Error('Socket is not open');
        }
        if(this.prefix !== null) {
            this.hub._childPing(this, data, mask, cb);
        } else {
            this.hub._rootPing(this, data, mask, cb);
        }
    }

    _pong(data: MessageData) {
        // Just emit pong event
        // Super hacky typing but whatever
        this.dispatch('pong', data as unknown as MessageEventLike);
    }

    terminate(): void {
        this.close();
    }
    close() {
        if(this.readyState === this.CLOSED) return;
        this.readyState = this.CLOSED;
        if(this.prefix === null) {
            // closing root closes all children
            this.hub._closeAll();
        } else {
            this.hub._removeChild(this.prefix);
        }
        this.dispatch('close', { data: null });
    }

    // Hub delivers a message into this socket (the data is already un-prefixed)
    _deliver(data: MessageData) {
        if(this.readyState !== this.OPEN) return;

        // Convert to our binaryType if binary
        if(typeof data !== 'string') {
            if(this.binaryType === 'arraybuffer' && data instanceof Uint8Array) {
                // technically not the right type, but Uint8Array seems to work fine
            } else if(this.binaryType === 'nodebuffer' && data instanceof ArrayBuffer) {
                data = Buffer.from(data);
            } else if(this.binaryType === 'fragments') {
                console.error("MockSocket: binaryType 'fragments' is not supported. literally no clue what this does.");
            }
        }

        this.dispatch('message', { data });
    }

    _emitOpen() {
        this.dispatch('open', { data: null });
    }

    _emitError(err: string) {
        this.dispatch('error', { data: err });
    }
}

export class MockWebsocketHub {
    private root: MockSocket = new MockSocket(this, null);
    private children: Map<string, MockSocket> = new Map();
    private textDecoder = new TextDecoder();
    private textEncoder = new TextEncoder();

    constructor(private backingSocket: WebSocket) {
        this.backingSocket.addEventListener('open', () => {
            this.root._emitOpen();
        });

        this.backingSocket.addEventListener('message', (data: any) => {
            this.handleBackingMessage(data);
        });

        this.backingSocket.addEventListener('close', () => {
            this._closeAll();
            this.root._emitError('Backing socket closed');
        });

        this.backingSocket.addEventListener('error', (err: any) => {
            this.root._emitError(err?.toString?.() ?? String(err));
        });

        this.backingSocket.on('pong', (data: Buffer) => {
            this.handleBackingPong(data);
        });

        // If backing socket is already open, emit open on root right away
        if(this.backingSocket.readyState === WebSocket.OPEN) {
            this.root._emitOpen();
        }
    }

    createChild(prefix: string): MockSocket {
        if(!prefix || prefix.includes(':')) throw new Error('Prefix must be a non-empty string without ":"');
        if(this.children.has(prefix)) throw new Error(`Child prefix "${prefix}" already exists`);
        const child = new MockSocket(this, prefix);
        this.children.set(prefix, child);
        child._emitOpen();
        return child;
    }

    // messages coming from the backing socket should be routed to child based on prefix
    private handleBackingMessage(event: MessageEvent) {
        const data = event.data;

        if(typeof data === 'string') {
            const idx = data.indexOf(':');
            if(idx === -1) return;
            const prefix = data.slice(0, idx);
            const payload = data.slice(idx + 1);
            const child = this.children.get(prefix);
            if(!child) {
                this.root._emitError(`No child for prefix "${prefix}"`);
                return;
            }
            child._deliver(payload);
            return;
        }

        // Buffer | ArrayBuffer | Uint8Array
        let bytes: Uint8Array;
        if(Buffer.isBuffer(data)) {
            bytes = new Uint8Array(data);
        } else if(data instanceof ArrayBuffer) {
            bytes = toUint8Array(data);
        } else if(data instanceof Uint8Array) {
            bytes = data;
        } else {
            // Shouldn't happen
            console.error(`MockWebsocketHub: received unsupported message data type "${
                data.prototype?.constructor?.name
            }" from backing socket`);
            console.log(data);
            return;
        }

        const colonIndex = bytes.indexOf(0x3A); // ':'
        if(colonIndex === -1) return;
        const prefixBytes = bytes.subarray(0, colonIndex);
        const payloadBytes = bytes.subarray(colonIndex + 1);
        const prefix = this.textDecoder.decode(prefixBytes);
        const child = this.children.get(prefix);
        if(!child) {
            this.root._emitError(`No child for binary prefix "${prefix}"`);
            return;
        }

        // Copy the array
        child._deliver(payloadBytes.slice());
    }

    // Forward to backing socket
    _rootSend(sender: MockSocket, data: MessageData) {
        if(sender !== this.root) throw new Error('Invalid root sender');

        if(this.backingSocket.readyState !== WebSocket.OPEN) throw new Error("Backing socket isn't open");

        if(typeof data === 'string') {
            this.backingSocket.send(data);
            return;
        }

        const bytes = toUint8Array(data);
        this.backingSocket.send(bytes);
    }

    // Prefix and send to backing socket
    _childSend(child: MockSocket, data: MessageData) {
        if(child.prefix === null) throw new Error('Child has no prefix');

        if(this.backingSocket.readyState !== WebSocket.OPEN) throw new Error('Backing socket is not open');

        if(typeof data === 'string') {
            const full = child.prefix + ':' + data;
            this.backingSocket.send(full);
            return;
        }

        const prefixHeader = this.textEncoder.encode(child.prefix + ':');
        const payload = toUint8Array(data);
        const full = concatUint8Arrays(prefixHeader, payload);
        this.backingSocket.send(full);
    }

    _removeChild(prefix: string) {
        const child = this.children.get(prefix);
        if(!child) return;
        
        child.readyState = WebSocket.CLOSED;
        this.children.delete(prefix);
    }

    _closeAll() {
        for(const [, child] of this.children) {
            child.readyState = WebSocket.CLOSED;
            child._emitError('Hub closed');
        }
        this.children.clear();
        this.root.readyState = WebSocket.CLOSED;
    }

    _childPing(socket: MockSocket, data?: any, mask?: boolean, cb?: (err: Error) => void): void {
        if(this.backingSocket.readyState !== WebSocket.OPEN) {
            cb?.(new Error('Backing socket is not open'));
            return;
        }
        // Technically, we could go over the max ping data length here, but
        // most people probably aren't sending 127 bytes of ping data...
        if(typeof data === 'string') {
            // Not sure if this can happen, but the types for ws' ping() are really unclear
            this.backingSocket.ping(`${socket.prefix}:${data}`, mask, cb);
        } else {
            const prefixHeader = this.textEncoder.encode(`${socket.prefix}:`);
            const payload = toUint8Array(data);
            const full = concatUint8Arrays(prefixHeader, payload);
            this.backingSocket.ping(full, mask, cb);
        }
    }

    _rootPing(socket: MockSocket, data?: any, mask?: boolean, cb?: (err: Error) => void): void {
        if(socket !== this.root) {
            cb?.(new Error('Invalid root sender'));
            return;
        }
        if(this.backingSocket.readyState !== WebSocket.OPEN) {
            cb?.(new Error("Backing socket isn't open"));
            return;
        }
        // There's no way to differentiate this from child pings. whatever though.
        this.backingSocket.ping(data, mask, cb);
    }

    private handleBackingPong(data: Buffer) {
        const colonIndex = data.indexOf(0x3A); // ':'
        if(colonIndex === -1) return;
        const prefixBytes = data.subarray(0, colonIndex);
        const payloadBytes = data.subarray(colonIndex + 1);
        const prefix = this.textDecoder.decode(prefixBytes);
        const child = this.children.get(prefix);

        if(!child) {
            this.root._emitError(`No child for ping prefix "${prefix}"`);
            return;
        }

        child._pong(payloadBytes.slice());
    }
}

export default MockWebsocketHub;