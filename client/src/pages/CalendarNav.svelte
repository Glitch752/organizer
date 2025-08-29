<script lang="ts">
    import { Temporal } from "@js-temporal/polyfill";
    import DatePicker from "../lib/datetime/DatePicker.svelte";
    import { makePlainDate, type PlainDateString } from "../lib/datetime/time";

    let day: PlainDateString = $state(makePlainDate(Temporal.Now.plainDateISO()));

    function goToToday() {
        day = makePlainDate(Temporal.Now.plainDateISO());
    }
</script>

<div class="content">
    <DatePicker bind:value={day} />
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