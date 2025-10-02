# Customizing Baseline Lens

Tailor Baseline Lens to your project's browser support needs and team workflow.

## Essential Settings Overview

### 🎯 Browser Support Control
- **Support Threshold** (90%): Minimum browser support to consider features "safe"
- **Custom Browser Matrix**: Target specific browsers like `["chrome >= 90", "safari >= 14"]`
- **Baseline Status Mapping**: Control warning levels for each compatibility status

### 🔧 Analysis Behavior
- **Show Inline Indicators** (❌): Display ✅⚠️🚫 icons in your code
- **Show Diagnostics** (✅): Show warnings/errors in Problems panel
- **Diagnostic Severity** (Warning): How compatibility issues appear in Problems panel
- **Enabled Analyzers**: Turn CSS, JavaScript, or HTML analysis on/off

### 📁 File Processing
- **Enabled File Types**: Which languages to analyze (CSS, JS, HTML, Vue, Svelte)
- **Exclude Patterns**: Skip files like `**/node_modules/**`, `**/dist/**`
- **Max File Size** (10MB): Skip large files to maintain performance

## Try It: Customize Your Experience

### Step 1: Open Settings
Use `Ctrl+Shift+B S` (or `Cmd+Shift+B S` on Mac) to open Baseline Lens settings

### Step 2: Adjust Support Threshold
1. Find **"Baseline-lens: Support Threshold"**
2. Change from `90` to `95` for stricter compatibility
3. Or set to `85` for more modern feature adoption

### Step 3: Control Visual Feedback
1. Find **"Baseline-lens: Show Inline Indicators"**
2. Check to enable ✅⚠️🚫 icons in your code
3. Find **"Baseline-lens: Show Diagnostics"**
4. Uncheck to hide warnings in Problems panel (quiet mode)

### Step 4: Customize Diagnostic Severity
1. Find **"Baseline-lens: Diagnostic Severity"**
2. Change from "warning" to "error" for stricter enforcement
3. Or set to "info" for gentler notifications

### Quick Toggle Commands
- Use **"Toggle Inline Indicators"** command for instant on/off
- Use **"Toggle Diagnostics"** command to enable/disable Problems panel warnings

## Team Configuration

### Share Settings with Your Team
1. Use **"Export Team Configuration"** command
2. Save `.baseline-lens.json` to your project root
3. Commit to version control for team consistency

### Project-Specific Settings
```json
{
  "supportThreshold": 95,
  "diagnosticSeverity": "warning",
  "customBrowserMatrix": [
    "chrome >= 90",
    "firefox >= 88",
    "safari >= 14"
  ]
}
```

**💡 Pro Tip**: Start with defaults, then adjust based on your project's browser analytics and user base!