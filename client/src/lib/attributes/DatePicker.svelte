<script lang="ts">
    import type { DateOnly, DateTime } from ".";

    let { value = $bindable(), onchange }: {
        value: DateTime | DateOnly,
        onchange: () => void
    } = $props();

    // Parse the current date value and convert to local timezone
    const currentLocalDate = $derived(() => {
        if(value.includes('T')) {
            // DateTime format - parse as UTC and convert to local
            return new Date(value);
        } else {
            // DateOnly format - treat as local date (avoid timezone issues)
            const [year, month, day] = value.split('-').map(Number);
            return new Date(year, month - 1, day);
        }
    });

    const currentYear = $derived(() => currentLocalDate().getFullYear());
    const currentMonth = $derived(() => currentLocalDate().getMonth());
    const currentDay = $derived(() => currentLocalDate().getDate());

    let viewYear = $state(0);
    let viewMonth = $state(0);

    $effect(() => {
        viewYear = currentYear();
        viewMonth = currentMonth();
    });

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
        if(value.includes('T')) {
            // DateTime format - preserve the time portion and create new date in local timezone
            const originalDate = new Date(value);
            const newDate = new Date(viewYear, viewMonth, day, 
                                   originalDate.getHours(), originalDate.getMinutes(), originalDate.getSeconds(), originalDate.getMilliseconds());
            value = newDate.toISOString();
        } else {
            // DateOnly format - create local date and format as YYYY-MM-DD
            const newDate = new Date(viewYear, viewMonth, day);
            const year = newDate.getFullYear();
            const month = (newDate.getMonth() + 1).toString().padStart(2, '0');
            const dayStr = newDate.getDate().toString().padStart(2, '0');
            value = `${year}-${month}-${dayStr}`;
        }
        
        onchange();
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
        <button onclick={previousMonth} class="nav-button" title="Previous month">‹</button>
        <div class="month-year">
            <span class="month">{monthNames[viewMonth]}</span>
            <span class="year">{viewYear}</span>
        </div>
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

    .month-year {
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

    .year {
        font-size: 0.875rem;
        color: var(--subtle-text);
    }

    .day-headers {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 1px;
    }
    .day-header {
        text-align: center;
        font-size: 0.75rem;
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
        font-size: 0.875rem;
        cursor: pointer;
        border: 1px solid transparent;
        background: none;
        color: var(--color-text);
        border-radius: 3px;
        transition: all 150ms;
        min-height: 2rem;
    
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
    //         padding: 0.375rem 0.75rem;
    //         font-size: 0.875rem;
    //     }
    // }
</style>