<script lang="ts">
    import { Temporal } from "@js-temporal/polyfill";

    let {
        date,
        selectDate
    }: {
        date: Temporal.PlainDate,
        selectDate: (year: number, month: number, day: number) => void
    } = $props();

    const currentYear = $derived(() => date.year);
    /** 1-indexed like in Temporal, not Date. */
    const currentMonth = $derived(() => date.month);
    const currentDay = $derived(() => date.day);

    let viewYear = $derived(date.year);
    /** 1-indexed like in Temporal, not Date. */
    let viewMonth = $derived(date.month);

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const daysInPreviousMonth = $derived(() =>
        Temporal.PlainDate.from({ year: viewYear, month: viewMonth, day: 1 }).subtract({ months: 1 }).daysInMonth
    );

    const daysInMonth = $derived(() =>
        Temporal.PlainDate.from({ year: viewYear, month: viewMonth, day: 1 }).daysInMonth
    );

    const firstDayOfMonth = $derived(() => {
        const date = Temporal.PlainDate.from({ year: viewYear, month: viewMonth, day: 1 });
        return date.dayOfWeek % 7; // Temporal: 1=Monday, 7=Sunday; JS: 0=Sunday
    });
 
    function previousMonth() {
        if(viewMonth === 1) {
            viewMonth = 12;
            viewYear--;
        } else {
            viewMonth--;
        }
    }

    function nextMonth() {
        if(viewMonth === 12) {
            viewMonth = 1;
            viewYear++;
        } else {
            viewMonth++;
        }
    }
</script>

<div class="date-picker">
    <div class="header">
        <span class="month-year">{monthNames[viewMonth - 1]} {viewYear}</span>
        <button onclick={previousMonth} class="nav-button" title="Previous month">‹</button>
        <button onclick={nextMonth} class="nav-button" title="Next month">›</button>
    </div>
    
    <div class="day-headers">
        <div class="day-header">Su</div>
        <div class="day-header">Mo</div>
        <div class="day-header">Tu</div>
        <div class="day-header">We</div>
        <div class="day-header">Th</div>
        <div class="day-header">Fr</div>
        <div class="day-header">Sa</div>
    </div>
    
    <!-- Rerender the grid when the year or month changes so animations aren't funky -->
    {#key viewYear + "-" + viewMonth}
        <div class="days-grid">
            {#snippet dayButton(year: number, month: number, day: number)}
                <button
                    class="day"
                    class:selected={viewYear === currentYear() && month === currentMonth() && day === currentDay()}
                    class:other-month={month !== viewMonth}
                    class:today={(() => {
                        const today = Temporal.Now.plainDateISO();
                        return viewYear === today.year && month === today.month && day === today.day;
                    })()}
                    onclick={() => selectDate(year, month, day)}
                >
                    {day}
                </button>
            {/snippet}

            {#each Array(firstDayOfMonth()).fill(0).map((_, i) => daysInPreviousMonth() - firstDayOfMonth() + 1 + i) as day}
                {@render dayButton(viewMonth === 1 ? viewYear - 1 : viewYear, viewMonth === 1 ? 12 : viewMonth - 1, day)}
            {/each}

            {#each Array(daysInMonth()).fill(0).map((_, i) => i + 1) as day}
                {@render dayButton(viewYear, viewMonth, day)}
            {/each}

            {#each Array(42 - (firstDayOfMonth() + daysInMonth())).fill(0).map((_, i) => i + 1) as day}
                {@render dayButton(viewMonth === 12 ? viewYear + 1 : viewYear, viewMonth === 12 ? 1 : viewMonth + 1, day)}
            {/each}
        </div>
    {/key}
</div>

<style lang="scss">
    .date-picker {
        min-width: 17.5em;
        width: fit-content;
        display: flex;
        flex-direction: column;
    }

    .header {
        display: flex;
        align-items: center;
        margin-bottom: 0.5em;
        padding: 0 0.5em;
        gap: 0.5em;
    }
    .nav-button {
        font-size: 1.25em;
        width: 1.5em;
        height: 1.5em;
        border-radius: 3px;
    }

    .nav-button:hover {
        background-color: var(--surface-1);
        border-color: var(--blue-text);
    }

    .month-year {
        font-weight: 600;
        font-size: 1.1em;
        color: var(--color-important-text);
        flex: 1;
    }

    .day-headers {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 1px;
    }
    .day-header {
        text-align: center;
        font-size: 0.75em;
        color: var(--subtle-text);
        font-weight: 600;
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
        font-size: 0.875em;
        cursor: pointer;
        border: 1px solid transparent;
        background: none;
        color: var(--color-text);
        border-radius: 3px;
        transition: all 150ms;
        min-height: 2.5em;
    
        &.other-month {
            color: var(--subtle-text);
            opacity: 0.5;
        }

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