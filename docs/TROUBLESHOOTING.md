# Baseline Lens Troubleshooting Guide

This guide helps you resolve common issues with Baseline Lens. If you can't find a solution here, please [create an issue](https://github.com/baseline-lens/baseline-lens/issues).

## Table of Contents
- [Quick Fixes](#quick-fixes)
- [Installation Problems](#installation-problems)
- [Performance Issues](#performance-issues)
- [Feature Detection Problems](#feature-detection-problems)
- [UI and Display Issues](#ui-and-display-issues)
- [Configuration Issues](#configuration-issues)
- [Error Messages](#error-messages)
- [Debugging Steps](#debugging-steps)
- [FAQ](#faq)
- [Getting Help](#getting-help)

## Quick Fixes

### Extension Not Working
1. **Reload VS Code**: `Ctrl+Shift+P` → "Developer: Reload Window"
2. **Check file type**: Ensure you're working with supported files (CSS, JS, HTML, etc.)
3. **Verify activation**: Look for "Baseline Lens" in the status bar
4. **Check settings**: Ensure `baseline-lens.showInlineIndicators` is enabled

### No Indicators Showing
1. **Check enabled file types**: Go to Settings → Extensions → Baseline Lens → Enabled File Types
2. **Verify file extension**: Make sure your file has a supported extension
3. **Toggle indicators**: Run command "Baseline Lens: Toggle Inline Indicators"
4. **Check exclusion patterns**: Ensure your file isn't excluded by patterns

## Installation Problems

### Extension Won't Install

**Symptoms**: Installation fails or extension doesn't appear in Extensions list

**Solutions**:
1. **Check VS Code version**: Requires VS Code 1.74.0 or higher
   ```bash
   code --version
   ```

2. **Clear extension cache**:
   - Close VS Code
   - Delete `~/.vscode/extensions/baseline-lens.*`
   - Restart VS Code and reinstall

3. **Manual installation**:
   ```bash
   code --install-extension baseline-lens.baseline-lens --force
   ```

4. **Check network connectivity**: Ensure you can access VS Code Marketplace

### Extension Fails to Activate

**Symptoms**: Extension installed but not working

**Solutions**:
1. **Check activation events**: Open a supported file type (CSS, JS, HTML)
2. **View extension logs**: `Help` → `Toggle Developer Tools` → `Console`
3. **Disable conflicting extensions**: Temporarily disable other linting extensions
4. **Reset extension settings**: Run "Baseline Lens: Reset Configuration to Defaults"

## Performance Issues

### Slow Analysis

**Symptoms**: Long delays when typing or opening files

**Solutions**:
1. **Check file size**: Large files (>10MB) may be slow
   - Adjust `baseline-lens.maxFileSize` setting
   - Use `baseline-lens.analysisTimeout` to limit processing time

2. **Exclude large directories**:
   ```json
   {
     "baseline-lens.excludePatterns": [
       "**/node_modules/**",
       "**/dist/**",
       "**/build/**",
       "**/vendor/**"
     ]
   }
   ```

3. **Disable unused analyzers**:
   ```json
   {
     "baseline-lens.enabledAnalyzers": {
       "css": true,
       "javascript": false,
       "html": true
     }
   }
   ```

### High Memory Usage

**Symptoms**: VS Code becomes sluggish, high RAM usage

**Solutions**:
1. **Restart VS Code**: Clears extension memory
2. **Reduce analysis scope**: Exclude more file patterns
3. **Check for memory leaks**: Report issue with memory profiling data

### Extension Startup Slow

**Symptoms**: VS Code takes long to start with extension enabled

**Solutions**:
1. **Check web-features data loading**: May take time on first startup
2. **Disable auto-refresh**: Set `baseline-lens.autoRefreshOnSave` to `false`
3. **Report performance issue**: Include startup timing information

## Feature Detection Problems

### Features Not Detected

**Symptoms**: Known web features not showing indicators

**Solutions**:
1. **Check feature support**: Not all features are in web-features dataset
2. **Verify syntax**: Ensure code is syntactically correct
3. **Check analyzer support**: Some features may not be implemented yet
4. **Update extension**: Newer versions may have better detection

### False Positives

**Symptoms**: Indicators on features that shouldn't be flagged

**Solutions**:
1. **Check baseline status**: Feature status may have changed
2. **Adjust support threshold**: Lower `baseline-lens.supportThreshold`
3. **Use custom browser matrix**: Define specific browser requirements
4. **Report detection issue**: Help improve accuracy

### Missing Browser Data

**Symptoms**: Hover shows incomplete browser support information

**Solutions**:
1. **Update web-features**: Extension uses latest available data
2. **Check MDN links**: May provide more recent information
3. **Report data gaps**: Help identify missing information

## UI and Display Issues

### Indicators Not Visible

**Symptoms**: Can't see ✅ ⚠ 🚫 symbols in editor

**Solutions**:
1. **Check font support**: Ensure your font supports Unicode symbols
2. **Adjust editor theme**: Some themes may hide decorations
3. **Toggle indicators**: Run "Baseline Lens: Toggle Inline Indicators"
4. **Check decoration settings**: Verify VS Code decoration settings

### Hover Information Missing

**Symptoms**: No tooltip when hovering over indicators

**Solutions**:
1. **Check hover delay**: Wait a moment for tooltip to appear
2. **Verify hover provider**: Ensure extension is active
3. **Check conflicting extensions**: Other extensions may interfere
4. **Restart extension**: Reload VS Code window

### Problems Panel Empty

**Symptoms**: No diagnostics showing in Problems panel

**Solutions**:
1. **Check diagnostic severity**: Adjust `baseline-lens.diagnosticSeverity`
2. **Filter problems**: Ensure Baseline Lens isn't filtered out
3. **Refresh analysis**: Run "Baseline Lens: Refresh Analysis"
4. **Check file scope**: Ensure current file is being analyzed

## Configuration Issues

### Settings Not Applied

**Symptoms**: Changed settings don't take effect

**Solutions**:
1. **Reload window**: `Ctrl+Shift+P` → "Developer: Reload Window"
2. **Check setting scope**: Verify workspace vs user settings
3. **Validate JSON**: Ensure `.baseline-lens.json` is valid JSON
4. **Check setting names**: Verify correct setting key names

### Team Configuration Problems

**Symptoms**: Team settings not working across members

**Solutions**:
1. **Check file location**: Ensure `.baseline-lens.json` is in project root
2. **Verify file permissions**: All team members can read the file
3. **Validate configuration**: Run "Baseline Lens: Validate Configuration"
4. **Check version compatibility**: Ensure all team members use compatible versions

### Custom Browser Matrix Issues

**Symptoms**: Custom browser requirements not working

**Solutions**:
1. **Check syntax**: Use correct browserslist format
   ```json
   {
     "customBrowserMatrix": [
       "chrome >= 90",
       "firefox >= 88",
       "safari >= 14"
     ]
   }
   ```

2. **Validate browsers**: Ensure browser names are recognized
3. **Test configuration**: Use online browserslist tools to verify

## Error Messages

### "Failed to load web-features data"

**Cause**: Extension can't access compatibility dataset

**Solutions**:
1. **Check internet connection**: Initial download may require network
2. **Clear extension cache**: Delete and reinstall extension
3. **Check firewall**: Ensure npm registry access
4. **Manual data update**: Reinstall extension to refresh data

### "Analysis timeout exceeded"

**Cause**: File analysis taking too long

**Solutions**:
1. **Increase timeout**: Adjust `baseline-lens.analysisTimeout`
2. **Reduce file size**: Split large files
3. **Check file complexity**: Highly nested structures may be slow
4. **Report performance issue**: Include file characteristics

### "Unsupported file type"

**Cause**: File type not supported by extension

**Solutions**:
1. **Check file extension**: Ensure it's in supported list
2. **Add file type**: Update `baseline-lens.enabledFileTypes`
3. **Check language mode**: Verify VS Code language detection
4. **Request support**: File feature request for new file types

## Debugging Steps

### Enable Debug Logging

1. **Open VS Code settings**
2. **Search for "baseline-lens"**
3. **Enable debug logging** (if available)
4. **Check Developer Tools console** for detailed logs

### Collect Diagnostic Information

When reporting issues, include:

1. **VS Code version**: `Help` → `About`
2. **Extension version**: Extensions panel
3. **Operating system**: Windows/macOS/Linux version
4. **Sample code**: Minimal reproduction case
5. **Error messages**: Full error text
6. **Screenshots**: Visual issues
7. **Extension logs**: Developer Tools console output

### Test in Clean Environment

1. **Disable other extensions**: Test with only Baseline Lens enabled
2. **Reset settings**: Use default configuration
3. **Create test file**: Simple HTML/CSS/JS file
4. **Check basic functionality**: Verify core features work

## FAQ

### Q: Why aren't all CSS properties detected?
**A**: The extension relies on the web-features dataset, which may not include every CSS property. We're working to improve coverage.

### Q: Can I add custom compatibility rules?
**A**: Currently, you can adjust thresholds and browser matrices, but custom rules aren't supported. This feature is planned for future releases.

### Q: Does the extension work offline?
**A**: Yes, once installed, the extension works offline using cached compatibility data.

### Q: How often is compatibility data updated?
**A**: Data is updated with each extension release, typically following web-features dataset updates.

### Q: Can I use this with other linting extensions?
**A**: Yes, Baseline Lens is designed to work alongside ESLint, Prettier, and other tools.

### Q: Why do I see different results than CanIUse?
**A**: Baseline Lens uses web-features data, which may differ from CanIUse. Baseline focuses on interoperable web platform features.

## Getting Help

### Before Asking for Help

1. **Search existing issues**: Check if your problem is already reported
2. **Try troubleshooting steps**: Follow relevant sections in this guide
3. **Test with minimal example**: Create simple reproduction case
4. **Gather information**: Collect diagnostic details listed above

### Where to Get Help

1. **GitHub Issues**: [Report bugs and request features](https://github.com/baseline-lens/baseline-lens/issues)
2. **GitHub Discussions**: [Ask questions and share ideas](https://github.com/baseline-lens/baseline-lens/discussions)
3. **Documentation**: [Check comprehensive guides](https://github.com/baseline-lens/baseline-lens/wiki)

### Creating Good Bug Reports

Include:
- **Clear title**: Describe the issue concisely
- **Steps to reproduce**: Numbered list of actions
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Environment details**: OS, VS Code version, extension version
- **Sample code**: Minimal reproduction case
- **Screenshots**: For visual issues

### Response Times

- **Bug reports**: Usually responded to within 48 hours
- **Feature requests**: Reviewed weekly
- **Security issues**: Prioritized and handled immediately

---

**Still having issues?** Don't hesitate to [create an issue](https://github.com/baseline-lens/baseline-lens/issues/new) - we're here to help!