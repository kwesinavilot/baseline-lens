# Baseline Lens Test Files

This folder contains test files for manually testing the Baseline Lens extension's UI service functionality.

## Test Files

### `test.css`
Contains CSS features with different baseline statuses:
- **Widely Available** (✅): `display: flex`, `background-color`, `border-radius`, `box-shadow`, CSS Grid, Custom Properties
- **Newly Available** (⚠️): `container-type`, `aspect-ratio`, `gap`, CSS Logical Properties, CSS Nesting, Container Queries, Cascade Layers
- **Limited Availability** (🚫): `view-transition-name`, `anchor-name`, `position-anchor`, CSS Subgrid

### `test.js`
Contains JavaScript features with different baseline statuses:
- **Widely Available** (✅): Arrow functions, Template literals, Destructuring, Spread operator, Promises
- **Newly Available** (⚠️): Private fields, Optional chaining, Nullish coalescing, Array methods like `flat()`, `flatMap()`
- **Limited Availability** (🚫): Top-level await, Import assertions, Temporal API, `findLast()`, `Object.hasOwn()`

### `test.html`
Contains HTML features with different baseline statuses:
- **Widely Available** (✅): Semantic elements (`main`, `section`, `article`, `header`, `footer`)
- **Newly Available** (⚠️): `<dialog>`, `<details>`, `<picture>`, various input types
- **Limited Availability** (🚫): `<search>`, Custom elements, Web Components

### `test.ts`
Contains TypeScript features with different baseline statuses:
- **Widely Available** (✅): Basic interfaces, classes, generics, union types
- **Newly Available** (⚠️): Template literal types, conditional types, mapped types, utility types
- **Limited Availability** (🚫): `satisfies` operator, advanced template literal patterns, decorators

## How to Test

1. **Start the Extension**: Press `F5` in VS Code to launch the Extension Development Host
2. **Open Test Files**: Open any of the test files in the new VS Code window
3. **Check Diagnostics**: Look at the Problems panel (View → Problems) to see compatibility diagnostics
4. **Check Decorations**: Look for inline indicators (✅, ⚠️, 🚫) next to code features
5. **Hover for Details**: Hover over features to see detailed compatibility information

## Expected Behavior

- **Green checkmarks (✅)**: Features with wide browser support
- **Yellow warnings (⚠️)**: Features with limited support that may need fallbacks
- **Red X marks (🚫)**: Features with poor support that should be avoided or polyfilled
- **Problems Panel**: Should show diagnostics with appropriate severity levels
- **Hover Messages**: Should display detailed browser support information

## Troubleshooting

If you don't see any indicators:
1. Make sure the extension is activated (check the Extension Host console)
2. Verify the file language is detected correctly (bottom right of VS Code)
3. Check that analyzers are registered for the file type
4. Look for any errors in the Developer Console (Help → Toggle Developer Tools)