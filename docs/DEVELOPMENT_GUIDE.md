# Baseline Lens Development Guide

## Table of Contents
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Building and Testing](#building-and-testing)
- [Development Workflow](#development-workflow)
- [Adding New Analyzers](#adding-new-analyzers)
- [Extending Compatibility Data](#extending-compatibility-data)
- [Testing Guidelines](#testing-guidelines)
- [Performance Optimization](#performance-optimization)
- [Debugging](#debugging)
- [Contributing](#contributing)

## Development Setup

### Prerequisites
- **Node.js**: Version 16.x or higher
- **npm**: Version 8.x or higher
- **VS Code**: Latest stable version
- **Git**: For version control

### Initial Setup
1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/baseline-lens.git
   cd baseline-lens
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the extension**:
   ```bash
   npm run compile
   ```

4. **Open in VS Code**:
   ```bash
   code .
   ```

### Development Environment
1. **Press F5** to launch Extension Development Host
2. **Open a test project** in the new VS Code window
3. **Make changes** to the source code
4. **Reload the extension** (Ctrl+R / Cmd+R in Extension Development Host)

## Project Structure

```
baseline-lens/
├── src/                          # Source code
│   ├── analyzers/               # Feature analyzers
│   │   ├── baseAnalyzer.ts     # Abstract base analyzer
│   │   ├── cssAnalyzer.ts      # CSS feature detection
│   │   ├── jsAnalyzer.ts       # JavaScript feature detection
│   │   └── htmlAnalyzer.ts     # HTML feature detection
│   ├── core/                    # Core engine
│   │   └── analysisEngine.ts   # Main analysis orchestrator
│   ├── services/                # Extension services
│   │   ├── compatibilityService.ts  # Web-features data management
│   │   ├── uiService.ts        # VS Code UI integration
│   │   ├── fileWatcherService.ts    # File monitoring
│   │   └── hoverProvider.ts    # Hover information provider
│   ├── types/                   # TypeScript type definitions
│   │   └── index.ts            # Core interfaces and types
│   ├── test/                    # Test files
│   │   ├── suite/              # Test suites
│   │   └── runTest.ts          # Test runner
│   └── extension.ts            # Extension entry point
├── docs/                        # Documentation
├── test/                        # Test resources
├── out/                         # Compiled JavaScript (generated)
├── node_modules/               # Dependencies (generated)
├── package.json                # Extension manifest and dependencies
├── tsconfig.json              # TypeScript configuration
├── webpack.config.js          # Build configuration
└── .eslintrc.json            # Linting configuration
```

### Key Files

#### `src/extension.ts`
Extension entry point that:
- Initializes all services in correct order
- Registers VS Code commands and providers
- Handles extension lifecycle (activate/deactivate)

#### `src/core/analysisEngine.ts`
Central orchestrator that:
- Manages analyzer registration
- Coordinates document and project analysis
- Handles performance optimization and error recovery

#### `src/services/compatibilityService.ts`
Data management service that:
- Loads and processes web-features dataset
- Provides feature lookup and caching
- Converts data to internal formats

#### `src/types/index.ts`
Core type definitions including:
- `DetectedFeature`: Represents a detected web feature
- `BaselineStatus`: Compatibility status information
- `AnalysisResult`: Analysis output format

## Building and Testing

### Build Commands

#### Development Build
```bash
npm run compile
```
Compiles TypeScript to JavaScript in `out/` directory.

#### Production Build
```bash
npm run package
```
Creates optimized webpack bundle for distribution.

#### Watch Mode
```bash
npm run watch
```
Continuously compiles changes during development.

### Testing Commands

#### Run All Tests
```bash
npm test
```

#### Run Tests in Watch Mode
```bash
npm run watch-tests
```

#### Lint Code
```bash
npm run lint
```

#### Type Check
```bash
npm run compile-tests
```

### Package Extension
```bash
npm run package
```
Creates a `.vsix` file for distribution.

## Development Workflow

### 1. Feature Development Cycle

#### Planning Phase
1. **Define requirements** in `docs/` or GitHub issues
2. **Design API interfaces** in `src/types/`
3. **Plan testing strategy** for the feature
4. **Consider performance implications**

#### Implementation Phase
1. **Create feature branch**: `git checkout -b feature/new-analyzer`
2. **Implement core logic** with proper error handling
3. **Add comprehensive tests** for new functionality
4. **Update documentation** as needed
5. **Test in Extension Development Host**

#### Review Phase
1. **Run full test suite**: `npm test`
2. **Check code quality**: `npm run lint`
3. **Test performance** with large files/projects
4. **Verify VS Code integration** works correctly
5. **Update CHANGELOG.md** with changes

### 2. Debugging Workflow

#### Extension Development Host
1. **Set breakpoints** in VS Code
2. **Press F5** to launch debug session
3. **Open test files** in Extension Development Host
4. **Trigger analysis** by editing files
5. **Step through code** in main VS Code window

#### Console Logging
```typescript
// Use console.log for development debugging
console.log('Analysis result:', result);

// Use structured logging for production
console.error('Analysis failed:', {
    file: document.fileName,
    error: error.message,
    timestamp: new Date().toISOString()
});
```

#### Output Channel
```typescript
// Create output channel for extension logs
const outputChannel = vscode.window.createOutputChannel('Baseline Lens');
outputChannel.appendLine('Extension activated');
outputChannel.show(); // Show in Output panel
```

### 3. Performance Testing

#### Large File Testing
```typescript
// Test with files up to 10MB
const largeContent = 'a'.repeat(10 * 1024 * 1024);
const startTime = Date.now();
const result = await analyzer.analyze(largeContent, document);
const duration = Date.now() - startTime;
console.log(`Analysis took ${duration}ms for ${largeContent.length} bytes`);
```

#### Memory Monitoring
```typescript
// Monitor memory usage during analysis
const memBefore = process.memoryUsage();
await analyzeProject();
const memAfter = process.memoryUsage();
console.log('Memory delta:', {
    heapUsed: memAfter.heapUsed - memBefore.heapUsed,
    heapTotal: memAfter.heapTotal - memBefore.heapTotal
});
```

## Adding New Analyzers

### 1. Create Analyzer Class

Create a new file in `src/analyzers/`:

```typescript
// src/analyzers/newAnalyzer.ts
import * as vscode from 'vscode';
import { DetectedFeature, BaselineStatus } from '../types';
import { AbstractBaseAnalyzer } from './baseAnalyzer';

export class NewAnalyzer extends AbstractBaseAnalyzer {
    constructor() {
        super(['newlanguage']); // Supported language IDs
    }

    async analyze(content: string, document: vscode.TextDocument): Promise<DetectedFeature[]> {
        if (!this.validateContentSize(content)) {
            return [];
        }

        try {
            const features: DetectedFeature[] = [];
            
            // Implement your parsing logic here
            // 1. Parse the content (use appropriate parser)
            // 2. Detect web features
            // 3. Create DetectedFeature objects
            // 4. Return results
            
            return features;
        } catch (error) {
            return this.handleParsingError(error, document);
        }
    }

    private detectFeatures(/* parsing result */): DetectedFeature[] {
        // Implement feature detection logic
        // Map detected patterns to web-features identifiers
        // Create appropriate ranges and context information
        return [];
    }
}
```

### 2. Register Analyzer

In `src/extension.ts`:

```typescript
import { NewAnalyzer } from './analyzers/newAnalyzer';

export async function activate(context: vscode.ExtensionContext) {
    // ... existing initialization ...
    
    // Register new analyzer
    const newAnalyzer = new NewAnalyzer();
    analysisEngine.registerAnalyzer(['newlanguage'], newAnalyzer);
    
    // ... rest of activation ...
}
```

### 3. Add Language Support

Update `package.json` to activate on new language:

```json
{
    "activationEvents": [
        "onLanguage:newlanguage"
    ],
    "contributes": {
        "configuration": {
            "properties": {
                "baseline-lens.enabledFileTypes": {
                    "default": ["css", "javascript", "html", "newlanguage"]
                }
            }
        }
    }
}
```

### 4. Create Tests

Create test file in `src/test/suite/`:

```typescript
// src/test/suite/newAnalyzer.test.ts
import * as assert from 'assert';
import * as vscode from 'vscode';
import { NewAnalyzer } from '../../analyzers/newAnalyzer';

suite('NewAnalyzer Test Suite', () => {
    let analyzer: NewAnalyzer;

    setup(() => {
        analyzer = new NewAnalyzer();
    });

    test('should detect basic features', async () => {
        const content = 'sample code with features';
        const document = await vscode.workspace.openTextDocument({
            content,
            language: 'newlanguage'
        });

        const result = await analyzer.analyze(content, document);
        
        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].name, 'Expected Feature');
    });

    test('should handle parsing errors gracefully', async () => {
        const invalidContent = 'invalid syntax';
        const document = await vscode.workspace.openTextDocument({
            content: invalidContent,
            language: 'newlanguage'
        });

        const result = await analyzer.analyze(invalidContent, document);
        
        // Should not throw, should return empty or error diagnostic
        assert.ok(Array.isArray(result));
    });
});
```

## Extending Compatibility Data

### 1. Custom Feature Mappings

Add custom mappings in analyzer classes:

```typescript
// In your analyzer constructor
this.customFeatureMap = new Map([
    ['custom-property', 'web-features-id'],
    ['framework-specific-api', 'corresponding-web-standard']
]);
```

### 2. Framework-Specific Detection

Handle framework-specific patterns:

```typescript
private detectFrameworkFeatures(content: string): DetectedFeature[] {
    const features: DetectedFeature[] = [];
    
    // React-specific patterns
    if (this.isReactFile(document)) {
        features.push(...this.detectReactFeatures(content));
    }
    
    // Vue-specific patterns
    if (this.isVueFile(document)) {
        features.push(...this.detectVueFeatures(content));
    }
    
    return features;
}
```

### 3. Custom Baseline Status

Override baseline status for specific contexts:

```typescript
private getCustomBaselineStatus(featureId: string, context: string): BaselineStatus {
    // Custom logic for specific environments
    if (context.includes('polyfill')) {
        return this.createMockBaselineStatus('widely_available');
    }
    
    return this.getFeatureBaselineStatus(featureId);
}
```

## Testing Guidelines

### 1. Unit Tests

Test individual components in isolation:

```typescript
suite('CompatibilityDataService', () => {
    let service: CompatibilityDataService;

    setup(async () => {
        service = new CompatibilityDataService();
        await service.initialize();
    });

    test('should return feature status', () => {
        const status = service.getFeatureStatus('css-grid');
        assert.ok(status);
        assert.strictEqual(status.status, 'widely_available');
    });

    test('should handle unknown features', () => {
        const status = service.getFeatureStatus('unknown-feature');
        assert.strictEqual(status, null);
    });
});
```

### 2. Integration Tests

Test service interactions:

```typescript
suite('Analysis Integration', () => {
    let engine: AnalysisEngine;
    let compatibilityService: CompatibilityDataService;

    setup(async () => {
        compatibilityService = new CompatibilityDataService();
        await compatibilityService.initialize();
        
        engine = new AnalysisEngine();
        engine.registerAnalyzer(['css'], new CSSAnalyzer());
    });

    test('should analyze CSS document', async () => {
        const document = await vscode.workspace.openTextDocument({
            content: '.grid { display: grid; }',
            language: 'css'
        });

        const result = await engine.analyzeDocument(document);
        
        assert.ok(result.features.length > 0);
        assert.strictEqual(result.features[0].type, 'css');
    });
});
```

### 3. Performance Tests

Test with realistic workloads:

```typescript
suite('Performance Tests', () => {
    test('should handle large files', async () => {
        const largeContent = generateLargeCSSFile(1000); // 1000 rules
        const document = await vscode.workspace.openTextDocument({
            content: largeContent,
            language: 'css'
        });

        const startTime = Date.now();
        const result = await analyzer.analyze(largeContent, document);
        const duration = Date.now() - startTime;

        assert.ok(duration < 1000, `Analysis took ${duration}ms, expected < 1000ms`);
        assert.ok(result.length > 0, 'Should detect features in large file');
    });
});
```

### 4. Test Data Generation

Create realistic test data:

```typescript
function generateTestCSS(): string {
    return `
        .container {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
        }
        
        .item {
            aspect-ratio: 16/9;
            container-type: inline-size;
        }
        
        @container (min-width: 300px) {
            .item { padding: 2rem; }
        }
    `;
}

function generateTestJS(): string {
    return `
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        });
        
        async function fetchData() {
            const response = await fetch('/api/data');
            return response.json();
        }
    `;
}
```

## Performance Optimization

### 1. Caching Strategies

Implement effective caching:

```typescript
class PerformantAnalyzer {
    private parseCache = new Map<string, ParseResult>();
    private featureCache = new Map<string, DetectedFeature[]>();

    async analyze(content: string, document: vscode.TextDocument): Promise<DetectedFeature[]> {
        // Cache key based on content hash
        const contentHash = this.hashContent(content);
        
        // Check cache first
        if (this.featureCache.has(contentHash)) {
            return this.featureCache.get(contentHash)!;
        }

        // Perform analysis
        const features = await this.performAnalysis(content, document);
        
        // Cache results
        this.featureCache.set(contentHash, features);
        
        return features;
    }

    private hashContent(content: string): string {
        // Simple hash for caching (use crypto for production)
        return content.length.toString() + content.slice(0, 100);
    }
}
```

### 2. Debouncing and Throttling

Optimize file watching:

```typescript
class OptimizedFileWatcher {
    private analysisTimeouts = new Map<string, NodeJS.Timeout>();
    private readonly debounceDelay = 300;

    private onDocumentChange(event: vscode.TextDocumentChangeEvent): void {
        const uri = event.document.uri.toString();
        
        // Clear existing timeout
        const existingTimeout = this.analysisTimeouts.get(uri);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }

        // Set new debounced timeout
        const timeout = setTimeout(async () => {
            await this.analyzeDocument(event.document);
            this.analysisTimeouts.delete(uri);
        }, this.debounceDelay);

        this.analysisTimeouts.set(uri, timeout);
    }
}
```

### 3. Memory Management

Implement proper cleanup:

```typescript
class MemoryEfficientService {
    private readonly maxCacheSize = 100;
    private cache = new Map<string, CacheEntry>();

    addToCache(key: string, value: any): void {
        // Implement LRU eviction
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    dispose(): void {
        this.cache.clear();
        // Clear other resources
    }
}
```

## Debugging

### 1. Extension Development Host Debugging

Set up debugging configuration in `.vscode/launch.json`:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Run Extension",
            "type": "extensionHost",
            "request": "launch",
            "args": [
                "--extensionDevelopmentPath=${workspaceFolder}"
            ],
            "outFiles": [
                "${workspaceFolder}/out/**/*.js"
            ],
            "preLaunchTask": "${workspaceFolder}/npm: compile"
        }
    ]
}
```

### 2. Logging and Diagnostics

Implement structured logging:

```typescript
class Logger {
    private outputChannel: vscode.OutputChannel;

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('Baseline Lens');
    }

    info(message: string, data?: any): void {
        const logEntry = {
            level: 'INFO',
            timestamp: new Date().toISOString(),
            message,
            data
        };
        
        this.outputChannel.appendLine(JSON.stringify(logEntry));
        console.log(message, data);
    }

    error(message: string, error?: Error): void {
        const logEntry = {
            level: 'ERROR',
            timestamp: new Date().toISOString(),
            message,
            error: error?.message,
            stack: error?.stack
        };
        
        this.outputChannel.appendLine(JSON.stringify(logEntry));
        console.error(message, error);
    }
}
```

### 3. Performance Profiling

Add performance monitoring:

```typescript
class PerformanceProfiler {
    private timers = new Map<string, number>();

    start(label: string): void {
        this.timers.set(label, Date.now());
    }

    end(label: string): number {
        const startTime = this.timers.get(label);
        if (!startTime) {
            throw new Error(`Timer '${label}' not found`);
        }

        const duration = Date.now() - startTime;
        this.timers.delete(label);
        
        console.log(`${label}: ${duration}ms`);
        return duration;
    }
}

// Usage
const profiler = new PerformanceProfiler();
profiler.start('document-analysis');
await analyzeDocument(document);
profiler.end('document-analysis');
```

## Contributing

### 1. Code Style

Follow established patterns:
- Use TypeScript strict mode
- Implement proper error handling
- Add JSDoc comments for public APIs
- Follow VS Code extension best practices

### 2. Pull Request Process

1. **Fork the repository** and create feature branch
2. **Implement changes** with tests
3. **Update documentation** as needed
4. **Run full test suite** and ensure all tests pass
5. **Submit pull request** with clear description

### 3. Issue Reporting

When reporting issues:
- Include VS Code version and extension version
- Provide minimal reproduction case
- Include relevant log output
- Describe expected vs actual behavior

### 4. Feature Requests

For new features:
- Describe the use case and problem being solved
- Provide examples of desired behavior
- Consider implementation complexity and performance impact
- Discuss with maintainers before starting large changes