<script lang="ts">
    import { parsePlainMonthDay, makePlainMonthDay, type PlainMonthDayString } from "./time";
    import { Temporal } from "@js-temporal/polyfill";

    let { value = $bindable(), onchange }: {
        value: PlainMonthDayString,
        onchange: () => void
    } = $props();

    // Parse the current PlainMonthDay value
    const currentMonthDay = $derived(parsePlainMonthDay(value));

    /** NOTE: This is a 0-indexed month, unlike what Temporal uses. */
    const currentMonth = $derived(currentMonthDay.toPlainDate({ year: 2024 }).month - 1);
    const currentDay = $derived(currentMonthDay.day);

    // svelte-ignore state_referenced_locally Intentional
    let viewMonth = $state(currentMonth);

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Get the current month/day for highlighting "today"
    const today = $derived.by(() => {
        const now = Temporal.Now.plainDateISO();
        return { month: now.month - 1, day: now.day };
    });

    const daysInMonth = $derived.by(() => {
        const referenceYear = 2024; // Use a leap year to handle February correctly
        return Temporal.PlainDate.from({ year: referenceYear, month: viewMonth + 1, day: 1 }).daysInMonth;
    });

    function selectDate(day: number) {
        value = makePlainMonthDay(Temporal.PlainMonthDay.from({ month: viewMonth + 1, day }));
        onchange();
    }

    function previousMonth() {
        viewMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    }

    function nextMonth() {
        viewMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    }
</script>

<div class="month-day-picker">
    <div class="header">
        <button onclick={previousMonth} class="nav-button" title="Previous month">‹</button>
        <div class="month-display">
            <span class="month">{monthNames[viewMonth]}</span>
        </div>
        <button onclick={nextMonth} class="nav-button" title="Next month">›</button>
    </div>
    
    <div class="days-grid">
        {#each Array.from({ length: daysInMonth }, (_, i) => i + 1) as day}
            <button 
                class="day"
                class:selected={viewMonth === currentMonth && day === currentDay}
                class:today={viewMonth === today.month && day === today.day}
                onclick={() => selectDate(day)}
            >
                {day}
            </button>
        {/each}
    </div>
</div>

<style lang="scss">
    .month-day-picker {
        min-width: 280px;
        width: fit-content;
        padding: 0.5rem;
        display: flex;
        flex-direction: column;
    }

    .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
    }
    
    .nav-button {
        font-size: 1.25rem;
        width: 2rem;
        height: 2rem;
        border-radius: 3px;
    }

    .nav-button:hover {
        background-color: var(--surface-1);
        border-color: var(--blue-text);
    }

    .month-display {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.125rem;
    }

    .month {
        font-weight: 600;
        font-size: 1.1rem;
        color: var(--color-important-text);
    }

    .days-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 2px;
    }

    .day {
        aspect-ratio: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.875rem;
        cursor: pointer;
        border: 1px solid transparent;
        background: none;
        color: var(--color-text);
        border-radius: 3px;
        transition: all 150ms;
        min-height: 2rem;

        &:hover {
            background-color: var(--subtle-background-highlight);
            border-color: var(--surface-1-border);
        }
        
        &.selected {
            background-color: var(--blue-background);
            border-color: var(--blue-background);
            color: var(--color-text);
        }
        
        &.selected:hover {
            background-color: var(--blue-background-hover);
            border-color: var(--blue-background-hover);
        }
        
        &.today {
            border-color: var(--blue-text);
            color: var(--blue-text);
        }
        
        &.today.selected {
            border-color: var(--blue-background);
            color: var(--color-text);
        }
    }
</style>
