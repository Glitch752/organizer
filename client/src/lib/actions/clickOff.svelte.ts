/** Action for running a function when clicking outside of an element */
export function clickOff(element: HTMLElement, func: () => void) {
    function handleClick(event: MouseEvent) {
        if(!element.contains(event.target as Node)) {
            func();
            event.stopImmediatePropagation();
            event.preventDefault();
            document.removeEventListener('click', handleClick, true);
        }
    }

    $effect(() => {
        document.addEventListener('click', handleClick, true);
        return () => {
            document.removeEventListener('click', handleClick, true);
        };
    });
}