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
    }
];