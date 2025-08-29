<script lang="ts">
    let { days = $bindable(), onchange }: {
        days: number[], // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        onchange: () => void
    } = $props();

    const weekdayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    function toggleDay(dayIndex: number) {
        if (days.includes(dayIndex)) {
            days = days.filter(d => d !== dayIndex);
        } else {
            days = [...days, dayIndex];
        }
        onchange();
    }
</script>

<div class="weekday-input">
    {#each weekdayLabels as label, index}
        <label class="weekday-checkbox" title={weekdayNames[index]}>
            <input 
                type="checkbox"
                class="no-border"
                checked={days.includes(index)}
                onchange={() => toggleDay(index)}
            />
            <span class="weekday-label">{label}</span>
        </label>
    {/each}
</div>

<style>
    .weekday-input {
        display: inline-flex;
        gap: 0.5rem;
        vertical-align: middle;
        flex-wrap: wrap;
    }

    .weekday-checkbox {
        position: relative;
        display: grid;
        place-items: center;
    }

    .weekday-checkbox input[type="checkbox"] {
        width: 2em;
        height: 2em;
        margin: 0;
    }

    .weekday-label {
        position: absolute;
        font-size: 0.875rem;
        font-weight: 600;
        pointer-events: none;
        color: var(--color-text);
    }

    .weekday-checkbox input[type="checkbox"]:checked + .weekday-label {
        color: var(--background);
    }
</style>