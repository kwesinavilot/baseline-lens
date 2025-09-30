# 🌐 Baseline Lens

[![Version](https://img.shields.io/visual-studio-marketplace/v/baseline-lens.baseline-lens)](https://marketplace.visualstudio.com/items?itemName=baseline-lens.baseline-lens)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/baseline-lens.baseline-lens)](https://marketplace.visualstudio.com/items?itemName=baseline-lens.baseline-lens)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/baseline-lens.baseline-lens)](https://marketplace.visualstudio.com/items?itemName=baseline-lens.baseline-lens)

**Real-time web feature compatibility checking with Baseline data directly in VS Code**

Stop context-switching to MDN and CanIUse. Baseline Lens brings [Baseline](https://web.dev/baseline/) compatibility data directly into your development workflow, helping you make informed decisions about web feature adoption without leaving your IDE.

![Baseline Lens Demo](https://raw.githubusercontent.com/kwesinavilot/baseline-lens/main/assets/demo.gif)

## ✨ Features

- **🔍 Real-time Analysis**: Detects modern web features in CSS, JavaScript, and HTML as you type
- **📊 Inline Indicators**: Visual compatibility status (✅ Widely available, ⚠ Newly available, 🚫 Limited support)
- **💡 Smart Tooltips**: Hover for detailed browser support breakdown and MDN links
- **🚨 Diagnostics**: Integration with VS Code Problems panel for comprehensive issue tracking
- **📋 Project Reports**: Generate compatibility reports for entire projects in JSON or Markdown
- **🔧 Team Configuration**: Share compatibility standards across your team
- **🎯 Smart Suggestions**: Get fallback recommendations and alternative approaches
- **⚡ Performance Optimized**: Lightweight, local analysis with sub-100ms response times

## 🚀 Quick Start

### Installation

1. **From VS Code Marketplace** (Recommended)
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
   - Search for "Baseline Lens"
   - Click Install

2. **From Command Line**
   ```bash
   code --install-extension baseline-lens.baseline-lens
   ```

3. **Manual Installation**
   - Download the `.vsix` file from [releases](https://github.com/kwesinavilot/baseline-lens/releases)
   - Run `code --install-extension baseline-lens-x.x.x.vsix`

### First Steps

1. **Open any web project** with CSS, JavaScript, or HTML files
2. **Start coding** - Baseline Lens automatically activates and begins analysis
3. **Look for indicators** - ✅ ⚠ 🚫 symbols appear next to web features
4. **Hover for details** - Get browser support breakdown and MDN links
5. **Check Problems panel** - View all compatibility issues in one place

## 📖 Usage

### Inline Compatibility Indicators

Baseline Lens shows real-time compatibility status as you code:

```css
/* ✅ Widely available - safe to use */
.container {
  display: flex;
  gap: 1rem;
}

/* ⚠ Newly available - use with caution */
.card {
  container-type: inline-size;
}

/* 🚫 Limited support - needs fallback */
.element:has(.child) {
  color: red;
}
```

### Hover Information

Hover over any indicator to see:
- **Browser support breakdown** with version numbers
- **Baseline status** and availability timeline
- **MDN documentation** links
- **Polyfill suggestions** when available
- **Alternative approaches** for limited-support features

### Project Reports

Generate comprehensive compatibility reports:

1. Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Run "Baseline Lens: Generate Report"
3. Choose output format (JSON or Markdown)
4. Review feature usage and compatibility status

### Team Configuration

Share compatibility standards across your team:

```json
// .baseline-lens.json
{
  "supportThreshold": 95,
  "diagnosticSeverity": "warning",
  "customBrowserMatrix": [
    "chrome >= 90",
    "firefox >= 88",
    "safari >= 14"
  ],
  "excludePatterns": [
    "**/vendor/**",
    "**/legacy/**"
  ]
}
```

## ⚙️ Configuration

### Extension Settings

Access settings via File → Preferences → Settings → Extensions → Baseline Lens:

| Setting | Default | Description |
|---------|---------|-------------|
| `enabledFileTypes` | `["css", "scss", "javascript", "html", "vue"]` | File types to analyze |
| `supportThreshold` | `90` | Minimum support percentage for "safe" features |
| `showInlineIndicators` | `true` | Show visual indicators in editor |
| `diagnosticSeverity` | `"warning"` | Severity level for compatibility issues |
| `excludePatterns` | `["**/node_modules/**"]` | Files/folders to exclude from analysis |

### Workspace Configuration

Create `.baseline-lens.json` in your project root:

```json
{
  "supportThreshold": 95,
  "diagnosticSeverity": "error",
  "baselineStatusMapping": {
    "widely_available": "info",
    "newly_available": "warning", 
    "limited_availability": "error"
  },
  "enabledAnalyzers": {
    "css": true,
    "javascript": true,
    "html": true
  }
}
```

## 🔧 Commands

| Command | Description |
|---------|-------------|
| `Baseline Lens: Generate Report` | Create project-wide compatibility report |
| `Baseline Lens: Refresh Analysis` | Re-analyze current file |
| `Baseline Lens: Toggle Inline Indicators` | Show/hide visual indicators |
| `Baseline Lens: Export Team Configuration` | Export current settings for team sharing |

## 🌐 Supported Technologies

### Languages & Frameworks
- **CSS**: Pure CSS, SCSS, Less, CSS-in-JS, styled-components
- **JavaScript**: ES5+, TypeScript, JSX, Node.js APIs
- **HTML**: HTML5, Web Components, framework templates
- **Frameworks**: React, Vue, Angular, Svelte

### Web Features Detected
- **CSS**: Properties, selectors, at-rules, functions, pseudo-classes
- **JavaScript**: Web APIs, built-in objects, modern syntax, DOM methods
- **HTML**: Elements, attributes, input types, ARIA properties

## 🚀 Performance

- **Analysis Speed**: <100ms for typical files
- **Memory Usage**: <50MB for large projects (1000+ files)
- **Startup Time**: <2 seconds extension activation
- **File Size Limit**: 10MB per file (configurable)

## 🤝 Contributing

We welcome contributions! See our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone repository
git clone https://github.com/kwesinavilot/baseline-lens.git
cd baseline-lens

# Install dependencies
npm install

# Start development
npm run watch

# Run tests
npm test

# Package extension
npm run package
```

## 📚 Documentation

- [User Guide](docs/USER_GUIDE.md) - Comprehensive usage documentation
- [Configuration Guide](docs/CONFIGURATION.md) - Detailed configuration options
- [API Documentation](docs/API_DOCUMENTATION.md) - Extension API reference
- [Architecture Guide](docs/ARCHITECTURE.md) - Technical implementation details
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions

## 🐛 Issues & Support

- **Bug Reports**: [GitHub Issues](https://github.com/kwesinavilot/baseline-lens/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/kwesinavilot/baseline-lens/discussions)
- **Documentation**: [Wiki](https://github.com/kwesinavilot/baseline-lens/wiki)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Baseline](https://web.dev/baseline/) - Web platform compatibility standard
- [web-features](https://github.com/web-platform-dx/web-features) - Compatibility data source
- [VS Code Extension API](https://code.visualstudio.com/api) - Platform foundation

---

**Made with ❤️ for the web development community**