<script lang="ts">
    let { months = $bindable(), onchange }: {
        months: number[], // 1 = January, 2 = February, ..., 12 = December
        onchange: () => void
    } = $props();

    const monthLabels = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    function toggleMonth(monthIndex: number) {
        if(months.includes(monthIndex)) {
            months = months.filter(m => m !== monthIndex);
        } else {
            months = [...months, monthIndex];
        }
        onchange();
    }
</script>

<div class="month-input">
    {#each monthLabels as label, index}
        <label class="month-checkbox" title={monthNames[index]}>
            <input 
                type="checkbox"
                class="no-border"
                checked={months.includes(index + 1)}
                onchange={() => toggleMonth(index + 1)}
            />
            <span class="month-label">{label}</span>
        </label>
    {/each}
</div>

<style>
    .month-input {
        display: inline-flex;
        gap: 0.5rem;
        vertical-align: middle;
        flex-wrap: wrap;
    }

    .month-checkbox {
        position: relative;
        display: grid;
        place-items: center;
    }

    .month-checkbox input[type="checkbox"] {
        width: 2em;
        height: 2em;
        margin: 0;
    }

    .month-label {
        position: absolute;
        font-size: 0.875rem;
        font-weight: 600;
        pointer-events: none;
        color: var(--color-text);
    }

    .month-checkbox input[type="checkbox"]:checked + .month-label {
        color: var(--background);
    }
</style>