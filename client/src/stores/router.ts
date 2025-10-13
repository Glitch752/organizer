import { Router } from "../lib/router";

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
    "Home",
    "PageNav",
    "Auth",
    "Calendar",
    "CalendarHeader",
    "CalendarNav",
    "Page",
    "PageHeader"
] as const, [
    {
        matcher: /^\/$/,
        components: {
            page: "Home",
            nav: "PageNav",
        },
        name: "home"
    },
    {
        matcher: /^\/auth$/,
        components: {
            page: "Auth",
            pageOnly: true
        },
        name: "auth"
    },
    {
        matcher: /^\/calendar$/,
        components: {
            page: "Calendar",
            header: "CalendarHeader",
            nav: "CalendarNav"
        },
        name: "calendar"
    },
    {
        matcher: /^\/page\/([a-zA-Z0-9-]+)$/,
        components: {
            page: "Page",
            header: "PageHeader",
            nav: "PageNav"
        },
        name: "page"
    }
] as const);