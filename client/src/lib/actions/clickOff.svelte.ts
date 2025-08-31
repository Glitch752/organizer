/** Global stack to track elements with clickOff action */
const clickOffStack: Array<{
    element: HTMLElement;
    func: () => void;
}> = [];

/** Global click handler */
function handleGlobalClick(event: MouseEvent) {
    // Process from top of the stack down (most recently added first)
    for(let i = clickOffStack.length - 1; i >= 0; i--) {
        const { element, func } = clickOffStack[i];
        
        if(!element.contains(event.target as Node)) {
            func();
            event.stopImmediatePropagation();
            event.preventDefault();
            break;
        }
    }
}

// Track if handler is active
let isHandlerActive = false;

/** Action for running a function when clicking outside of an element */
export function clickOff(element: HTMLElement, func: () => void) {
    $effect(() => {
        clickOffStack.push({ element, func });
        
        if(!isHandlerActive) {
            document.addEventListener('click', handleGlobalClick, true);
            isHandlerActive = true;
        }
        
        return () => {
            // Remove this element from the stack
            const index = clickOffStack.findIndex(item => item.element === element);
            if(index !== -1) {
                clickOffStack.splice(index, 1);
            }
            
            // Remove handler if stack is empty
            if(clickOffStack.length === 0 && isHandlerActive) {
                document.removeEventListener('click', handleGlobalClick, true);
                isHandlerActive = false;
            }
        };
    });
}