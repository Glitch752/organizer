export function deepEqual(a: any, b: any): boolean {
    if(a === b) return true;
    
    if(typeof a !== typeof b) return false;
    if(typeof a !== 'object' || a === null || b === null) return false;
    
    if(Array.isArray(a)) {
        if(!Array.isArray(b) || a.length !== b.length) return false;
        for(let i = 0; i < a.length; i++) {
            if(!deepEqual(a[i], b[i])) return false;
        }
        return true;
    }
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    
    if(aKeys.length !== bKeys.length) return false;
    for(const key of aKeys) {
        if(!b.hasOwnProperty(key) || !deepEqual(a[key], b[key])) return false;
    }
    return true;
}