<script lang="ts">
    import { fly } from "svelte/transition";
    import { easeInOutQuad } from "../util/time";

    let { value = $bindable(), onchange, min = 1, max = 31 }: {
        value: number[],
        onchange: () => void,
        min?: number,
        max?: number
    } = $props();

    let inputValue = $state(formatNumbers(value));

    function formatNumbers(numbers: number[]): string {
        if(numbers.length === 0) return '';
        
        // Sort the numbers and group consecutive ones
        const sorted = [...numbers].sort((a, b) => a - b);
        const ranges: string[] = [];
        
        let start = sorted[0];
        let end = sorted[0];
        
        for(let i = 1; i <= sorted.length; i++) {
            if(i < sorted.length && sorted[i] === end + 1) {
                end = sorted[i];
            } else {
                if(start === end) {
                    ranges.push(start.toString());
                } else if(end === start + 1) {
                    ranges.push(`${start}, ${end}`);
                } else {
                    ranges.push(`${start}-${end}`);
                }
                if(i < sorted.length) {
                    start = sorted[i];
                    end = sorted[i];
                }
            }
        }
        
        return ranges.join(', ');
    }

    function parseInput(input: string): number[] {
        if(!input.trim()) return [];
        
        const numbers = new Set<number>();
        const parts = input.split(',').map(p => p.trim());
        
        for(const part of parts) {
            if(part.includes('-')) {
                const [startStr, endStr] = part.split('-').map(p => p.trim());
                const start = parseInt(startStr);
                const end = parseInt(endStr);
                
                if(!isNaN(start) && !isNaN(end)) {
                    for(let i = Math.min(start, end); i <= Math.max(start, end); i++) {
                        if(i >= min && i <= max) {
                            numbers.add(i);
                        }
                    }
                }
            } else {
                const num = parseInt(part);
                if(!isNaN(num) && num >= min && num <= max) {
                    numbers.add(num);
                }
            }
        }
        
        return Array.from(numbers).sort((a, b) => a - b);
    }

    function updatePreview() {
        const newValue = parseInput(inputValue);
        value = newValue;
    }

    let focused = $state(false);
</script>

<div class="number-list-input">
    <input
        type="text"
        bind:value={inputValue}
        oninput={updatePreview}
        onfocus={() => focused = true}
        onblur={() => focused = false}
        {onchange}
        placeholder={`${min}-${max} (e.g., "1, 3, 5-10")`}
    />
    {#if focused}
        <div
            class="preview" 
            transition:fly={{ duration: 150, easing: easeInOutQuad, y: 10 }}
        >
            {value.join(", ")}
        </div>
    {/if}
</div>

<style lang="scss">
    .number-list-input {
        display: inline-flex;
        position: relative;
    }

    input {
        min-width: 120px;
        font-size: 0.9rem;
    }

    .preview {
        position: absolute;
        top: 100%;
        left: 0;
        width: 100%;
        background-color: var(--surface-1);
        border: 2px solid var(--surface-1-border);
        border-top: none;
        border-radius: 0 0 5px 5px;
        padding: 0.25rem 0.5rem;
        font-size: 0.8rem;
        color: var(--subtle-text);
        z-index: 10;
    }
</style>