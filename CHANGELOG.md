# Changelog

All notable changes to the "Baseline Lens" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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