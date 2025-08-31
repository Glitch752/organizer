<script lang="ts">
    import { onMount } from "svelte";
    import { getPlainTime, getTimeZones, isPlainTime, isZonedDateTime, isZonedTime, makePlainTime, makeZonedDateTime, makeZonedTime, parseZonedDateTime, parseZonedTime, type PlainTimeString, type TimeZoneData, type ZonedDateTimeString, type ZonedTimeString } from "./time";

    let { value = $bindable(), onchange }: {
        value: ZonedDateTimeString | ZonedTimeString | PlainTimeString,
        onchange: () => void
    } = $props();

    // Common time zones with their offsets
    const timeZones: TimeZoneData[] = [
        ...(isZonedDateTime(value) ? [] : [{ id: "Local", offset: null, description: "Always use local time" }]),
        ...getTimeZones()
    ];

    // Determine current selection
    const currentSelection = $derived.by(() => {
        if(isPlainTime(value)) {
            return timeZones[0]; // "Local"
        }

        const zone = isZonedTime(value) ? parseZonedTime(value).zone : parseZonedDateTime(value).timeZoneId;
        const idMatch = timeZones.find(tz => tz.id === zone);
        if(idMatch) return idMatch;
        
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

    let search = $state("");

    // Scroll to the selected timezone on mount
    let timezoneListEl: HTMLDivElement;
    onMount(() => {
        const selectedEl = timezoneListEl.querySelector(".timezone-option.selected") as HTMLButtonElement;
        if(selectedEl) {
            const listRect = timezoneListEl.getBoundingClientRect();
            const selectedRect = selectedEl.getBoundingClientRect();
            if(selectedRect.top < listRect.top || selectedRect.bottom > listRect.bottom) {
                timezoneListEl.scrollTop =
                    selectedEl.offsetTop - timezoneListEl.offsetTop -
                    100 + (selectedEl.clientHeight / 2);
            }
        }
    });

    let collapsed = $state(true);
</script>

<div class="timezone-picker">
    <button class="current-selection" onclick={() => collapsed = !collapsed}>
        <span class="selected-zone">{currentSelection.id}</span>
        <span class="selected-description">{currentSelection.description}</span>
        {#if currentSelection.offset}
            <span class="selected-offset">UTC{currentSelection.offset}</span>
        {/if}
        <span class="collapse">{#if collapsed}▲{:else}▼{/if}</span>
    </button>

    <div
        class="options"
        class:collapsed
    >
        <input
            type="text"
            placeholder="Search time zones..."
            bind:value={search}
        />
        
        <div class="timezone-list" bind:this={timezoneListEl}>
            {#each timeZones.filter(tz =>
                tz.id.toLowerCase().includes(search.toLowerCase()) ||
                tz.description.toLowerCase().includes(search.toLowerCase())
            ) as timeZone}
                {@const selected = currentSelection.id === timeZone.id && currentSelection.offset === timeZone.offset}
                <button 
                    class="timezone-option"
                    class:selected
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
</div>

<style lang="scss">
    .timezone-picker {
        width: 300px;
        background-color: var(--surface-0);
        border-radius: 5px;
        border: 2px solid var(--surface-1-border);
        overflow: hidden;

        display: flex;
        flex-direction: column;
    }

    .current-selection {
        padding: 0.5rem 0.75rem;
        background-color: var(--surface-1);
        border-bottom: 1px solid var(--surface-1-border);
        display: grid;
        grid-template-columns: 1fr auto;
        grid-template-rows: auto auto auto;
        text-align: left;
        border: none;
        border-radius: 0;

        .selected-zone {
            font-weight: 600;
            color: var(--color-important-text);
            font-size: 1.1rem;
            grid-column: 1 / 2;
            grid-row: 1 / 2;
        }
    
        .selected-description {
            color: var(--subtle-text);
            font-size: 0.875rem;
            margin-bottom: 0.25rem;
            grid-column: 1 / 2;
            grid-row: 2 / 3;
        }
    
        .selected-offset {
            color: var(--blue-text);
            font-size: 0.875rem;
            font-family: var(--font-mono);
            white-space: nowrap;
            grid-column: 1 / 2;
            grid-row: 3 / 4;
        }

        .collapse {
            background: transparent;
            border: none;
            color: var(--subtle-text);
            font-size: 1rem;
            cursor: pointer;
            grid-column: 2 / 3;
            grid-row: 1 / 4;
            align-self: center;
        }
    }

    .options {
        display: flex;
        flex-direction: column;
        max-height: 300px;
        overflow: hidden;
        transition: max-height 250ms cubic-bezier(0.4, 0.0, 0.2, 1);

        &.collapsed {
            max-height: 0;
            padding: 0;
            pointer-events: none;
        }
    }

    input {
        border-radius: 0;
        background-color: var(--surface-0);
        border-color: transparent;
        border-bottom-color: var(--surface-1-border);
        border-width: 1px;
    }

    .timezone-list {
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
        white-space: nowrap;
    }

    .timezone-description {
        color: var(--subtle-text);
        font-size: 0.875rem;
        line-height: 1.3;
    }
</style>