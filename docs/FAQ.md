# Frequently Asked Questions (FAQ)

## General Questions

### What is Baseline Lens?

Baseline Lens is a VS Code extension that provides real-time web feature compatibility checking using Baseline data. It helps developers make informed decisions about browser support without leaving their IDE.

### How is this different from CanIUse?

While CanIUse provides comprehensive browser compatibility data, Baseline Lens:
- Integrates directly into your coding workflow
- Uses Baseline's curated "interoperable" feature set
- Provides real-time analysis as you type
- Focuses on actionable compatibility information
- Offers automated project-wide analysis

### What is Baseline?

[Baseline](https://web.dev/baseline/) is a web platform compatibility standard that identifies when web features become "interoperable" across major browsers. It provides clear guidance on feature adoption timing.

## Installation & Setup

### What are the system requirements?

- VS Code 1.74.0 or higher
- Node.js 16.x or higher (for development)
- 50MB available disk space
- Internet connection (for initial data download)

### Do I need to configure anything after installation?

No, Baseline Lens works out of the box with sensible defaults. However, you can customize:
- Support thresholds
- Enabled file types
- Diagnostic severity levels
- Browser support matrices

### Can I use this in a team environment?

Yes! Create a `.baseline-lens.json` file in your project root to share configuration across team members:

```json
{
  "supportThreshold": 95,
  "diagnosticSeverity": "warning",
  "customBrowserMatrix": ["chrome >= 90", "firefox >= 88"]
}
```

## Features & Functionality

### Which file types are supported?

- **CSS**: `.css`, `.scss`, `.less`, CSS-in-JS
- **JavaScript**: `.js`, `.ts`, `.jsx`, `.tsx`
- **HTML**: `.html`, `.htm`, framework templates
- **Frameworks**: React, Vue, Angular, Svelte

### What web features are detected?

- **CSS**: Properties, selectors, at-rules, functions, pseudo-classes
- **JavaScript**: Web APIs, built-in objects, modern syntax, DOM methods
- **HTML**: Elements, attributes, input types, ARIA properties

### How accurate is the feature detection?

Feature detection accuracy depends on:
- **Parsing quality**: Uses industry-standard parsers (PostCSS, Acorn, parse5)
- **Data completeness**: Limited by web-features dataset coverage
- **Code complexity**: Simple, well-formed code is detected more accurately

We continuously improve detection accuracy based on user feedback.

### Can I customize which features trigger warnings?

Yes, through several configuration options:

```json
{
  "supportThreshold": 90,
  "baselineStatusMapping": {
    "widely_available": "info",
    "newly_available": "warning",
    "limited_availability": "error"
  },
  "customBrowserMatrix": ["chrome >= 85"]
}
```

## Performance

### Will this slow down my VS Code?

Baseline Lens is designed for minimal performance impact:
- **Analysis speed**: <100ms for typical files
- **Memory usage**: <50MB for large projects
- **Startup time**: <2 seconds activation
- **Incremental analysis**: Only re-analyzes changed code

### What if I have very large files?

Large file handling:
- **Default limit**: 10MB per file
- **Configurable**: Adjust `maxFileSize` setting
- **Timeout protection**: Analysis stops after 5 seconds by default
- **Exclusion patterns**: Skip large generated files

### Can I exclude certain files or directories?

Yes, use exclusion patterns:

```json
{
  "excludePatterns": [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/vendor/**",
    "**/*.min.js"
  ]
}
```

## Compatibility Data

### How often is compatibility data updated?

- **Extension updates**: Data refreshed with each release
- **web-features updates**: Follows upstream dataset releases
- **Baseline changes**: Reflected in next extension version
- **Update frequency**: Typically monthly

### What if a feature isn't detected?

Possible reasons:
1. **Not in dataset**: Feature not yet included in web-features
2. **Syntax variation**: Different syntax not recognized
3. **Parser limitation**: Complex code structures
4. **Recent addition**: Very new features may lag

Report missing features to help improve coverage.

### Why do results differ from other tools?

Different tools use different data sources:
- **Baseline Lens**: web-features dataset (Baseline-focused)
- **CanIUse**: Comprehensive browser data
- **MDN**: Documentation-focused compatibility
- **Browserslist**: Configuration-based queries

Each serves different use cases and may show different results.

## Troubleshooting

### The extension isn't working at all

Quick fixes:
1. **Reload VS Code**: `Ctrl+Shift+P` → "Developer: Reload Window"
2. **Check file type**: Ensure you're in a supported file
3. **Verify activation**: Look for extension in status bar
4. **Reset settings**: Run "Baseline Lens: Reset Configuration"

### I don't see any indicators

Common causes:
1. **Indicators disabled**: Check `showInlineIndicators` setting
2. **Wrong file type**: Verify file extension is supported
3. **Exclusion patterns**: File might be excluded
4. **Theme issues**: Some themes hide decorations

### Hover tooltips aren't showing

Troubleshooting steps:
1. **Wait for delay**: Tooltips appear after brief pause
2. **Check conflicts**: Other extensions may interfere
3. **Verify position**: Hover directly over indicator
4. **Restart extension**: Reload VS Code window

## Configuration

### Where do I find extension settings?

1. **VS Code Settings**: File → Preferences → Settings → Extensions → Baseline Lens
2. **Settings JSON**: Add to `settings.json`
3. **Workspace config**: Create `.baseline-lens.json` in project root
4. **Command palette**: Search "Baseline Lens" for commands

### What's the difference between user and workspace settings?

- **User settings**: Apply to all VS Code instances
- **Workspace settings**: Apply only to current project
- **Project config**: `.baseline-lens.json` overrides both
- **Priority**: Project config > Workspace > User settings

### Can I have different settings per project?

Yes! Use workspace settings or `.baseline-lens.json`:

```json
// .vscode/settings.json (workspace)
{
  "baseline-lens.supportThreshold": 95,
  "baseline-lens.diagnosticSeverity": "error"
}

// .baseline-lens.json (project)
{
  "supportThreshold": 90,
  "excludePatterns": ["**/legacy/**"]
}
```

## Integration

### Does this work with other linting tools?

Yes, Baseline Lens complements other tools:
- **ESLint**: Code quality + compatibility
- **Prettier**: Formatting + compatibility
- **Stylelint**: CSS linting + compatibility
- **TypeScript**: Type checking + compatibility

### Can I use this in CI/CD pipelines?

Yes, through the CLI interface:

```bash
# Install globally
npm install -g baseline-lens

# Run compatibility check
baseline-lens check src/

# Generate report
baseline-lens report --format json > compatibility-report.json

# Fail build on issues
baseline-lens check --fail-on-error src/
```

### How do I integrate with GitHub Actions?

```yaml
name: Compatibility Check
on: [push, pull_request]

jobs:
  compatibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install -g baseline-lens
      - run: baseline-lens check src/ --fail-on-error
```

## Development & Contributing

### How can I contribute to the project?

Ways to contribute:
1. **Report bugs**: Create GitHub issues
2. **Request features**: Use GitHub discussions
3. **Submit code**: Fork and create pull requests
4. **Improve docs**: Help with documentation
5. **Share feedback**: Tell us about your experience

### How do I set up a development environment?

```bash
# Clone repository
git clone https://github.com/baseline-lens/baseline-lens.git
cd baseline-lens

# Install dependencies
npm install

# Start development
npm run watch

# Open in VS Code
code .

# Launch extension (F5)
```

### Can I create custom analyzers?

Currently, custom analyzers aren't supported, but this is planned for future releases. You can:
1. **Request support**: File feature request for new file types
2. **Contribute**: Help implement new analyzers
3. **Fork project**: Create custom version for specific needs

## Licensing & Legal

### What license is Baseline Lens under?

MIT License - free for personal and commercial use.

### Can I use this in commercial projects?

Yes, the MIT license allows commercial use without restrictions.

### Are there any usage limitations?

No usage limitations, but please:
- Respect rate limits if using programmatically
- Don't redistribute without attribution
- Follow VS Code Marketplace terms

## Future Plans

### What features are planned?

Upcoming features:
- **Custom rules**: User-defined compatibility rules
- **More file types**: Additional language support
- **AI suggestions**: Smarter fallback recommendations
- **Team dashboards**: Centralized compatibility monitoring
- **IDE expansion**: Support for other editors

### How can I influence the roadmap?

- **GitHub discussions**: Share ideas and vote on features
- **Feature requests**: Create detailed proposals
- **User feedback**: Tell us what you need most
- **Community input**: Join our development discussions

---

**Have a question not covered here?** [Ask in our GitHub Discussions](https://github.com/baseline-lens/baseline-lens/discussions) or [create an issue](https://github.com/baseline-lens/baseline-lens/issues).