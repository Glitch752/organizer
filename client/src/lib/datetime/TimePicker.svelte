<script lang="ts">
    import { Temporal } from "@js-temporal/polyfill";
    import { getPlainTime, updateTimeString, type PlainTimeString, type ZonedDateTimeString, type ZonedTimeString } from "./time";

    let { value = $bindable(), onchange }: {
        value: ZonedDateTimeString | ZonedTimeString | PlainTimeString,
        onchange: () => void
    } = $props();

    const currentLocalTime = $derived(getPlainTime(value));
    const currentHour = $derived(currentLocalTime.hour);
    const currentMinute = $derived(currentLocalTime.minute);
    const currentSecond = $derived(currentLocalTime.second);

    // svelte-ignore state_referenced_locally Intentional
    let selectedHour = $state(currentHour);
    // svelte-ignore state_referenced_locally Intentional
    let selectedMinute = $state(currentMinute);
    // svelte-ignore state_referenced_locally Intentional
    let selectedSecond = $state(currentSecond);
    let editingField = $state<'hour' | 'minute' | 'second' | null>(null);

    function updateTime() {
        value = updateTimeString(value, selectedHour, selectedMinute, selectedSecond);
        
        onchange();
    }

    function adjustTime(field: 'hour' | 'minute' | 'second', delta: number) {
        if(field === 'hour') {
            selectedHour = Math.max(0, Math.min(23, selectedHour + delta));
        } else if(field === 'minute') {
            let newMinute = selectedMinute + delta;
            if(newMinute >= 60) {
                selectedHour = Math.min(23, selectedHour + Math.floor(newMinute / 60));
                newMinute = newMinute % 60;
            } else if(newMinute < 0) {
                const hourDecrease = Math.ceil(Math.abs(newMinute) / 60);
                selectedHour = Math.max(0, selectedHour - hourDecrease);
                newMinute = 60 + (newMinute % 60);
                if (newMinute === 60) newMinute = 0;
            }
            selectedMinute = newMinute;
        } else if(field === 'second') {
            selectedSecond = Math.max(0, Math.min(59, selectedSecond + delta));
        }
        updateTime();
    }

    function setToNow() {
        const now = Temporal.Now.plainDateTimeISO();
        selectedHour = now.hour;
        selectedMinute = now.minute;
        selectedSecond = now.second;
        updateTime();
    }

    function setToMidnight() {
        selectedHour = 0;
        selectedMinute = 0;
        selectedSecond = 0;
        updateTime();
    }

    function setToNoon() {
        selectedHour = 12;
        selectedMinute = 0;
        selectedSecond = 0;
        updateTime();
    }

    function handleFieldInput(field: 'hour' | 'minute' | 'second', event: Event) {
        const target = event.target as HTMLInputElement;
        const value = parseInt(target.value);
        
        if(!isNaN(value)) {
            if(field === 'hour' && value >= 0 && value <= 23) {
                selectedHour = value;
            } else if(field === 'minute' && value >= 0 && value <= 59) {
                selectedMinute = value;
            } else if(field === 'second' && value >= 0 && value <= 59) {
                selectedSecond = value;
            }
            updateTime();
        }
    }

    function handleFieldClick(field: 'hour' | 'minute' | 'second') {
        return (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            editingField = field;
        };
    }

    function handleFieldBlur() {
        editingField = null;
    }

    function format12Hour(hour: number) {
        if(hour === 0) return '12 AM';
        if(hour < 12) return `${hour} AM`;
        if(hour === 12) return '12 PM';
        return `${hour - 12} PM`;
    }
</script>

<div class="time-picker">
    <div class="time-controls">
        <button onclick={() => adjustTime('minute', -15)} class="adjust-button" title="Subtract 15 minutes">-15m</button>
        <span class="time-12h">{format12Hour(selectedHour)}</span>
        <button onclick={() => adjustTime('minute', 15)} class="adjust-button" title="Add 15 minutes">+15m</button>
    </div>

    <div class="time-fields">
        {#if editingField === 'hour'}
            <!-- svelte-ignore a11y_autofocus Should I do this? Not sure but whatever for now -->
            <input 
                type="number" 
                min="0" 
                max="23" 
                value={selectedHour}
                oninput={(e) => handleFieldInput('hour', e)}
                onblur={handleFieldBlur}
                class="time-input"
                autofocus
            />
        {:else}
            <button onclick={handleFieldClick('hour')} class="time-field">
                {selectedHour.toString().padStart(2, '0')}
            </button>
        {/if}
        <span class="separator">:</span>
        {#if editingField === 'minute'}
            <!-- svelte-ignore a11y_autofocus Should I do this? Not sure but whatever for now -->
            <input 
                type="number" 
                min="0" 
                max="59" 
                value={selectedMinute}
                oninput={(e) => handleFieldInput('minute', e)}
                onblur={handleFieldBlur}
                class="time-input"
                autofocus
            />
        {:else}
            <button onclick={handleFieldClick('minute')} class="time-field">
                {selectedMinute.toString().padStart(2, '0')}
            </button>
        {/if}
        <span class="separator">:</span>
        {#if editingField === 'second'}
            <!-- svelte-ignore a11y_autofocus Should I do this? Not sure but whatever for now -->
            <input 
                type="number" 
                min="0" 
                max="59" 
                value={selectedSecond}
                oninput={(e) => handleFieldInput('second', e)}
                onblur={handleFieldBlur}
                class="time-input"
                autofocus
            />
        {:else}
            <button onclick={handleFieldClick('second')} class="time-field secondary">
                {selectedSecond.toString().padStart(2, '0')}
            </button>
        {/if}
    </div>

    <div class="quick-actions">
        <button onclick={setToNow} class="quick-button blue">Now</button>
        <button onclick={setToMidnight} class="quick-button">Midnight</button>
        <button onclick={setToNoon} class="quick-button">Noon</button>
    </div>
</div>

<style lang="scss">
    .time-picker {
        background-color: var(--surface-0);
        border-radius: 5px;
        min-width: 280px;

        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .time-12h {
        display: block;
        color: var(--subtle-text);
    }

    .time-controls {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .adjust-button {
        font-size: 0.875rem;
        padding: 0.25rem 0.75rem;
    }

    input::-webkit-inner-spin-button,
    input::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    input[type=number] {
        -moz-appearance: textfield;
        appearance: textfield;
    }

    .time-fields {
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--surface-1);
        border: 2px solid var(--surface-1-border);
        border-radius: 5px;
        padding: 0 0.5rem;
        font-family: var(--font-mono);
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--color-important-text);
    }

    .time-field {
        background: none;
        border: none;
        color: inherit;
        font-family: inherit;
        font-size: inherit;
        font-weight: inherit;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 3px;
        transition: background-color 150ms, color 150ms;
        width: 3ch;
        height: 3ch;
        text-align: center;
        
        &:hover {
            background-color: var(--subtle-background-highlight);
        }
        &:focus-visible {
            outline: 2px solid var(--blue-text);
            outline-offset: 2px;
        }
        &.secondary {
            color: var(--subtle-text);
        }
        &.secondary:hover {
            color: var(--color-text);
        }
    }

    .time-input {
        background: var(--surface-0);
        border: 1px solid var(--blue-text);
        border-radius: 3px;
        color: var(--color-important-text);
        font-family: inherit;
        font-size: inherit;
        font-weight: inherit;
        width: 3ch;
        height: 3ch;
        text-align: center;
        outline: none;
    }

    .separator {
        margin: 0 0.25rem;
        color: var(--subtle-text);
    }

    .quick-actions {
        display: flex;
        gap: 0.5rem;

        .quick-button {
            padding: 0.375rem 0.75rem;
            font-size: 0.875rem;
            flex-grow: 1;
        }
    }
</style>
