<script lang="ts">
    import { EventConditionType, type EventCondition } from "@shared/connection/attributes";
    import RecurrenceCondition from "./RecurrenceCondition.svelte";

    let { conditions = $bindable(), lastSeparator, onchange }: {
        conditions: EventCondition[],
        lastSeparator: string,
        onchange: () => void
    } = $props();
</script>

{#each conditions as _condition, i}
    <div>
        <button onclick={() => {
            conditions.splice(i, 1);
            onchange();
        }} disabled={conditions.length === 1} title="Remove">-</button>

    <RecurrenceCondition bind:condition={conditions[i]} {onchange} />{
        (i < conditions.length - 1 && conditions.length > 2) ? ", " : " "
    }{
        i === conditions.length - 2 ? lastSeparator : ""
    }
    </div>
{/each}

<div>
    <button onclick={() => {
        conditions.push({ type: EventConditionType.True });
        onchange();
    }} title="Add condition" class="blue">+ Add condition</button>
</div>