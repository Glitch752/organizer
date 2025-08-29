<script lang="ts">
    import { getPlainDate, updateDateString, type PlainDateString, type ZonedDateTimeString } from "./time";

    let { value = $bindable(), onchange }: {
        value: ZonedDateTimeString | PlainDateString,
        onchange?: () => void
    } = $props();

    // Parse the current date value and convert to local timezone
    const plainDate = $derived(() => getPlainDate(value));

    const currentYear = $derived(() => plainDate().year);
    /** NOTE: This is a 0-indexed month, unlike what Temporal uses. */
    const currentMonth = $derived(() => plainDate().month - 1);
    const currentDay = $derived(() => plainDate().day);

    let viewYear = $derived(currentYear());
    let viewMonth = $derived(currentMonth());

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const daysInPreviousMonth = $derived(new Date(viewYear, viewMonth, 0).getDate());
    const daysInMonth = $derived(new Date(viewYear, viewMonth + 1, 0).getDate());
    const firstDayOfMonth = $derived(new Date(viewYear, viewMonth, 1).getDay());
    
    // Generate calendar grid
    const calendarDays: {
        inMonth: boolean,
        day: number
    }[] = $derived.by(() => {
        const days: {
            inMonth: boolean,
            day: number
        }[] = [];
        
        // TODO: If clicking these out-of-month days, change to that month and select that day

        // Days before the first of the month (from the previous month)
        for(let i = firstDayOfMonth - 1; i >= 0; i--) {
            days.push({ inMonth: false, day: daysInPreviousMonth - i });
        }
        // Days in the current month
        for(let i = 1; i <= daysInMonth; i++) {
            days.push({ inMonth: true, day: i });
        }
        // Fill the rest of the grid to make a complete week (42 cells)
        while(days.length < 42) {
            days.push({ inMonth: false, day: days.length - daysInMonth - firstDayOfMonth + 1 });
        }
        
        return days;
    });

    function selectDate(day: number) {
        value = updateDateString(value, viewYear, viewMonth + 1, day);
        onchange?.();
    }

    function previousMonth() {
        if(viewMonth === 0) {
            viewMonth = 11;
            viewYear--;
        } else {
            viewMonth--;
        }
    }

    function nextMonth() {
        if(viewMonth === 11) {
            viewMonth = 0;
            viewYear++;
        } else {
            viewMonth++;
        }
    }

    // function goToToday() {
    //     const today = new Date();
    //     viewYear = today.getFullYear();
    //     viewMonth = today.getMonth();
    //     selectDate(today.getDate());
    // }
</script>

<div class="date-picker">
    <div class="header">
        <span class="month-year">{monthNames[viewMonth]} {viewYear}</span>
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
    
    <div class="days-grid">
        {#each calendarDays as day}
            <button 
                class="day"
                class:selected={viewYear === currentYear() && viewMonth === currentMonth() && day.inMonth && day.day === currentDay()}
                class:other-month={!day.inMonth}
                class:today={(() => {
                    const today = new Date();
                    return viewYear === today.getFullYear() && viewMonth === today.getMonth() && day.inMonth && day.day === today.getDate();
                })()}
                onclick={() => selectDate(day.day)}
            >
                {day.day}
            </button>
        {/each}
    </div>
    
    <!-- <div class="footer">
        <button onclick={goToToday} class="today-button blue">Today</button>
    </div> -->
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
            pointer-events: none;
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

    // .footer {
    //     display: flex;
    //     justify-content: center;

    //     .today-button {
    //         padding: 0.5em 0.75em;
    //         font-size: 0.875em;
    //     }
    // }
</style>