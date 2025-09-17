# Baseline Lens API Documentation

## Table of Contents
- [Core Interfaces](#core-interfaces)
- [Analysis Engine API](#analysis-engine-api)
- [Compatibility Service API](#compatibility-service-api)
- [UI Service API](#ui-service-api)
- [File Watcher Service API](#file-watcher-service-api)
- [Hover Provider API](#hover-provider-api)
- [Analyzer Interface](#analyzer-interface)
- [Extension Configuration](#extension-configuration)
- [Events and Lifecycle](#events-and-lifecycle)

## Core Interfaces

### DetectedFeature
Represents a web feature detected in source code.

```typescript
interface DetectedFeature {
    id: string;                    // Web-features identifier
    name: string;                  // Human-readable feature name
    type: 'css' | 'javascript' | 'html';  // Feature type
    range: vscode.Range;           // Location in document
    baselineStatus: BaselineStatus; // Compatibility information
    context?: string;              // Additional context
    severity: 'error' | 'warning' | 'info'; // Diagnostic severity
}
```

**Example**:
```typescript
{
    id: 'css-grid',
    name: 'CSS Grid Layout',
    type: 'css',
    range: new vscode.Range(5, 10, 5, 14), // Line 5, chars 10-14
    baselineStatus: {
        status: 'widely_available',
        baseline_date: '2020-01-15',
        support: { /* browser support data */ }
    },
    context: 'CSS property: display',
    severity: 'info'
}
```

### BaselineStatus
Represents the compatibility status of a web feature.

```typescript
interface BaselineStatus {
    status: 'widely_available' | 'newly_available' | 'limited_availability';
    baseline_date?: string;        // ISO date when feature became baseline
    high_date?: string;           // Date for high support threshold
    low_date?: string;            // Date for low support threshold
    support: {                    // Browser support details
        [browser: string]: {
            version_added: string | boolean;
            version_removed?: string | boolean;
            notes?: string;
        };
    };
}
```

### AnalysisResult
Result of analyzing a document for web features.

```typescript
interface AnalysisResult {
    features: DetectedFeature[];           // Detected features
    diagnostics: vscode.Diagnostic[];     // VS Code diagnostics
    decorations: vscode.DecorationOptions[]; // Inline decorations
}
```

### ProjectAnalysisResult
Result of analyzing an entire project.

```typescript
interface ProjectAnalysisResult {
    totalFiles: number;           // Total files found
    analyzedFiles: number;        // Successfully analyzed files
    features: DetectedFeature[];  // All detected features
    errors: AnalysisError[];      // Analysis errors
    summary: {                    // Summary statistics
        widelyAvailable: number;
        newlyAvailable: number;
        limitedAvailability: number;
    };
}
```

## Analysis Engine API

### Class: AnalysisEngine

The central orchestrator for feature detection across file types.

#### Constructor
```typescript
constructor()
```

#### Methods

##### registerAnalyzer
Registers an analyzer for specific file types.

```typescript
registerAnalyzer(languages: string[], analyzer: BaseAnalyzer): void
```

**Parameters**:
- `languages`: Array of language IDs (e.g., `['css', 'scss']`)
- `analyzer`: Analyzer instance implementing `BaseAnalyzer`

**Example**:
```typescript
const cssAnalyzer = new CSSAnalyzer();
analysisEngine.registerAnalyzer(['css', 'scss', 'less'], cssAnalyzer);
```

##### analyzeDocument
Analyzes a single document for web features.

```typescript
async analyzeDocument(document: vscode.TextDocument): Promise<AnalysisResult>
```

**Parameters**:
- `document`: VS Code text document to analyze

**Returns**: Promise resolving to analysis results

**Example**:
```typescript
const result = await analysisEngine.analyzeDocument(document);
console.log(`Found ${result.features.length} features`);
```

##### analyzeProject
Analyzes entire project for web features.

```typescript
async analyzeProject(): Promise<ProjectAnalysisResult>
```

**Returns**: Promise resolving to project analysis results

**Throws**: Error if no workspace folder is found

**Example**:
```typescript
try {
    const result = await analysisEngine.analyzeProject();
    console.log(`Analyzed ${result.analyzedFiles}/${result.totalFiles} files`);
} catch (error) {
    console.error('Project analysis failed:', error);
}
```

## Compatibility Service API

### Class: CompatibilityDataService

Manages web-features dataset and compatibility lookups.

#### Constructor
```typescript
constructor()
```

#### Methods

##### initialize
Initializes the service by loading the web-features dataset.

```typescript
async initialize(): Promise<void>
```

**Throws**: Error if dataset loading fails

**Example**:
```typescript
const service = new CompatibilityDataService();
await service.initialize();
```

##### getFeatureStatus
Gets compatibility status for a feature.

```typescript
getFeatureStatus(featureId: string): BaselineStatus | null
```

**Parameters**:
- `featureId`: Web-features identifier

**Returns**: Baseline status or null if not found

**Example**:
```typescript
const status = service.getFeatureStatus('css-grid');
if (status) {
    console.log(`CSS Grid status: ${status.status}`);
}
```

##### searchFeatures
Searches for features by name or description.

```typescript
searchFeatures(query: string): WebFeature[]
```

**Parameters**:
- `query`: Search query string

**Returns**: Array of matching features

**Example**:
```typescript
const gridFeatures = service.searchFeatures('grid');
console.log(`Found ${gridFeatures.length} grid-related features`);
```

##### getFeatureDetails
Gets detailed information about a feature.

```typescript
getFeatureDetails(featureId: string): WebFeatureDetails | null
```

**Parameters**:
- `featureId`: Web-features identifier

**Returns**: Feature details or null if not found

**Example**:
```typescript
const details = service.getFeatureDetails('css-grid');
if (details) {
    console.log(`Description: ${details.description}`);
    console.log(`MDN URL: ${details.mdn_url}`);
}
```

##### clearCache
Clears internal caches.

```typescript
clearCache(): void
```

##### getCacheStats
Gets cache statistics.

```typescript
getCacheStats(): {
    featureCache: number;
    searchCache: number;
    totalFeatures: number;
}
```

##### isReady
Checks if service is initialized and ready.

```typescript
isReady(): boolean
```

## UI Service API

### Class: UIService

Manages VS Code UI integration including diagnostics and decorations.

#### Constructor
```typescript
constructor(compatibilityService: CompatibilityDataService)
```

#### Methods

##### createDiagnosticsFromFeatures
Converts detected features to VS Code diagnostics.

```typescript
createDiagnosticsFromFeatures(features: DetectedFeature[]): vscode.Diagnostic[]
```

**Parameters**:
- `features`: Array of detected features

**Returns**: Array of VS Code diagnostics

##### createDecorationsFromFeatures
Creates inline decorations from detected features.

```typescript
createDecorationsFromFeatures(features: DetectedFeature[]): Map<string, vscode.DecorationOptions[]>
```

**Parameters**:
- `features`: Array of detected features

**Returns**: Map of decoration type to decoration options

##### updateDiagnostics
Updates diagnostics for a document.

```typescript
updateDiagnostics(document: vscode.TextDocument, features: DetectedFeature[]): void
```

**Parameters**:
- `document`: Target document
- `features`: Detected features to create diagnostics from

##### updateDecorations
Updates inline decorations for a document.

```typescript
updateDecorations(document: vscode.TextDocument, features: DetectedFeature[]): void
```

**Parameters**:
- `document`: Target document
- `features`: Detected features to create decorations from

##### clearDecorations
Clears decorations for a document.

```typescript
clearDecorations(document: vscode.TextDocument): void
```

##### registerCommands
Registers extension commands.

```typescript
registerCommands(context: vscode.ExtensionContext): void
```

##### dispose
Disposes of UI service resources.

```typescript
dispose(): void
```

## File Watcher Service API

### Class: FileWatcherService

Monitors document changes and triggers analysis with performance optimizations.

#### Constructor
```typescript
constructor(
    analysisEngine: AnalysisEngine,
    uiService: UIService,
    config?: Partial<FileWatcherConfig>
)
```

**Parameters**:
- `analysisEngine`: Analysis engine instance
- `uiService`: UI service instance
- `config`: Optional configuration overrides

#### Configuration Interface
```typescript
interface FileWatcherConfig {
    debounceDelay: number;              // Debounce delay in ms (default: 300)
    maxFileSize: number;                // Max file size in bytes (default: 10MB)
    supportedLanguages: string[];       // Supported language IDs
    incrementalAnalysisThreshold: number; // Line count threshold (default: 1000)
}
```

#### Methods

##### initialize
Initializes the service and analyzes open documents.

```typescript
async initialize(): Promise<void>
```

##### refreshAllDocuments
Forces analysis of all open documents.

```typescript
async refreshAllDocuments(): Promise<void>
```

##### getStats
Gets statistics about pending analyses.

```typescript
getStats(): {
    pendingCount: number;
    totalChanges: number;
}
```

##### updateConfig
Updates service configuration.

```typescript
updateConfig(newConfig: Partial<FileWatcherConfig>): void
```

##### dispose
Disposes of service resources.

```typescript
dispose(): void
```

## Hover Provider API

### Class: HoverProvider

Provides detailed compatibility information on hover.

#### Constructor
```typescript
constructor(compatibilityService: CompatibilityDataService)
```

#### Methods

##### updateFeatures
Updates feature map for a document.

```typescript
updateFeatures(document: vscode.TextDocument, features: DetectedFeature[]): void
```

##### clearFeatures
Clears features for a document.

```typescript
clearFeatures(document: vscode.TextDocument): void
```

##### provideHover
Provides hover information (implements VS Code HoverProvider).

```typescript
provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
): vscode.ProviderResult<vscode.Hover>
```

##### clearCache
Clears hover content cache.

```typescript
clearCache(): void
```

##### getCacheStats
Gets cache statistics.

```typescript
getCacheStats(): {
    size: number;
    timeout: number;
}
```

##### dispose
Disposes of provider resources.

```typescript
dispose(): void
```

## Analyzer Interface

### Abstract Class: BaseAnalyzer

Base interface that all analyzers must implement.

```typescript
interface BaseAnalyzer {
    analyze(content: string, document: vscode.TextDocument): Promise<DetectedFeature[]>;
    getSupportedLanguages(): string[];
}
```

#### Methods

##### analyze
Analyzes content and returns detected features.

```typescript
async analyze(content: string, document: vscode.TextDocument): Promise<DetectedFeature[]>
```

**Parameters**:
- `content`: File content to analyze
- `document`: VS Code document context

**Returns**: Promise resolving to detected features

##### getSupportedLanguages
Returns supported language IDs.

```typescript
getSupportedLanguages(): string[]
```

**Returns**: Array of supported language identifiers

### Concrete Analyzers

#### CSSAnalyzer
Analyzes CSS, SCSS, SASS, Less, and CSS-in-JS.

**Supported Languages**: `['css', 'scss', 'sass', 'less', 'stylus']`

**Detected Features**:
- CSS properties (`display`, `grid-template-columns`)
- CSS functions (`clamp()`, `var()`, `color-mix()`)
- CSS selectors (`:has()`, `:is()`, `::backdrop`)
- At-rules (`@container`, `@layer`, `@supports`)

#### JavaScriptAnalyzer
Analyzes JavaScript, TypeScript, JSX, and TSX.

**Supported Languages**: `['javascript', 'typescript', 'javascriptreact', 'typescriptreact']`

**Detected Features**:
- Web APIs (`fetch()`, `IntersectionObserver`, `navigator.geolocation`)
- Modern syntax (arrow functions, optional chaining, async/await)
- Built-in objects (`Promise.allSettled()`, `Array.at()`, `BigInt`)

#### HTMLAnalyzer
Analyzes HTML and template files.

**Supported Languages**: `['html', 'vue', 'svelte']`

**Detected Features**:
- HTML elements and attributes
- Input types and form features
- Embedded CSS and JavaScript

## Extension Configuration

### Configuration Schema
```typescript
interface ExtensionConfig {
    enabledFileTypes: string[];        // File types to analyze
    supportThreshold: number;          // Minimum support percentage (0-100)
    showInlineIndicators: boolean;     // Show/hide inline decorations
    diagnosticSeverity: 'error' | 'warning' | 'info'; // Diagnostic severity
    excludePatterns: string[];         // File patterns to exclude
}
```

### Accessing Configuration
```typescript
const config = vscode.workspace.getConfiguration('baseline-lens');
const threshold = config.get<number>('supportThreshold', 90);
const enabledTypes = config.get<string[]>('enabledFileTypes', []);
```

### Configuration Change Events
```typescript
vscode.workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration('baseline-lens')) {
        // Handle configuration changes
        updateAnalysisSettings();
    }
});
```

## Events and Lifecycle

### Extension Activation
```typescript
export async function activate(context: vscode.ExtensionContext) {
    // 1. Initialize compatibility service
    const compatibilityService = new CompatibilityDataService();
    await compatibilityService.initialize();
    
    // 2. Create analysis engine
    const analysisEngine = new AnalysisEngine();
    
    // 3. Register analyzers
    analysisEngine.registerAnalyzer(['css', 'scss'], new CSSAnalyzer());
    analysisEngine.registerAnalyzer(['javascript', 'typescript'], new JavaScriptAnalyzer());
    
    // 4. Create UI service
    const uiService = new UIService(compatibilityService);
    
    // 5. Initialize file watcher
    const fileWatcherService = new FileWatcherService(analysisEngine, uiService);
    await fileWatcherService.initialize();
    
    // 6. Register commands and providers
    uiService.registerCommands(context);
    
    // 7. Add to subscriptions for cleanup
    context.subscriptions.push(
        fileWatcherService,
        uiService,
        // ... other disposables
    );
}
```

### Extension Deactivation
```typescript
export function deactivate() {
    // Cleanup is handled automatically through context.subscriptions
    // Individual services implement dispose() for resource cleanup
}
```

### Document Events
```typescript
// Document change (handled by FileWatcherService)
vscode.workspace.onDidChangeTextDocument(event => {
    // Debounced analysis trigger
});

// Document open
vscode.workspace.onDidOpenTextDocument(document => {
    // Immediate analysis for newly opened documents
});

// Document close
vscode.workspace.onDidCloseTextDocument(document => {
    // Cleanup diagnostics and decorations
});

// Document save
vscode.workspace.onDidSaveTextDocument(document => {
    // Force immediate analysis on save
});
```

### Error Handling
```typescript
try {
    const result = await analysisEngine.analyzeDocument(document);
    // Handle successful analysis
} catch (error) {
    // Log error and provide fallback
    console.error('Analysis failed:', error);
    
    // Create error diagnostic
    const diagnostic = new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 0),
        `Analysis failed: ${error.message}`,
        vscode.DiagnosticSeverity.Information
    );
}
```

### Performance Monitoring
```typescript
// Analysis performance tracking
const startTime = Date.now();
const result = await analyzer.analyze(content, document);
const analysisTime = Date.now() - startTime;

if (analysisTime > 100) {
    console.log(`Slow analysis: ${document.fileName} took ${analysisTime}ms`);
}
```