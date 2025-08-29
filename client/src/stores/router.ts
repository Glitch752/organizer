import Home from "../pages/Home.svelte";
import Calendar from "../pages/Calendar.svelte";
import Page from "../pages/Page.svelte";

import type { Component } from 'svelte';
import { writable, type Subscriber, type Unsubscriber, type Writable } from 'svelte/store';

type RouterPathConstants = readonly {
    matcher: RegExp;
    component: Component;
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
        public component: Component
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

    constructor(private paths: Paths) {
        const { subscribe, set } = writable(this.getPathData(window.location.pathname));
        this.subscribe = subscribe;
        this.set = set;

        window.addEventListener('popstate', () => {
            set(this.getPathData(window.location.pathname));
        });
    }

    private getPathData(path: string): RouteData<Paths> {
        const matchedPath = this.paths.find(p => p.matcher.test(path));
        if(matchedPath) {
            return new RouteData(
                matchedPath.name,
                path,
                path.match(matchedPath.matcher),
                matchedPath.component,
            );
        } else {
            this.navigate("/");
            return new RouteData(
                this.paths.find(p => p.component === Home)!.name,
                path,
                null,
                Home,
            );
        }
    }

    public navigate(path: string): void {
        history.pushState({}, '', path);
        this.set(this.getPathData(path));
    }
}

export const route = new Router([
    {
        matcher: /^\/$/,
        component: Home,
        name: "home"
    },
    {
        matcher: /^\/calendar$/,
        component: Calendar,
        name: "calendar"
    },
    {
        matcher: /^\/page\/([a-zA-Z0-9-]+)$/,
        component: Page,
        name: "page"
    }
] as const);