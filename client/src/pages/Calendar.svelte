<script lang="ts">
    import CalendarYearView from "../lib/calendar/CalendarYearView.svelte";
    import CalendarMonthView from "../lib/calendar/CalendarMonthView.svelte";
    import CalendarWeekView from "../lib/calendar/CalendarWeekView.svelte";
    import { calendarDisplay } from "../stores/calendar";
</script>

{#if $calendarDisplay.displayType === "year"}
    <CalendarYearView bind:display={$calendarDisplay} />
{:else if $calendarDisplay.displayType === "month"}
    <CalendarMonthView bind:display={$calendarDisplay} />
{:else}
    <CalendarWeekView bind:display={$calendarDisplay} />
{/if}