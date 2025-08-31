<script lang="ts">
    import { getPlainDate, updateDateString, type PlainDateString, type ZonedDateTimeString } from "../time";
    import InnerDatePicker from "./InnerDatePicker.svelte";

    let { value = $bindable(), onchange }: {
        value: ZonedDateTimeString | PlainDateString,
        onchange?: () => void
    } = $props();

    // Parse the current date value and convert to local timezone
    const plainDate = $derived(() => getPlainDate(value));

    function selectDate(year: number, month: number, day: number) {
        value = updateDateString(value, year, month, day);
        onchange?.();
    }
</script>

<InnerDatePicker date={plainDate()} {selectDate}></InnerDatePicker>