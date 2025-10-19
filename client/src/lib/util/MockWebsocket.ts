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
export class MockSocket implements WebSocket {
    readonly prefix: string | null;
    readonly hub: MockWebsocketHub;
    readyState:
        | typeof WebSocket.CONNECTING
        | typeof WebSocket.OPEN
        | typeof WebSocket.CLOSING
        | typeof WebSocket.CLOSED;
    
    // Garbage that we need but don't really handle
    readonly CONNECTING: typeof WebSocket.CONNECTING = WebSocket.CONNECTING;
    readonly OPEN: typeof WebSocket.OPEN = WebSocket.OPEN;
    readonly CLOSING: typeof WebSocket.CLOSING = WebSocket.CLOSING;
    readonly CLOSED: typeof WebSocket.CLOSED = WebSocket.CLOSED;
    get binaryType(): "arraybuffer" { return "arraybuffer"; }
    set binaryType(type: "blob" | "arraybuffer") {
        if(type != "arraybuffer") console.error(`MockSocket: Setting binaryType to "${type}" is not supported`);
    }
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

    ping(data?: any, mask?: boolean, cb?: (err: Error) => void): void {
        console.error("MockSocket: ping called but not implemented");
    }
    pong(data?: any, mask?: boolean, cb?: (err: Error) => void): void {
        console.error("MockSocket: pong called but not implemented");
    }
    pause(): void {
        console.error("MockSocket: pause called but not implemented");
    }
    resume(): void {
        console.error("MockSocket: resume called but not implemented");
    }

    onopen: ((event: Event) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;
    onclose: ((event: CloseEvent) => void) | null = null;
    onmessage: ((event: MessageEvent) => void) | null = null;

    private _listeners: Map<string, Set<EventHandler>> = new Map();

    constructor(
        hub: MockWebsocketHub,
        prefix: string | null,
        startingReadyState:
            typeof WebSocket.CONNECTING |
            typeof WebSocket.OPEN |
            typeof WebSocket.CLOSING |
            typeof WebSocket.CLOSED
    ) {
        this.hub = hub;
        this.prefix = prefix;
        this.readyState = startingReadyState;
    }

    addEventListener<K extends keyof WebSocketEventMap>(
        type: K,
        listener: ((event: WebSocketEventMap[K]) => void),
        options?: EventListenerOptions,
    ): void {
        if(!['message', 'open', 'close', 'error'].includes(type)) {
            console.warn(`MockSocket: unsupported event type "${type}" in .on()`);
            return this as any;
        }

        const set = this._listeners.get(type) ?? new Set<EventHandler>();
        set.add(listener as EventHandler);
        // We don't handle options for now, but whatever
        if(options?.capture) {
            console.warn("MockSocket: addEventListener with options.capture is not supported");
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

    // All of the other words for the same thing
    on(event: string | symbol, listener: (...args: any[]) => void): this {
        this.addEventListener(event as any, listener as any);
        return this;
    }
    once(event: string | symbol, listener: (...args: any[]) => void): this {
        console.warn("MockSocket: once called but is not implemented");
        return this;
    }
    off(event: string | symbol, listener: (...args: any[]) => void): this {
        this.removeEventListener(event as any, listener as any);
        return this;
    }
    addListener = this.on;
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

    private dispatch(type: 'message' | 'open' | 'close' | 'error', ev: MessageEventLike) {
        const handler = {
            'message': this.onmessage,
            'open': this.onopen,
            'close': this.onclose,
            'error': this.onerror,
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
                    this.onerror(new ErrorEvent("error", {
                        error: err,
                        message: (err as Error).message
                    }));
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

    // internal: hub delivers a message into this socket (payload already un-prefixed)
    _deliver(data: MessageData) {
        if(this.readyState !== this.OPEN) return;
        this.dispatch('message', { data });
    }

    _emitOpen() {
        this.readyState = WebSocket.OPEN;
        this.dispatch('open', { data: null });
    }

    _emitError(err: string) {
        this.dispatch('error', { data: err });
    }
}

export class MockWebsocketHub {
    private root: MockSocket = new MockSocket(this, null, WebSocket.CONNECTING);
    private children: Map<string, MockSocket> = new Map();
    private textDecoder = new TextDecoder();
    private textEncoder = new TextEncoder();

    constructor(private backingSocket: WebSocket) {
        backingSocket.binaryType = "arraybuffer";
        
        this.backingSocket.addEventListener('open', () => {
            this.openAll();
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

        // If backing socket is already open, emit open on root right away
        if(this.backingSocket.readyState === WebSocket.OPEN) {
            this.openAll();
        }
    }

    createChildFakePolyfill(prefix: string): {
        new (_url: string): MockSocket;
    } {
        if(!prefix || prefix.includes(':')) throw new Error('Prefix must be a non-empty string without ":"');
        const hub = this;

        // CRAZY javascript code holy
        return class extends MockSocket {
            constructor(_url: string) {
                if(hub.children.has(prefix)) throw new Error(`Child prefix "${prefix}" already exists`);

                console.log(`MockWebsocketHub: creating child socket with prefix "${prefix}" via fake polyfill for URL ${_url}`);
                super(hub, prefix, hub.backingSocket.readyState);
                hub.children.set(prefix, this);
            }
        };
    }

    createChild(prefix: string): MockSocket {
        if(!prefix || prefix.includes(':')) throw new Error('Prefix must be a non-empty string without ":"');
        if(this.children.has(prefix)) throw new Error(`Child prefix "${prefix}" already exists`);
        const child = new MockSocket(this, prefix, this.backingSocket.readyState);
        this.children.set(prefix, child);
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

        let bytes: Uint8Array;
        if(data instanceof ArrayBuffer) {
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
    private openAll() {
        console.log(this.backingSocket.readyState);
        this.root._emitOpen();
        for(const [, child] of this.children) {
            child._emitOpen();
        }
    }
}

export default MockWebsocketHub;