import { logOut } from "../../pages/Auth.svelte";
import type { Client } from "../client";
import { backUpWorkspace } from "./backup";

export type Command = {
    name: string;
    execute: (client: Client) => void;
    bind?: {
        key: string;
        ctrl?: boolean;
        shift?: boolean;
        alt?: boolean;
    }
};

export const commands: Command[] = [
    {
        name: "Back up workspace",
        execute: backUpWorkspace
    },
    {
        name: "New page",
        execute: (client: Client) => {
            client.createPage(client.activePage ? { siblingId: client.activePage.id } : null);
        }
    },
    {
        name: "Delete current page",
        execute: (client: Client) => {
            if(!client.activePage) return;
            client.deletePage(client.activePage.id);
        }
    },
    {
        name: "Log out",
        execute: (_client: Client) => {
            logOut()
        }
    }
];