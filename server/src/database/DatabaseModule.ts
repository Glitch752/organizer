import { Kysely } from "kysely";
import { DatabaseSchema } from "./types";
import { CronJob } from "cron";

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

    private cronTasks: {
        func: () => void,
        expression: string,
        cron?: CronJob
    }[] = [];

    protected addCronTask(func: () => void, expression: string) {
        this.cronTasks.push({ func, expression });
    }

    constructor(protected db: Kysely<DatabaseSchema>) {}

    public async init(): Promise<void> {
        for(const interval of this.intervals) {
            interval.id = setInterval(
                interval.func.bind(this),
                interval.interval
            );
        }

        for(const cronTask of this.cronTasks) {
            cronTask.cron = new CronJob(
                cronTask.expression,
                cronTask.func.bind(this)
            );
            cronTask.cron.start();
        }
    }

    public async destroy(): Promise<void> {
        for(const { interval } of this.intervals) {
            clearInterval(interval);
        }

        for(const { cron } of this.cronTasks) {
            cron?.stop();
        }
    }
}