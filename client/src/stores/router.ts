import Home from "../pages/Home.svelte";
import Calendar from "../pages/Calendar.svelte";
import Page from "../pages/Page.svelte";

import type { Component } from 'svelte';
import { writable, type Subscriber, type Unsubscriber, type Writable } from 'svelte/store';

/**
 * Extracts the literal union of route names from a Router.
 * This is cursed. Don't do types like this.
 */
export type RouteNamesFrom<Paths extends readonly {
    name: string;
}[]> = Paths[number]['name'];

class Router<
    Paths extends readonly {
        matcher: RegExp;
        component: Component;
        name: string;
    }[]
> {
    public subscribe: (run: Subscriber<string>, invalidate?: () => void) => Unsubscriber;
    private set: (value: string) => void;

    public component: Writable<Component | null>;
    public currentRoute: string | null = null;
    public matches: RegExpMatchArray | null = null;

    constructor(private paths: Paths) {
        const { subscribe, set } = writable(window.location.pathname);
        this.subscribe = subscribe;
        this.set = set;

        window.addEventListener('popstate', () => {
            set(window.location.pathname);
        });

        this.component = writable(this.getComponent(window.location.pathname));
        this.subscribe((path) => {
            this.component.set(this.getComponent(path));
        });
    }

    private getComponent(path: string): Component {
        const matchedPath = this.paths.find(p => p.matcher.test(path));
        if (matchedPath) {
            this.matches = path.match(matchedPath.matcher);
            this.currentRoute = matchedPath.name;
            return matchedPath.component;
        } else {
            this.navigate("/");
            return Home;
        }
    }

    public navigate(path: string): void {
        history.pushState({}, '', path);
        this.set(path);
    }

    /**
     * Checks if we're on a specific route. If matches are provided, checks if the route's matches
     * match the provided matches (did I say match enough?)
     */
    public onRoute(name: RouteNamesFrom<Paths>, matches?: string[]): boolean {
        if(this.currentRoute === name) {
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