// Test JavaScript file with various baseline compatibility features

// Widely available features - should show green checkmark
const widelyAvailable = {
    // Arrow functions
    greet: (name) => `Hello, ${name}!`,
    
    // Template literals
    message: `This is a template literal`,
    
    // Destructuring
    // [first, second] = [1, 2],
    
    // Spread operator
    numbers: [1, 2, 3],
    moreNumbers: [...numbers, 4, 5, 6],
    
    // Promises
    fetchData: () => {
        return new Promise((resolve, reject) => {
            setTimeout(() => resolve('data'), 1000);
        });
    }
};

// Newly available features - should show yellow warning
class NewlyAvailable {
    // Private fields
    #privateField = 'secret';
    
    // Static blocks
    static {
        console.log('Static initialization block');
    }
    
    // Optional chaining
    getValue(obj) {
        return obj?.property?.nested?.value;
    }
    
    // Nullish coalescing
    getValueWithDefault(value) {
        return value ?? 'default';
    }
    
    // Logical assignment operators
    updateValue(obj, newValue) {
        obj.value ??= newValue;
        obj.count ||= 0;
        obj.enabled &&= true;
    }
}

// Limited availability features - should show red X
class LimitedAvailability {
    // Top-level await (in modules)
    async initializeData() {
        // This would be top-level await in a module
        // const data = await fetch('/api/data');
        return 'initialized';
    }
    
    // Import assertions (limited support)
    async loadJSON() {
        // const data = await import('./data.json', { assert: { type: 'json' } });
        return {};
    }
    
    // Temporal API (very limited)
    getCurrentTime() {
        // return Temporal.Now.instant();
        return new Date();
    }
}

// Array methods - various availability
const arrayMethods = {
    // Widely available
    map: [1, 2, 3].map(x => x * 2),
    filter: [1, 2, 3, 4].filter(x => x > 2),
    reduce: [1, 2, 3].reduce((a, b) => a + b, 0),
    
    // Newly available
    flat: [1, [2, 3], [4, [5]]].flat(2),
    flatMap: [1, 2, 3].flatMap(x => [x, x * 2]),
    
    // Limited availability
    findLast: [1, 2, 3, 4].findLast(x => x > 2),
    findLastIndex: [1, 2, 3, 4].findLastIndex(x => x > 2)
};

// Object methods - various availability
const objectMethods = {
    // Widely available
    assign: Object.assign({}, {a: 1}, {b: 2}),
    keys: Object.keys({a: 1, b: 2}),
    values: Object.values({a: 1, b: 2}),
    
    // Newly available
    entries: Object.entries({a: 1, b: 2}),
    fromEntries: Object.fromEntries([['a', 1], ['b', 2]]),
    
    // Limited availability
    hasOwn: Object.hasOwn({a: 1}, 'a')
};

// String methods - various availability
const stringMethods = {
    // Widely available
    includes: 'hello world'.includes('world'),
    startsWith: 'hello world'.startsWith('hello'),
    endsWith: 'hello world'.endsWith('world'),
    
    // Newly available
    padStart: 'hello'.padStart(10, '0'),
    padEnd: 'hello'.padEnd(10, '0'),
    
    // Limited availability
    replaceAll: 'hello world world'.replaceAll('world', 'universe'),
    at: 'hello'.at(-1)
};

// Web APIs - various availability
const webAPIs = {
    // Widely available
    fetch: () => fetch('/api/data'),
    localStorage: () => localStorage.getItem('key'),
    
    // Newly available
    intersectionObserver: new IntersectionObserver(() => {}),
    resizeObserver: new ResizeObserver(() => {}),
    
    // Limited availability
    // broadcastChannel: new BroadcastChannel('channel'),
    // webLocks: navigator.locks?.request('resource', () => {})
};

// Modern JavaScript features
async function modernFeatures() {
    // Dynamic imports - newly available
    const module = await import('./other-module.js');
    
    // BigInt - newly available
    const bigNumber = 123n;
    
    // WeakRef - limited availability
    // const weakRef = new WeakRef(someObject);
    
    // FinalizationRegistry - limited availability
    // const registry = new FinalizationRegistry(() => {});
}

// Export for module usage
export { widelyAvailable, NewlyAvailable, LimitedAvailability };