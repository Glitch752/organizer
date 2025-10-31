// This is the most gross TS I've ever written... please forgive me

import type { Component } from 'svelte';
import { writable, type Subscriber, type Unsubscriber } from 'svelte/store';

type ComponentRegistry<Keys extends string[]> = {
    [K in Keys[number]]: Component | null;
}

type ComponentSet<C = Component> = {
    page: C;
    header?: C;
    // cursed TS type hackiness
    pageOnly?: boolean;
    nav?: C;
} & ({
    nav: C;
} | {
    pageOnly: boolean;
});

type RouterPathConstants<Keys> = readonly {
    matcher: RegExp;
    components: ComponentSet<Keys>;
    name: string;
}[];

/**
 * Extracts the literal union of route names from a Router.
 * This is cursed. Don't do types like this.
 */
export type RouteNamesFrom<Paths extends readonly {
    name: string;
}[]> = Paths[number]['name'];

class RouteData<ComponentRegistry, Paths extends RouterPathConstants<keyof ComponentRegistry>> {
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

export class Router<CRKeys extends string[], Paths extends RouterPathConstants<CRKeys[number]>> {
    public subscribe: (run: Subscriber<RouteData<ComponentRegistry<CRKeys>, Paths>>, invalidate?: () => void) => Unsubscriber;
    private set: (value: RouteData<ComponentRegistry<CRKeys>, Paths>) => void;

    private readonly defaultPageName: RouteNamesFrom<Paths>;
    private get defaultPage() {
        return this.paths.find(p => p.name === this.defaultPageName)!;
    }

    public current: RouteData<ComponentRegistry<CRKeys>, Paths>;
    /** Scuffed way to avoid circular imports */
    public componentRegistry: ComponentRegistry<CRKeys> = {} as ComponentRegistry<CRKeys>;

    constructor(_componentRegistryKeys: CRKeys, private paths: Paths) {
        // Find the path responsible for "/"
        const defaultPath = this.paths.find(p => p.matcher.test("/"));
        if(!defaultPath) {
            throw new Error("No default path (/) defined in router paths");
        }
        this.defaultPageName = defaultPath.name;

        const emptyRouteData = this.getPathDataWithoutComponents(window.location.pathname);

        const { subscribe, set } = writable<RouteData<ComponentRegistry<CRKeys>, Paths>>(emptyRouteData);
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
            this.current = data;
        });

        window.addEventListener('popstate', async () => {
            this.set(await this.getPathData(window.location.pathname));
        });
    }

    private async getPathData(path: string): Promise<RouteData<ComponentRegistry<CRKeys>, Paths>> {
        const matchedPath = this.paths.find(p => p.matcher.test(path));
        const failIfNull = (v: Component | null): Component => {
            if(v === null) {
                throw new Error("Component was null in router! Should be initialized before mounting app.");
            }
            return v;
        }
        
        const transformSet = (s: ComponentSet<CRKeys[number]>): ComponentSet => {
            return {
                page: failIfNull(this.componentRegistry[s.page]),
                header: s.header ? failIfNull(this.componentRegistry[s.header]) : undefined,
                nav: s.pageOnly ? undefined : failIfNull(this.componentRegistry[s.nav!]),
                pageOnly: s.pageOnly
            } as ComponentSet
        }

        if(matchedPath) {
            return new RouteData(
                matchedPath.name,
                path,
                path.match(matchedPath.matcher),
                transformSet(matchedPath.components)
            );
        } else {
            this.navigate("/");
            return new RouteData(
                this.defaultPageName,
                path,
                null,
                transformSet(this.defaultPage.components)
            );
        }
    }

    private getPathDataWithoutComponents(path: string): RouteData<ComponentRegistry<CRKeys>, Paths> {
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
        if(!this.set) {
            // probably still in initialization; just update the history
        } else {
            this.set(await this.getPathData(path));
        }
        history.pushState({}, '', path);
    }

    /** Returns the full url for a route, in case we want to add a base path or something later */
    public url(path: string): string {
        return window.location.origin + path;
    }
}
