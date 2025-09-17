# Changelog

All notable changes to the "Baseline Lens" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2025-09-17

### Added
- Smart suggestion engine for risky web features with safer alternatives
  - Intelligent risk assessment based on baseline status (low/medium/high)
  - Feature-specific fallback mappings for CSS Grid, CSS Variables, Fetch API, and ES6 modules
  - Comprehensive polyfill suggestions with installation commands and usage examples
  - Educational hints explaining feature availability and best practices
  - Generic alternatives for CSS (progressive enhancement), JavaScript (feature detection), and HTML (graceful degradation)

- VS Code code action provider for quick fixes and fallback snippets
  - Quick fix actions to replace risky features with safer alternatives
  - Polyfill installation guidance with copy-to-clipboard functionality
  - Educational webview panels with detailed feature information and recommendations
  - External documentation links to MDN Web Docs and Can I Use
  - Integration with VS Code's diagnostic system for actionable suggestions

- Enhanced diagnostic messages with contextual recommendations
  - Improved diagnostic text with specific guidance for newly available and limited availability features
  - Integration between suggestion engine and code action provider
  - Automatic feature updates for hover and code action providers

### Changed
- Enhanced UIService with suggestion engine and code action provider integration
- Updated package.json with new command definitions for suggestion features
- Improved diagnostic creation with actionable recommendations

## [0.3.0] - 2025-09-17

### Added
- Complete CSS feature analyzer with PostCSS integration
  - Detection of CSS properties (Grid, Flexbox, custom properties, modern layout features)
  - CSS selector analysis (modern pseudo-classes like `:has`, `:focus-visible`, pseudo-elements)
  - CSS at-rule detection (`@media`, `@container`, `@keyframes`, `@layer`)
  - CSS function analysis (`clamp()`, `min()`, `max()`, `calc()`, gradients, color functions)
  - CSS-in-JS support for styled-components and emotion
  - Comprehensive feature mapping to web-features identifiers
  - Extensive unit test coverage for all CSS feature detection scenarios

- Complete JavaScript feature analyzer with Acorn AST parsing
  - Web API detection and modern JavaScript syntax analysis
  - TypeScript and JSX support
  - Built-in object and method detection
  - Feature mapping to web-features identifiers
  - Comprehensive unit tests for JavaScript feature scenarios

- Complete HTML feature analyzer with parse5 integration
  - HTML element and attribute detection
  - Input type analysis and form feature detection
  - Framework template syntax support (Vue, Angular, Svelte)
  - Inline CSS and JavaScript extraction and analysis
  - Comprehensive unit tests for HTML feature detection

- Advanced hover provider for detailed compatibility information
  - Rich hover tooltips with browser/version breakdown and baseline status
  - Educational content explaining feature availability and recommendations
  - Quick links to MDN documentation, specifications, Can I Use, and polyfill resources
  - Performance-optimized caching system with automatic cleanup
  - Comprehensive browser support tables with visual indicators
  - Context-aware recommendations based on feature status and type

## [0.2.0] - 2025-09-17

### Added
- Complete CompatibilityDataService implementation with web-features dataset integration
- Feature lookup and caching mechanisms for performance optimization
- Intelligent search functionality with fuzzy matching capabilities
- Baseline status conversion from web-features format to extension format
- Enhanced type definitions for WebFeature and WebFeatureDetails interfaces
- Cache management utilities with performance statistics
- Error handling and graceful fallbacks for data loading failures

### Fixed
- TypeScript compilation errors in test suite index file
- Import statement issues with Mocha and glob dependencies
- Type annotations for test callback parameters

### Changed
- Enhanced project structure with proper .gitignore and changelog
- Improved type safety across compatibility service interfaces

## [0.1.0] - 2025-09-16

### Added
- Initial VS Code extension project structure
- Core dependencies including web-features, postcss, acorn, and parse5
- Basic extension configuration with command palette integration
- Support for multiple file types (CSS, SCSS, Less, JavaScript, TypeScript, HTML, Vue, Svelte)
- Extension activation events for supported languages
- Basic service architecture with compatibility, UI, and analysis components
- Type definitions for detected features, baseline status, and analysis results
- Webpack build configuration for extension packaging
- ESLint configuration for code quality
- Basic test infrastructure setup