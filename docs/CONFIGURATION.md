# Baseline Lens Configuration Guide

This guide covers all configuration options available in Baseline Lens, including VS Code settings, team-level configuration, and customization options.

## Table of Contents

- [VS Code Settings](#vs-code-settings)
- [Team Configuration](#team-configuration)
- [Browser Matrix Customization](#browser-matrix-customization)
- [File Exclusion Patterns](#file-exclusion-patterns)
- [Configuration Commands](#configuration-commands)
- [Configuration Validation](#configuration-validation)

## VS Code Settings

Baseline Lens integrates with VS Code's settings system. All settings are prefixed with `baseline-lens.` and can be configured at the user, workspace, or folder level.

### Core Settings

#### `baseline-lens.enabledFileTypes`
- **Type**: `string[]`
- **Default**: `["css", "scss", "less", "javascript", "typescript", "html", "vue", "svelte"]`
- **Description**: File types to analyze for web feature compatibility

#### `baseline-lens.supportThreshold`
- **Type**: `number`
- **Default**: `90`
- **Range**: `0-100`
- **Description**: Minimum browser support percentage to consider a feature safe

#### `baseline-lens.showInlineIndicators`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Show inline compatibility indicators in the editor (✅, ⚠, 🚫)

#### `baseline-lens.diagnosticSeverity`
- **Type**: `string`
- **Default**: `"warning"`
- **Options**: `"error"`, `"warning"`, `"info"`
- **Description**: Default severity level for compatibility diagnostics

#### `baseline-lens.excludePatterns`
- **Type**: `string[]`
- **Default**: `["**/node_modules/**", "**/dist/**", "**/build/**"]`
- **Description**: File patterns to exclude from analysis (supports glob patterns)

### Advanced Settings

#### `baseline-lens.customBrowserMatrix`
- **Type**: `string[]`
- **Default**: `[]`
- **Description**: Custom browser support matrix. Leave empty to use default Baseline data
- **Format**: `["chrome >= 90", "firefox >= 88", "safari >= 14"]`

#### `baseline-lens.baselineStatusMapping`
- **Type**: `object`
- **Default**: 
  ```json
  {
    "widely_available": "info",
    "newly_available": "warning", 
    "limited_availability": "error"
  }
  ```
- **Description**: Map baseline status to diagnostic severity levels
- **Options**: `"error"`, `"warning"`, `"info"`, `"none"`

#### `baseline-lens.enabledAnalyzers`
- **Type**: `object`
- **Default**: 
  ```json
  {
    "css": true,
    "javascript": true,
    "html": true
  }
  ```
- **Description**: Enable or disable specific analyzers

### Performance Settings

#### `baseline-lens.maxFileSize`
- **Type**: `number`
- **Default**: `10485760` (10MB)
- **Minimum**: `1024`
- **Description**: Maximum file size in bytes to analyze

#### `baseline-lens.analysisTimeout`
- **Type**: `number`
- **Default**: `5000`
- **Minimum**: `1000`
- **Description**: Analysis timeout in milliseconds per file

#### `baseline-lens.autoRefreshOnSave`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Automatically refresh analysis when files are saved

### Team Settings

#### `baseline-lens.enableTeamConfig`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Enable team-level configuration from `.baseline-lens.json` files

#### `baseline-lens.showEducationalHints`
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Show educational hints for newly available features

## Team Configuration

Team configuration allows you to share consistent settings across your team using a `.baseline-lens.json` file in your project root.

### Creating Team Configuration

1. Use the command palette: `Baseline Lens: Export Team Configuration`
2. Or manually create a `.baseline-lens.json` file in your project root

### Team Configuration Schema

```json
{
  "$schema": "https://raw.githubusercontent.com/baseline-lens/baseline-lens/main/schemas/team-config.json",
  "supportThreshold": 85,
  "customBrowserMatrix": [
    "chrome >= 88",
    "firefox >= 85", 
    "safari >= 14",
    "edge >= 88"
  ],
  "excludePatterns": [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/*.min.js",
    "**/*.min.css"
  ],
  "baselineStatusMapping": {
    "widely_available": "info",
    "newly_available": "warning",
    "limited_availability": "error"
  },
  "enabledAnalyzers": {
    "css": true,
    "javascript": true,
    "html": true
  },
  "maxFileSize": 5242880,
  "analysisTimeout": 3000,
  "rules": {
    "css-grid": "warning",
    "css-flexbox": "info",
    "es6-modules": "warning",
    "fetch-api": "error"
  }
}
```

### Configuration Inheritance

Team configuration overrides VS Code settings with the following priority:

1. **Team Configuration** (`.baseline-lens.json`) - Highest priority
2. **Workspace Settings** (`.vscode/settings.json`)
3. **User Settings** - Lowest priority

### Configuration Validation

Team configurations are automatically validated when loaded. Invalid configurations will show warnings and fall back to defaults.

## Browser Matrix Customization

Define custom browser support requirements using the `customBrowserMatrix` setting.

### Supported Browsers

- `chrome` - Google Chrome
- `firefox` - Mozilla Firefox  
- `safari` - Apple Safari
- `edge` - Microsoft Edge
- `ie` - Internet Explorer
- `opera` - Opera
- `ios` - iOS Safari
- `android` - Android Browser

### Supported Operators

- `>=` - Greater than or equal to
- `>` - Greater than
- `<=` - Less than or equal to
- `<` - Less than
- `=` - Equal to

### Examples

```json
{
  "customBrowserMatrix": [
    "chrome >= 90",
    "firefox >= 88",
    "safari >= 14.1",
    "edge >= 90",
    "ios >= 14",
    "android >= 90"
  ]
}
```

## File Exclusion Patterns

Use glob patterns to exclude files and directories from analysis.

### Pattern Examples

```json
{
  "excludePatterns": [
    "**/node_modules/**",     // Exclude all node_modules
    "**/dist/**",             // Exclude dist directories
    "**/*.min.js",            // Exclude minified JS files
    "**/*.min.css",           // Exclude minified CSS files
    "**/vendor/**",           // Exclude vendor directories
    "**/*.test.js",           // Exclude test files
    "**/legacy/**"            // Exclude legacy code
  ]
}
```

### Pattern Syntax

- `*` - Matches any characters except path separators
- `**` - Matches any characters including path separators (recursive)
- `?` - Matches any single character except path separators
- `[abc]` - Matches any character in the brackets
- `{a,b}` - Matches any of the comma-separated patterns

## Configuration Commands

Access configuration features through the VS Code command palette:

### `Baseline Lens: Export Team Configuration`
Export current settings to a `.baseline-lens.json` file for team sharing.

### `Baseline Lens: Import Team Configuration`
Import settings from a `.baseline-lens.json` file.

### `Baseline Lens: Reset Configuration to Defaults`
Reset all Baseline Lens settings to their default values.

### `Baseline Lens: Validate Configuration`
Validate current configuration and report any issues.

### `Baseline Lens: Toggle Inline Indicators`
Quickly toggle inline compatibility indicators on/off.

## Configuration Validation

Baseline Lens automatically validates configuration values and provides helpful error messages for invalid settings.

### Common Validation Errors

- **Support threshold out of range**: Must be between 0-100
- **Invalid file size**: Must be at least 1024 bytes (1KB)
- **Invalid timeout**: Must be at least 1000 milliseconds
- **Invalid browser specification**: Must follow format like "chrome >= 90"
- **Invalid severity level**: Must be "error", "warning", "info", or "none"

### Validation Commands

Use `Baseline Lens: Validate Configuration` to check your current settings for any issues.

## Best Practices

### Team Configuration

1. **Version Control**: Commit `.baseline-lens.json` to your repository
2. **Documentation**: Document any custom rules or thresholds
3. **Gradual Migration**: Start with lenient thresholds and gradually increase
4. **Regular Updates**: Review and update browser matrix as support improves

### Performance Optimization

1. **File Size Limits**: Set appropriate `maxFileSize` for your project
2. **Exclusion Patterns**: Exclude unnecessary files to improve performance
3. **Timeout Settings**: Adjust `analysisTimeout` based on file complexity
4. **Selective Analysis**: Disable analyzers you don't need

### Severity Mapping

1. **Error Level**: Use for features that break functionality
2. **Warning Level**: Use for features with limited support
3. **Info Level**: Use for widely supported features
4. **None Level**: Use to disable diagnostics for specific statuses

## Troubleshooting

### Configuration Not Loading

1. Check file syntax with `Baseline Lens: Validate Configuration`
2. Ensure `.baseline-lens.json` is in project root
3. Verify `enableTeamConfig` is set to `true`
4. Check VS Code output panel for error messages

### Performance Issues

1. Increase `maxFileSize` limit if files are being skipped
2. Add exclusion patterns for large generated files
3. Increase `analysisTimeout` for complex files
4. Disable unused analyzers

### Inconsistent Results

1. Ensure team configuration is properly committed
2. Check for conflicting workspace settings
3. Validate browser matrix specifications
4. Restart VS Code after configuration changes

## Migration Guide

### From Previous Versions

If upgrading from an earlier version of Baseline Lens:

1. **Backup Settings**: Export current configuration before upgrading
2. **Review Changes**: Check this guide for new configuration options
3. **Update Team Config**: Add new settings to existing `.baseline-lens.json`
4. **Test Configuration**: Use validation command to ensure compatibility

### Configuration Schema Changes

The configuration schema may evolve between versions. Baseline Lens will:

1. **Migrate Automatically**: Convert old settings to new format when possible
2. **Show Warnings**: Alert you to deprecated or invalid settings
3. **Provide Defaults**: Use sensible defaults for missing settings
4. **Validate Continuously**: Check configuration on every load