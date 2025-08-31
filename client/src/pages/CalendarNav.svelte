<script lang="ts">
    import { Temporal } from "@js-temporal/polyfill";
    import InnerDatePicker from "../lib/datetime/calendarDatePicker/InnerDatePicker.svelte";
    import { calendarDisplay } from "../stores/calendar";

    let date = $state(Temporal.PlainDate.from($calendarDisplay.selectedDay));
    $effect(() => {
        calendarDisplay.update(display => ({
            ...display,
            selectedDay: {
                year: date.year,
                month: date.month,
                day: date.day
            }
        }));
    });
    calendarDisplay.subscribe(display => {
        const newDate = Temporal.PlainDate.from(display.selectedDay);
        if(Temporal.PlainDate.compare(newDate, date) !== 0) {
            date = newDate;
        }
    });

    function goToToday() {
        date = Temporal.Now.plainDateISO();
    }

    function selectDate(year: number, month: number, day: number) {
        date = Temporal.PlainDate.from({ year, month, day });
    }
</script>

<div class="content">
    <InnerDatePicker {date} {selectDate} />
    <button onclick={goToToday} class="today-button blue">Today</button>
</div>

<style>
    .content {
        display: flex;
        flex-direction: column;
        align-items: center;
        font-size: 1rem;
    }
    .today-button {
        margin-top: 0.5rem;
        padding: 0.25rem 0.75rem;
    }
</style>