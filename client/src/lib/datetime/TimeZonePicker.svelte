<script lang="ts">
    import { getPlainTime, getTimeZones, isZonedDateTime, isZonedTime, makePlainTime, makeZonedDateTime, makeZonedTime, parseZonedDateTime, parseZonedTime, type PlainTimeString, type TimeZoneData, type ZonedDateTimeString, type ZonedTimeString } from "./time";

    let { value = $bindable(), onchange }: {
        value: ZonedDateTimeString | ZonedTimeString | PlainTimeString,
        onchange: () => void
    } = $props();

    // Common time zones with their offsets
    const timeZones: TimeZoneData[] = [
        { id: "Local", offset: null, description: "Your local time zone" },
        ...getTimeZones()
    ];

    // Determine current selection
    const currentSelection = $derived(() => {
        if(!isZonedTime(value)) {
            return timeZones[0]; // "Local"
        }

        const { zone } = parseZonedTime(value);
        const idMatch = timeZones.find(tz => tz.id === zone) ? value.match(/\[(.+?)\]$/) : null;
        if(idMatch) {
            const id = idMatch[1];
            const matchingZone = timeZones.find(tz => tz.id === id);
            if(matchingZone) return matchingZone;
        }
        
        // Extract offset from the value
        const offsetMatch = value.match(/([+-]\d{2}:\d{2})$/);
        if(offsetMatch) {
            const offset = offsetMatch[1];
            const matchingZone = timeZones.find(tz => tz.offset === offset);
            return matchingZone || { id: "Custom", offset, description: `UTC${offset}` };
        }
        
        return timeZones[0]; // Fallback to local
    });

    function selectTimeZone(timeZone: typeof timeZones[0]) {
        const currentTime = getPlainTime(value);
        if(isZonedDateTime(value)) {
            // Zoned date-time
            const zdt = parseZonedDateTime(value).withTimeZone(timeZone.id);
            value = makeZonedDateTime(zdt);
        } else if(timeZone.offset === null) {
            // Local, plain time
            value = makePlainTime(currentTime);
        } else {
            // Zoned time
            value = makeZonedTime(currentTime, timeZone.id);
        }
        
        onchange();
    }
</script>

<div class="timezone-picker">
    <div class="current-selection">
        <span class="selected-zone">{currentSelection().id}</span>
        <span class="selected-description">{currentSelection().description}</span>
        {#if currentSelection().offset}
            <span class="selected-offset">UTC{currentSelection().offset}</span>
        {/if}
    </div>
    
    <div class="timezone-list">
        {#each timeZones as timeZone}
            <button 
                class="timezone-option"
                class:selected={currentSelection().id === timeZone.id && currentSelection().offset === timeZone.offset}
                onclick={() => selectTimeZone(timeZone)}
            >
                <div class="timezone-main">
                    <span class="timezone-label">{timeZone.id}</span>
                    {#if timeZone.offset}
                        <span class="timezone-offset">UTC{timeZone.offset}</span>
                    {/if}
                </div>
                <div class="timezone-description">{timeZone.description}</div>
            </button>
        {/each}
    </div>
</div>

<style lang="scss">
    .timezone-picker {
        min-width: 300px;
        max-width: 400px;
        background-color: var(--surface-0);
        border-radius: 5px;
        border: 2px solid var(--surface-1-border);
        overflow: hidden;

        display: flex;
        flex-direction: column;
    }

    .current-selection {
        padding: 0.75rem;
        background-color: var(--surface-1);
        border-bottom: 1px solid var(--surface-1-border);
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .selected-zone {
        font-weight: 600;
        color: var(--color-important-text);
        font-size: 1.1rem;
    }

    .selected-description {
        color: var(--subtle-text);
        font-size: 0.875rem;
    }

    .selected-offset {
        color: var(--blue-text);
        font-size: 0.875rem;
        font-family: var(--font-mono);
    }

    .timezone-list {
        max-height: 300px;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: var(--surface-1) var(--surface-0);
        
        &::-webkit-scrollbar {
            width: 6px;
        }
        
        &::-webkit-scrollbar-track {
            background: var(--surface-0);
        }
        
        &::-webkit-scrollbar-thumb {
            background: var(--surface-1);
            border-radius: 3px;
        }
    }

    .timezone-option {
        width: 100%;
        padding: 0.75rem;
        background: none;
        border: none;
        text-align: left;
        cursor: pointer;
        transition: background-color 150ms;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        
        &:hover {
            background-color: var(--subtle-background-highlight);
        }
        
        &.selected {
            background-color: var(--blue-background);
            
            .timezone-label {
                color: var(--color-text);
            }
            
            .timezone-offset {
                color: var(--color-text);
            }
            
            .timezone-description {
                color: var(--color-text);
                opacity: 0.8;
            }
        }
        
        &.selected:hover {
            background-color: var(--blue-background-hover);
        }
        
        &:focus-visible {
            outline: 2px solid var(--blue-text);
            outline-offset: -2px;
        }
    }

    .timezone-main {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }

    .timezone-label {
        font-weight: 600;
        color: var(--color-important-text);
        font-size: 1rem;
    }

    .timezone-offset {
        color: var(--blue-text);
        font-size: 0.875rem;
        font-family: var(--font-mono);
    }

    .timezone-description {
        color: var(--subtle-text);
        font-size: 0.875rem;
        line-height: 1.3;
    }
</style>