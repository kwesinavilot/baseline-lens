# Changelog

All notable changes to the "Baseline Lens" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.12.0] - 2025-01-03

### Added
- **CLI Integration & Supercharged Workflow**
  - Seamless integration with Baseline Lens CLI for enhanced development workflows
  - Automatic CLI detection with status bar integration showing availability
  - Enhanced commands when CLI is available: Project Analysis, Git Hooks Setup, CI/CD Configuration, Smart Config Generation
  - CLI command menu accessible via Command Palette for quick access to all CLI features
  - Terminal integration for running CLI commands directly from VS Code
  - Smart install prompts when CLI features are accessed without CLI installed
  - Progressive enhancement - extension works fully without CLI, enhanced when both are present
  - Shared configuration support between extension and CLI using `.baseline-lens.json`

- **Enhanced Project Setup**
  - Smart project detection and framework-specific configuration generation
  - Git hooks setup for pre-commit and pre-push compatibility checking
  - CI/CD configuration generation for GitHub Actions, GitLab CI, Azure Pipelines, and Jenkins
  - Team collaboration features with shared configuration and automated setup

- **CLI Integration Documentation**
  - Comprehensive CLI integration guide with installation, usage, and best practices
  - Feature matrix comparing extension-only, CLI-only, and combined usage
  - Migration guide for existing users to add CLI capabilities
  - Advanced usage examples with custom workflows and keyboard shortcuts

### Changed
- Enhanced status bar to show CLI availability and provide quick access to CLI commands
- Updated Command Palette with CLI-specific commands when CLI is detected
- Improved extension architecture to support optional CLI integration without dependencies

## [0.11.0] - 2025-01-03

### Added
- **Keyboard Shortcuts**
  - `Ctrl+Shift+B R` / `Cmd+Shift+B R` - Generate Baseline Report
  - `Ctrl+Shift+B A` / `Cmd+Shift+B A` - Refresh Analysis
  - `Ctrl+Shift+B I` / `Cmd+Shift+B I` - Toggle Inline Indicators
  - `Ctrl+Shift+B S` / `Cmd+Shift+B S` - Open Baseline Lens Settings

- **Settings Access Command**
  - New "Open Baseline Lens Settings" command in Command Palette
  - Direct access to extension configuration from VS Code settings

- **Toggle Commands**
  - "Toggle Diagnostics" command to show/hide warnings in Problems panel
  - Inline indicators now disabled by default for cleaner editor experience
  - New `showDiagnostics` setting for quiet mode operation

- **Comprehensive Test Files**
  - Modern CSS test file with container queries, subgrid, :has() selector, and color functions
  - Vue 3 component with Composition API and modern web features
  - Svelte component demonstrating framework-specific syntax with modern APIs
  - Mixed compatibility levels for thorough extension testing

### Changed
- **Default Settings**
  - Inline indicators (✅ ⚠️ 🚫) now disabled by default
  - Users can enable via toggle command or settings
  - Cleaner editor experience out of the box

### Fixed
- **Report Generation Accuracy**
  - Fixed "Total Features: 0" issue in compatibility reports
  - Corrected percentage calculations for feature status breakdown
  - Added transparency note about incomplete compatibility data for some features
  - Improved feature processing to include all detected features regardless of web-features database availability

- **Toggle Inline Indicators**
  - Fixed command not working due to missing configuration listener
  - Added immediate visual feedback when toggling indicators
  - Proper cleanup of decorations when disabled

- **Vue and Svelte Framework Support**
  - Fixed analysis not working in Vue and Svelte files
  - Properly extracts and analyzes `<style>` and `<script>` sections
  - Correct line number mapping for detected features
  - Added React/JSX/TSX file types to default configuration

## [0.10.0] - 2025-01-03

### Added
- **Dynamic Feature Detection System**
  - Replaced hardcoded feature mappings with dynamic BCD data lookup
  - Automatic detection of any CSS property, JavaScript API, or HTML element in BCD database
  - Multi-path BCD key resolution for comprehensive feature coverage
  - Real-time validation against actual MDN Browser Compatibility Data

### Changed
- **Improved CSS Analysis Priority**
  - CSS analyzer now prioritizes property-level compatibility over value-specific compatibility
  - Better alignment with VS Code's built-in CSS analysis behavior
  - Focuses on base features (e.g., `transform`) rather than specific implementations (`transform:-sin45deg`)

- **Enhanced Hover UI Design**
  - Replaced browser checkmarks with colored browser icons (🟡 Chrome, 🟠 Firefox, 🔵 Safari, 🟢 Edge)
  - Changed limited availability warnings from red to yellow for better visual hierarchy
  - Reduced font sizes of section headings for more compact hover cards
  - External links now use base feature names for better search results
  - Cleaner, more focused hover card presentation

### Fixed
- **Feature Mapping Accuracy**
  - Eliminated hardcoded lists of CSS values, JavaScript APIs, and HTML attributes
  - Dynamic feature detection ensures comprehensive coverage without manual maintenance
  - Proper BCD key formatting for accurate compatibility lookups

## [0.9.0] - 2025-10-01

### Added
- **Real Web-Features Integration**
  - Integrated actual web-features package for authentic compatibility data
  - Added @mdn/browser-compat-data package for comprehensive BCD analysis
  - Implemented granular BCD key mapping for CSS properties and values
  - Real baseline status computation using direct BCD data analysis

### Fixed
- **Extension Activation and Analysis**
  - Fixed duplicate command registration errors during extension reloading
  - Resolved analyzer registration issues preventing feature detection
  - Fixed BCD key format mapping for proper compatibility lookups
  - Corrected TypeScript compilation errors with compute-baseline package

### Changed
- **Compatibility Analysis Engine**
  - Transitioned from mock data to real web-features and BCD integration
  - Updated CSS analyzer to use granular property-value BCD keys
  - Enhanced compatibility service with direct BCD data traversal
  - Improved feature filtering to highlight only non-widely-available features

## [0.8.0] - 2025-10-01

### Added
- **Robust Command Registration System**
  - New CommandManager class for safe command registration with duplicate command handling
  - Command registration utilities with comprehensive error handling and recovery mechanisms
  - Development mode detection with enhanced logging for debugging command registration issues
  - Diagnostic information system for troubleshooting command registration problems
  - Fallback mode for partial functionality when commands fail to register
  - Unit test suite for CommandManager functionality with comprehensive test coverage

### Improved
- **Enhanced Extension Lifecycle Management**
  - Refactored extension.ts to use CommandManager for all command registrations
  - Enhanced deactivate function with proper cleanup verification and resource leak prevention
  - Improved service disposal order with comprehensive error handling and logging
  - Added cleanup verification to ensure all services are properly disposed
  - Enhanced error handling during extension activation with better user feedback

### Fixed
- Command registration conflicts during development and extension reloading
- Resource leaks during extension deactivation
- Proper disposal of all services in correct order to prevent memory leaks

## [0.7.3] - 2025-10-01

### Improved
- **Enhanced Command Registration System**
  - Refactored extension.ts to use CommandManager for safer command registration
  - Added automatic conflict resolution and graceful error handling for command registration failures
  - Implemented proper cleanup and disposal of commands during extension deactivation
  - Enhanced reliability with fallback mode and retry mechanisms for failed command registrations

## [0.7.2] - 2025-09-30

### Changed
- **Enhanced Testing Documentation**
  - Converted usability testing guide to comprehensive User Acceptance Testing (UAT) specification
  - Added 10 detailed UAT scenarios with clear business requirements and acceptance criteria
  - Implemented formal UAT execution framework with priority levels (Critical/High/Medium)
  - Added business value validation metrics and stakeholder approval process
  - Created structured test session templates and results documentation
  - Enhanced test scenarios with specific user stories and expected outcomes
  - Added comprehensive completion criteria for production release validation

### Improved
- UAT scenarios now include detailed test steps, sample code, and binary pass/fail criteria
- Professional UAT documentation suitable for QA teams and business stakeholders
- Clear priority classification for release decision-making
- Formal approval workflow with tester and stakeholder sign-off requirements

## [0.7.1] - 2025-09-30

### Fixed
- **TypeScript Compatibility Issue**
  - Fixed `Property 'catch' does not exist on type 'Thenable<unknown>'` error in hover provider
  - Wrapped `vscode.commands.executeCommand` with `Promise.resolve()` to enable proper error handling
  - Improved walkthrough tracking reliability for hover events

## [0.7.0] - 2025-09-30

### Added
- **Interactive Walkthrough Onboarding Experience**
  - Complete VS Code walkthrough with 6 step-by-step interactive guides
  - Automatic walkthrough launch on first extension activation
  - Smart completion events that mark steps as done when users perform actions
  - Rich markdown content for each step with practical tips and guidance
  - Interactive command links embedded directly in walkthrough steps
  - Manual walkthrough access via Command Palette for returning users

- **Enhanced User Onboarding**
  - Step 1: Open web files (CSS, JS, HTML) with automatic completion detection
  - Step 2: Discover compatibility indicators (✅, ⚠️, 🚫) with hover tracking
  - Step 3: Review Problems panel integration with automatic navigation
  - Step 4: Generate project compatibility reports with guided workflow
  - Step 5: Configure extension settings with direct settings access
  - Step 6: Explore advanced features with community and documentation links

- **New Commands and Integration**
  - `baseline-lens.showWalkthrough` - Manually trigger getting started guide
  - `baseline-lens.openDocumentation` - Direct link to extension documentation
  - `baseline-lens.openCommunity` - Access to GitHub discussions and community
  - Internal hover tracking command for walkthrough step completion
  - Automatic first-time user detection with persistent state management

- **Rich Media Content**
  - Comprehensive markdown guides for each walkthrough step
  - Visual explanations of compatibility indicators and their meanings
  - Detailed configuration guidance with practical examples
  - Advanced feature explanations including CI/CD integration and team collaboration
  - Community resources and contribution guidelines

### Changed
- Enhanced hover provider to emit tracking events for walkthrough completion
- Updated package.json with complete walkthrough configuration and new commands
- Improved extension activation flow with intelligent first-time user experience
- Added proper command registration and disposal for walkthrough functionality

### Fixed
- Extension activation timing to ensure walkthrough displays correctly
- Command registration order to prevent walkthrough initialization issues
- Hover provider integration with walkthrough step tracking

## [0.6.0] - 2025-09-30

### Added
- **Extension Packaging and Documentation**
  - Comprehensive README with installation instructions, usage examples, and configuration guide
  - Complete marketplace preparation including publisher information and metadata
  - Contributing guidelines and development setup documentation
  - Troubleshooting guide with common issues and solutions
  - FAQ covering general questions, configuration, and development topics
  - Publishing guide with automated release workflows
  - GitHub Actions workflow for automated testing, packaging, and publishing
  - Release preparation scripts for version management and quality assurance

- **Comprehensive test suite and performance optimization**
  - End-to-end integration tests covering complete workflows
  - Performance tests for large files (up to 10MB) and projects (1000+ files)
  - Memory usage monitoring and optimization
  - Startup time optimization achieving <2 second activation requirement
  - Cross-platform compatibility testing
  - Automated test data generation for various feature scenarios

- **Advanced configuration and customization system**
  - VS Code settings integration for extension configuration
  - Support threshold customization and browser matrix settings
  - Team-level configuration support with workspace settings
  - File type and pattern exclusion capabilities
  - Configuration validation and default value handling

- **Project-wide report generation capabilities**
  - ReportGenerator class for scanning entire projects
  - JSON and Markdown report export formats
  - Feature categorization by support level and risk assessment
  - Command integration for "Generate Baseline Report" functionality
  - Progress reporting for large project scans

- **Real-time file monitoring system**
  - FileWatcherService to monitor document changes
  - Debounced analysis triggers to optimize performance
  - Incremental analysis for large files and projects
  - Proper handling of file open, close, and change events

### Changed
- Enhanced extension performance with optimized startup and analysis times
- Improved memory management for large-scale project analysis
- Updated all services to support comprehensive configuration system
- Enhanced error handling with better diagnostic reporting
- Prepared extension for VS Code Marketplace submission with complete documentation

### Fixed
- Performance bottlenecks in large project analysis
- Memory leaks during extended usage
- Configuration synchronization issues across workspace settings

## [0.5.0] - 2025-09-17

### Added
- Comprehensive error handling and logging system
  - Centralized ErrorHandler service with categorized error types (parsing, timeout, data loading, configuration, file size)
  - Structured logging with configurable levels and VS Code output channel integration
  - Error statistics tracking and performance monitoring
  - Graceful error recovery with detailed diagnostic reporting

- Intelligent fallback analysis system
  - FallbackAnalyzer service providing regex-based feature detection when full parsing fails
  - Language-specific fallback strategies for CSS, JavaScript, HTML, and generic patterns
  - Maintains functionality even with malformed or unparseable files
  - Comprehensive pattern matching for modern web features

- Advanced timeout protection and concurrency management
  - TimeoutManager service with configurable timeouts based on file size
  - Concurrent analysis limits to prevent resource exhaustion
  - Progress reporting integration with VS Code progress API
  - Abort controller support for cancellation of long-running operations
  - Automatic cleanup of expired analysis tasks

- Robust data loading with fallback mechanisms
  - Enhanced CompatibilityDataService with retry logic and exponential backoff
  - Fallback compatibility dataset when web-features loading fails
  - Graceful degradation ensuring extension remains functional
  - Background retry attempts to upgrade from fallback to full dataset

- Enhanced analyzer reliability
  - All analyzers updated with safe analysis patterns and error context tracking
  - Content validation before processing to prevent crashes
  - Improved error messages with line/column information extraction
  - Comprehensive test coverage for error scenarios

### Changed
- Updated all core analyzers (CSS, JavaScript, HTML) to use new error handling system
- Enhanced AnalysisEngine with timeout protection and batch processing capabilities
- Improved extension activation with proper error handling and configuration
- Added error statistics command for debugging and monitoring

### Fixed
- Parsing failures no longer crash the extension
- Large files are handled gracefully with appropriate timeouts
- Network failures during data loading don't prevent extension functionality
- Memory leaks from long-running analysis operations

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