# Baseline Lens User Guide

## Table of Contents
- [Installation](#installation)
- [Getting Started](#getting-started)
- [Features Overview](#features-overview)
- [Understanding Compatibility Indicators](#understanding-compatibility-indicators)
- [Using Hover Information](#using-hover-information)
- [Working with Diagnostics](#working-with-diagnostics)
- [Configuration Options](#configuration-options)
- [Commands](#commands)
- [Supported File Types](#supported-file-types)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Installation

### From VS Code Marketplace
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Baseline Lens"
4. Click "Install"

### From VSIX Package
1. Download the `.vsix` file
2. Open VS Code
3. Go to Extensions view
4. Click "..." menu → "Install from VSIX..."
5. Select the downloaded file

## Getting Started

Once installed, Baseline Lens automatically activates when you open supported file types:
- CSS, SCSS, SASS, Less
- JavaScript, TypeScript
- HTML, Vue, Svelte
- JSX, TSX (React)

No additional setup is required - the extension works out of the box with the latest web-features dataset.

## Features Overview

### 🎯 Real-Time Analysis
Baseline Lens continuously analyzes your code as you type, detecting modern web features and their compatibility status.

### 📊 Inline Indicators
Visual indicators appear next to web features in your code:
- ✅ Widely available (safe to use)
- ⚠️ Newly available (use with caution)
- 🚫 Limited availability (consider alternatives)

### 💡 Rich Hover Information
Hover over any detected feature to see detailed compatibility information, browser support breakdown, and helpful links.

### 🔍 Problems Panel Integration
Compatibility issues appear in VS Code's Problems panel with actionable information and quick fixes.

### 📋 Project Reports
Generate comprehensive compatibility reports for your entire project.

## Understanding Compatibility Indicators

### ✅ Widely Available
**What it means**: This feature has broad browser support and is safe to use in production.

**Typical features**:
- Flexbox (`display: flex`)
- CSS Transitions (`transition`)
- Promises (`new Promise()`)
- Fetch API (`fetch()`)

**Action**: Use confidently in production code.

### ⚠️ Newly Available
**What it means**: This feature is supported in modern browsers but may need fallbacks for older versions.

**Typical features**:
- CSS Grid (`display: grid`)
- Optional Chaining (`obj?.prop`)
- CSS `gap` property
- `Array.prototype.at()`

**Action**: Consider providing fallbacks or progressive enhancement.

### 🚫 Limited Availability
**What it means**: This feature has limited browser support and may not work for all users.

**Typical features**:
- CSS Container Queries (`@container`)
- Top-level `await`
- CSS `:has()` selector
- Web Share API (`navigator.share()`)

**Action**: Use polyfills, alternatives, or feature detection.

## Using Hover Information

### Accessing Hover Information
1. Position your cursor over any detected web feature
2. Wait for the hover tooltip to appear (or press Ctrl+K Ctrl+I / Cmd+K Cmd+I)

### Hover Content Sections

#### 📊 Baseline Status
- Current compatibility status
- Baseline dates (when feature became available)
- Status explanation and recommendations

#### 🌐 Browser Support
- Detailed browser version support table
- Support status for major browsers
- Version numbers and notes

#### 💡 What This Means
- Educational context about the feature's status
- Practical advice for using the feature
- Risk assessment and recommendations

#### 🔗 Quick Links
- MDN Documentation
- Specification links
- Can I Use compatibility tables
- Polyfill resources

#### 💭 Recommendations
- Best practices for using the feature
- Alternative approaches
- Progressive enhancement strategies

## Working with Diagnostics

### Problems Panel
Compatibility issues appear in VS Code's Problems panel (View → Problems or Ctrl+Shift+M / Cmd+Shift+M).

### Diagnostic Severity Levels
- **Error** (🚫): Limited availability features that may break functionality
- **Warning** (⚠️): Newly available features that need consideration
- **Information** (✅): Widely available features (informational only)

### Diagnostic Information
Each diagnostic includes:
- Feature name and compatibility status
- Baseline date information
- Context about where the feature was detected
- Quick links to documentation

### Filtering Diagnostics
Use the Problems panel filters to:
- Show only Baseline Lens diagnostics (filter by "baseline-lens")
- Filter by severity level
- Search for specific features

## Configuration Options

Access settings via File → Preferences → Settings, then search for "Baseline Lens".

### `baseline-lens.enabledFileTypes`
**Type**: Array of strings  
**Default**: `["css", "scss", "less", "javascript", "typescript", "html", "vue", "svelte"]`  
**Description**: File types to analyze for web feature compatibility.

```json
{
  "baseline-lens.enabledFileTypes": [
    "css", "scss", "javascript", "typescript", "html"
  ]
}
```

### `baseline-lens.supportThreshold`
**Type**: Number (0-100)  
**Default**: `90`  
**Description**: Minimum browser support percentage to consider a feature safe.

```json
{
  "baseline-lens.supportThreshold": 95
}
```

### `baseline-lens.showInlineIndicators`
**Type**: Boolean  
**Default**: `true`  
**Description**: Show inline compatibility indicators in the editor.

```json
{
  "baseline-lens.showInlineIndicators": false
}
```

### `baseline-lens.diagnosticSeverity`
**Type**: String (`"error"` | `"warning"` | `"info"`)  
**Default**: `"warning"`  
**Description**: Severity level for compatibility diagnostics.

```json
{
  "baseline-lens.diagnosticSeverity": "info"
}
```

### `baseline-lens.excludePatterns`
**Type**: Array of strings  
**Default**: `["**/node_modules/**", "**/dist/**", "**/build/**"]`  
**Description**: File patterns to exclude from analysis.

```json
{
  "baseline-lens.excludePatterns": [
    "**/node_modules/**",
    "**/dist/**",
    "**/vendor/**"
  ]
}
```

## Commands

Access commands via Command Palette (Ctrl+Shift+P / Cmd+Shift+P).

### `Baseline Lens: Generate Report`
Generates a comprehensive compatibility report for your entire project.

**Output formats**:
- JSON (machine-readable)
- Markdown (human-readable)

**Report contents**:
- Summary of detected features
- Compatibility status breakdown
- Risk assessment
- Recommendations

### `Baseline Lens: Refresh Analysis`
Forces re-analysis of all open documents. Useful when:
- Configuration changes aren't reflected
- Extension seems out of sync
- After updating dependencies

### `Baseline Lens: Toggle Inline Indicators`
Quickly show/hide inline compatibility indicators without changing settings.

## Supported File Types

### CSS and Preprocessors
- **CSS** (`.css`)
- **SCSS** (`.scss`)
- **Sass** (`.sass`)
- **Less** (`.less`)
- **Stylus** (`.styl`)

**Detected features**:
- CSS properties (`display: grid`, `aspect-ratio`)
- CSS functions (`clamp()`, `color-mix()`)
- CSS selectors (`:has()`, `:is()`)
- At-rules (`@container`, `@layer`)

### JavaScript and TypeScript
- **JavaScript** (`.js`, `.mjs`)
- **TypeScript** (`.ts`)
- **JSX** (`.jsx`)
- **TSX** (`.tsx`)

**Detected features**:
- Web APIs (`fetch()`, `IntersectionObserver`)
- Modern syntax (optional chaining, nullish coalescing)
- Built-in objects (`Promise.allSettled()`, `Array.at()`)
- ES modules and dynamic imports

### HTML and Templates
- **HTML** (`.html`, `.htm`)
- **Vue** (`.vue`)
- **Svelte** (`.svelte`)

**Detected features**:
- HTML elements and attributes
- Input types and form features
- Embedded CSS and JavaScript

### CSS-in-JS Support
Baseline Lens detects CSS features within:
- Styled-components (`` styled.div`...` ``)
- Emotion (`` css`...` ``)
- Style objects (`style={{ ... }}`)
- CSS prop usage

## Troubleshooting

### Extension Not Working
1. **Check file type**: Ensure you're working with a supported file type
2. **Restart VS Code**: Sometimes a restart resolves initialization issues
3. **Check output panel**: View → Output → Select "Baseline Lens" for error messages
4. **Verify installation**: Ensure the extension is enabled in the Extensions view

### No Indicators Showing
1. **Check settings**: Verify `showInlineIndicators` is enabled
2. **File size**: Large files (>10MB) are skipped for performance
3. **Excluded patterns**: Check if your file matches exclusion patterns
4. **Refresh analysis**: Use the "Refresh Analysis" command

### Performance Issues
1. **Large files**: Consider excluding very large files
2. **Many files**: Use exclusion patterns for build directories
3. **Memory usage**: Restart VS Code if memory usage is high
4. **Disable temporarily**: Toggle indicators off for intensive editing sessions

### Incorrect Feature Detection
1. **Report issue**: File a bug report with code examples
2. **Check context**: Hover over features to see detection context
3. **Update extension**: Ensure you have the latest version
4. **Clear cache**: Restart VS Code to clear internal caches

## Best Practices

### Development Workflow
1. **Enable during development**: Keep Baseline Lens active while coding
2. **Review before commits**: Check compatibility issues before committing
3. **Team consistency**: Share configuration across team members
4. **CI integration**: Plan to integrate compatibility checking in CI/CD

### Feature Adoption Strategy
1. **Start with widely available**: Use ✅ features confidently
2. **Progressive enhancement**: Layer ⚠️ features with fallbacks
3. **Avoid 🚫 features**: Unless you have specific polyfills/fallbacks
4. **Monitor baseline updates**: Features move from 🚫 → ⚠️ → ✅ over time

### Configuration Tips
1. **Adjust threshold**: Lower threshold (80%) for modern apps, higher (95%) for broad compatibility
2. **Customize file types**: Only analyze relevant file types for your project
3. **Exclude build artifacts**: Always exclude generated/build directories
4. **Team settings**: Use workspace settings for team consistency

### Performance Optimization
1. **Exclude large directories**: Add `node_modules`, `dist`, `build` to exclusions
2. **Limit file types**: Only enable analysis for file types you use
3. **Monitor large files**: Be aware that very large files may be skipped
4. **Use refresh sparingly**: Let automatic analysis handle most cases

### Educational Usage
1. **Explore hover content**: Learn about features through detailed hover information
2. **Follow links**: Use MDN and specification links to deepen understanding
3. **Understand baseline**: Learn what "baseline" means for web platform features
4. **Share knowledge**: Use reports to educate team members about compatibility