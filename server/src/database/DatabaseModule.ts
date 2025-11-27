import { Kysely } from "kysely";
import { DatabaseSchema } from "./types";

/** Base class for database modules, a made-up concept I'm using to segment functionality */
export abstract class DatabaseModule {
    private intervals: {
        func: () => void,
        interval: number,
        id?: NodeJS.Timeout
    }[] = [];

    protected addInterval(func: () => void, ms: number) {
        this.intervals.push({ func, interval: ms });
    }

    public setIntervals() {
        for(const interval of this.intervals) {
            interval.id = setInterval(
                interval.func.bind(this),
                interval.interval
            );
        }
    }

    public clearIntervals() {
        for(const { interval } of this.intervals) {
            clearInterval(interval);
        }
    }

    constructor(protected db: Kysely<DatabaseSchema>) {}

    public async init(): Promise<void> {
    }
}