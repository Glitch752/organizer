import { logOut } from "../../pages/Auth.svelte";
import type { Client } from "../client";
import { backUpWorkspace, importBackup } from "./backup";

export type Command = {
    name: string;
    execute: (client: Client) => void;
    binds?: {
        key: string;
        ctrl?: boolean;
        shift?: boolean;
        alt?: boolean;
    }[]
};

export const commands: Command[] = [
    {
        name: "Back up workspace",
        execute: backUpWorkspace
    },
    {
        name: "Import backup",
        execute: importBackup
    },
    {
        name: "New page",
        execute: (client: Client) => {
            client.createPage(client.activePage ? { siblingId: client.activePage.id } : null);
        },
        binds: [
            { key: "T", ctrl: true },
            { key: "T", ctrl: true, alt: true }
        ]
    },
    {
        name: "Delete current page",
        execute: (client: Client) => {
            if(!client.activePage) return;
            client.deletePage(client.activePage.id);
        },
        binds: [
            { key: "W", ctrl: true },
            { key: "W", ctrl: true, alt: true }
        ]
    },
    {
        name: "Log out",
        execute: (_client: Client) => {
            logOut()
        },
        binds: [
            { key: "L", ctrl: true, shift: true }
        ]
    }
];