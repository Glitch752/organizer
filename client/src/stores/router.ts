import type { Component } from 'svelte';
import { writable, type Subscriber, type Unsubscriber } from 'svelte/store';

type ComponentSet = {
    page: Component;
    header?: Component;
    // cursed TS type hackiness
    pageOnly?: boolean;
    nav?: Component;
} & ({
    nav: Component;
} | {
    pageOnly: boolean;
});

type RouterPathConstants = readonly {
    matcher: RegExp;
    components: ComponentSet | (() => Promise<ComponentSet>);
    name: string;
}[];

/**
 * Extracts the literal union of route names from a Router.
 * This is cursed. Don't do types like this.
 */
export type RouteNamesFrom<Paths extends readonly {
    name: string;
}[]> = Paths[number]['name'];

class RouteData<Paths extends RouterPathConstants> {
    constructor(
        public routeName: RouteNamesFrom<Paths>,
        public pathname: string,
        public matches: RegExpMatchArray | null,
        public components: ComponentSet | null
    ) {}

    /**
     * Checks if we're on a specific route. If matches are provided, checks if the route's matches
     * match the provided matches (did I say match enough?)
     */
    public onRoute(name: RouteNamesFrom<Paths>, matches?: string[]): boolean {
        if(this.routeName === name) {
            if(matches) {
                const routeMatches = this.matches;
                return routeMatches !== null &&
                    routeMatches.length > 0 &&
                    routeMatches.slice(1).every((m, i) => m === matches[i]);
            }
            return true;
        }
        return false;
    }
}

class Router<Paths extends RouterPathConstants> {
    public subscribe: (run: Subscriber<RouteData<Paths>>, invalidate?: () => void) => Unsubscriber;
    private set: (value: RouteData<Paths>) => void;

    private readonly defaultPageName: RouteNamesFrom<Paths>;
    private get defaultPage() {
        return this.paths.find(p => p.name === this.defaultPageName)!;
    }

    public current: RouteData<Paths>;
    
    constructor(private paths: Paths) {
        // Find the path responsible for "/"
        const defaultPath = this.paths.find(p => p.matcher.test("/"));
        if(!defaultPath) {
            throw new Error("No default path (/) defined in router paths");
        }
        this.defaultPageName = defaultPath.name;

        const emptyRouteData = this.getPathDataWithoutComponents(window.location.pathname);

        const { subscribe, set } = writable<RouteData<Paths>>(emptyRouteData);
        this.subscribe = subscribe;
        this.set = set;
        
        this.current = emptyRouteData
    }

    /**
     * Must run before rendering!
     */
    public async initialize() {
        const initial = this.current = await this.getPathData(window.location.pathname);
        this.set(initial);

        this.subscribe((data) => {
            console.log("Navigated to", data?.pathname);
            this.current = data;
        });

        window.addEventListener('popstate', async () => {
            this.set(await this.getPathData(window.location.pathname));
        });
    }

    private async getPathData(path: string): Promise<RouteData<Paths>> {
        const matchedPath = this.paths.find(p => p.matcher.test(path));
        if(matchedPath) {
            return new RouteData(
                matchedPath.name,
                path,
                path.match(matchedPath.matcher),
                matchedPath.components instanceof Function ? await matchedPath.components() : matchedPath.components
            );
        } else {
            this.navigate("/");
            return new RouteData(
                this.defaultPageName,
                path,
                null,
                this.defaultPage.components instanceof Function ? await this.defaultPage.components() : this.defaultPage.components
            );
        }
    }

    private getPathDataWithoutComponents(path: string): RouteData<Paths> {
        const matchedPath = this.paths.find(p => p.matcher.test(path));
        if(matchedPath) {
            return new RouteData(
                matchedPath.name,
                path,
                path.match(matchedPath.matcher),
                null
            );
        } else {
            this.navigate("/");
            return new RouteData(
                this.defaultPageName,
                path,
                null,
                null
            );
        }
    }

    public async navigate(path: string): Promise<void> {
        this.set(await this.getPathData(path));
        history.pushState({}, '', path);
    }

    /** Returns the full url for a route, in case we want to add a base path or something later */
    public url(path: string): string {
        return window.location.origin + path;
    }
}

/** A svelte action to make links route properly without reloading the page. */
export function link(element: HTMLAnchorElement) {
    function onClick(event: MouseEvent) {
        if(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const href = element.getAttribute('href');
        if(href && href.startsWith('/')) {
            event.preventDefault();
            route.navigate(href);
        }
    }
    
    element.addEventListener('click', onClick);
    return {
        destroy() {
            element.removeEventListener('click', onClick);
        }
    };
}


export const route = new Router([
    {
        matcher: /^\/$/,
        components: async () => ({
            page: (await import("../pages/Home.svelte")).default,
            nav: (await import("../pages/PageNav.svelte")).default
        }),
        name: "home"
    },
    {
        matcher: /^\/auth$/,
        components: async () => ({
            page: (await import("../pages/Auth.svelte")).default,
            pageOnly: true
        }),
        name: "auth"
    },
    {
        matcher: /^\/calendar$/,
        components: async () => ({
            page: (await import("../pages/Calendar.svelte")).default,
            header: (await import("../pages/CalendarHeader.svelte")).default,
            nav: (await import("../pages/CalendarNav.svelte")).default
        }),
        name: "calendar"
    },
    {
        matcher: /^\/page\/([a-zA-Z0-9-]+)$/,
        components: async () => ({
            page: (await import("../pages/Page.svelte")).default,
            header: (await import("../pages/PageHeader.svelte")).default,
            nav: (await import("../pages/PageNav.svelte")).default
        }),
        name: "page"
    }
] as const);