# Customizing Baseline Lens

Configure Baseline Lens to match your project's specific browser support requirements and team preferences.

## Key Settings:

### Browser Support
- **`baseline-lens.supportThreshold`**: Minimum browser support percentage (default: 95%)
- **`baseline-lens.targetBrowsers`**: Specific browsers and versions to target
- **`baseline-lens.includePrerelease`**: Whether to consider pre-release browser versions

### Diagnostic Behavior  
- **`baseline-lens.diagnosticSeverity`**: How to report issues (error/warning/info)
- **`baseline-lens.showInlineIndicators`**: Toggle visual indicators in code
- **`baseline-lens.enableHoverInfo`**: Show detailed info on hover

### File Handling
- **`baseline-lens.excludePatterns`**: Skip files matching these patterns
- **`baseline-lens.enabledLanguages`**: Which file types to analyze
- **`baseline-lens.maxFileSize`**: Skip files larger than this size

### Team Configuration
- **Workspace settings**: Share configuration across your team
- **`.baseline-lens.json`**: Project-specific configuration file
- **CI/CD integration**: Export settings for build pipelines

## Configuration Levels:

### User Settings (Global)
Apply to all projects on your machine

### Workspace Settings  
Apply only to the current project, shared with team

### Project Configuration
Use `.baseline-lens.json` for version-controlled settings

## Quick Setup:

1. **Conservative**: Set threshold to 98% for maximum compatibility
2. **Balanced**: Use default 95% threshold for modern web development  
3. **Progressive**: Set to 90% to adopt newer features faster

**Tip**: Start with defaults and adjust based on your project's browser support requirements!