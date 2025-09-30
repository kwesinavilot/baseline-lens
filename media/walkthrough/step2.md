# Understanding Compatibility Indicators

Baseline Lens uses simple visual indicators to show you the browser support status of web features:

## Indicator Meanings:

### ✅ Widely Available
- **Safe for production use**
- Supported across all major browsers
- Part of Baseline 2023 or earlier
- Example: `flexbox`, `grid`, `fetch()`

### ⚠️ Newly Available  
- **Recently became baseline**
- Supported in latest browsers but use with caution
- Part of Baseline 2024
- Example: `:has()`, `container queries`

### 🚫 Limited Support
- **Not yet baseline**
- Missing support in some major browsers
- Consider polyfills or alternatives
- Example: `@starting-style`, `view-transitions`

## Getting More Information:

**Hover over any indicator** to see:
- Detailed browser support breakdown
- Links to MDN documentation  
- Suggested alternatives or polyfills
- Timeline for when features became available

Try hovering over a feature indicator in your code to see this detailed information!