export type TimeZoneData = {
    label: string;
    offset: string | null;
    description: string;
};

export const zoneRegex = /\[[a-zA-Z/-_]+\]/;

export function stripZoneId(isoString: string): string {
    return isoString.replace(zoneRegex, "");
}

export function split(isoString: string): {
    time: string,
    zone: string
} {
    const match = isoString.match(zoneRegex);
    return {
        time: stripZoneId(isoString),
        zone: match ? match[0].slice(1, -1) : ""
    };
}

export function getTimeZones(): TimeZoneData[] {    
    return Intl.supportedValuesOf('timeZone').map(tz => {
        const now = new Date();
        const zoneName = now.toLocaleString('en-US', { timeZone: tz, timeZoneName: 'short' }).split(' ').pop();
        const offset = now.toLocaleString('en-US', {
            timeZone: tz,
            timeZoneName: 'longOffset'
        }).split(' ').pop()?.replace(/GMT/, '') ?? null;

        return {
            label: tz,
            offset,
            offsetNumber: offset ? parseFloat(offset.replace(/[^\d.-]/g, '')) : 0,
            description: `(${zoneName}) ${tz.replace(/_/g, ' ')}`
        };
    }).sort((a, b) => {
        // Sort by offset
        if(a.offset === null) return 1;
        if(b.offset === null) return -1;
        if(a.offsetNumber !== b.offsetNumber) {
            return a.offsetNumber - b.offsetNumber;
        }
        // Then sort by label
        return a.label.localeCompare(b.label);
    });
}