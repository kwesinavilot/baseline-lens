// Test TypeScript file with various baseline compatibility features

// Widely available TypeScript features - should show green checkmark
interface WidelyAvailable {
    name: string;
    age: number;
    isActive: boolean;
}

class BasicClass implements WidelyAvailable {
    constructor(
        public name: string,
        public age: number,
        public isActive: boolean = true
    ) {}

    greet(): string {
        return `Hello, ${this.name}!`;
    }
}

// Generic types - widely available
function identity<T>(arg: T): T {
    return arg;
}

// Union types - widely available
type StringOrNumber = string | number;

// Newly available TypeScript features - should show yellow warning
interface NewlyAvailable {
    readonly id: string;
    name?: string; // Optional properties
    [key: string]: any; // Index signatures
}

// Template literal types - newly available
type EventName<T extends string> = `on${Capitalize<T>}`;
type ButtonEvent = EventName<'click'>; // 'onClick'

// Conditional types - newly available
type NonNullable<T> = T extends null | undefined ? never : T;

// Mapped types - newly available
type Partial<T> = {
    [P in keyof T]?: T[P];
};

// Utility types - newly available
type PickedUser = Pick<WidelyAvailable, 'name' | 'age'>;
type OmittedUser = Omit<WidelyAvailable, 'isActive'>;

// Limited availability TypeScript features - should show red X
// Satisfies operator - limited availability
const config = {
    apiUrl: 'https://api.example.com',
    timeout: 5000,
    retries: 3
} satisfies Record<string, string | number>;

// Using keyword - limited availability
type EventHandler<T> = {
    bivarianceHack(event: T): void;
}['bivarianceHack'];

// Template literal patterns - limited availability
type Route = `/users/${string}` | `/posts/${string}`;

// Advanced type manipulation - various availability
namespace TypeManipulation {
    // Widely available
    export type User = {
        id: number;
        name: string;
        email: string;
    };

    // Newly available
    export type UserKeys = keyof User;
    export type UserValues = User[keyof User];

    // Limited availability
    export type DeepPartial<T> = {
        [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
    };
}

// Decorators - limited availability (experimental)
function logged(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
        console.log(`Calling ${propertyKey} with args:`, args);
        return originalMethod.apply(this, args);
    };
}

class DecoratedClass {
    @logged
    doSomething(value: string): string {
        return `Processed: ${value}`;
    }
}

// Async/await with types - widely available
async function fetchUser(id: number): Promise<WidelyAvailable> {
    const response = await fetch(`/api/users/${id}`);
    const userData = await response.json();
    return userData as WidelyAvailable;
}

// Generic constraints - newly available
interface Lengthwise {
    length: number;
}

function loggingIdentity<T extends Lengthwise>(arg: T): T {
    console.log(arg.length);
    return arg;
}

// Discriminated unions - newly available
type Shape = 
    | { kind: 'circle'; radius: number }
    | { kind: 'square'; sideLength: number }
    | { kind: 'rectangle'; width: number; height: number };

function getArea(shape: Shape): number {
    switch (shape.kind) {
        case 'circle':
            return Math.PI * shape.radius ** 2;
        case 'square':
            return shape.sideLength ** 2;
        case 'rectangle':
            return shape.width * shape.height;
    }
}

// Module augmentation - newly available
declare global {
    interface Window {
        myCustomProperty: string;
    }
}

// Namespace merging - widely available
namespace MergedNamespace {
    export const value1 = 'first';
}

namespace MergedNamespace {
    export const value2 = 'second';
}

// Export types and values
export {
    WidelyAvailable,
    NewlyAvailable,
    BasicClass,
    TypeManipulation,
    DecoratedClass,
    fetchUser,
    getArea,
    Shape
};

export type {
    StringOrNumber,
    EventName,
    NonNullable,
    Partial,
    PickedUser,
    OmittedUser,
    Route
};