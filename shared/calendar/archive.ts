import { HexString } from "../connection/attributes/color";
import { PlainDateString, PlainTimeString } from "../datetime";
import { YArray, YMap } from "../typedYjs";

/** An event without information about what day it occurs on. */
type V1ArchiveEvent = ({
    type: "deadline";
    time: PlainTimeString;
} | {
    type: "event";
    /** If not specified, this event continues to the previous day */
    start?: PlainTimeString;
    /** If not specified, this event continues to the next day */
    end?: PlainTimeString;
    startDay: PlainDateString;
    endDay: PlainDateString;
} | {
    type: "allDayEvent";
}) & {
    pageId: string;
    color?: HexString;
    title: string;
}

export enum CalendarArchiveVersion {
    V1 = 1
}

export type CalendarArchiveSchema = {
    "meta": YMap<{
        /** Year this archive stores */
        year: number;
        /** Month this archive stores. Temporal format - 1-based */
        month: number;

        createdAt: string;

        version: CalendarArchiveVersion;
    }>,
    /** A map from day to event. */
    "v1-data": YMap<{
        [day: PlainDateString]: YArray<V1ArchiveEvent>
    }>
};