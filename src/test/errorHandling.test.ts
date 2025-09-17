import * as assert from 'assert';
import * as vscode from 'vscode';
import { ErrorHandler, ErrorType, ErrorContext } from '../core/errorHandler';
import { FallbackAnalyzer } from '../core/fallbackAnalyzer';
import { TimeoutManager } from '../core/timeoutManager';
import { AnalysisEngine } from '../core/analysisEngine';

suite('Error Handling Tests', () => {
    let errorHandler: ErrorHandler;
    let fallbackAnalyzer: FallbackAnalyzer;
    let timeoutManager: TimeoutManager;

    setup(() => {
        errorHandler = ErrorHandler.getInstance();
        fallbackAnalyzer = new FallbackAnalyzer();
        timeoutManager = TimeoutManager.getInstance();
    });

    teardown(() => {
        errorHandler.clearErrorLog();
    });

    test('ErrorHandler handles parsing errors gracefully', () => {
        const context: ErrorContext = {
            fileName: 'test.css',
            languageId: 'css',
            fileSize: 1000,
            operation: 'parsing'
        };

        const error = new Error('Invalid CSS syntax at line 5');
        const analysisError = errorHandler.handleParsingError(error, context);

        assert.strictEqual(analysisError.file, 'test.css');
        assert.ok(analysisError.error.includes('Parsing failed'));
        assert.ok(analysisError.error.includes('Invalid CSS syntax'));
    });

    test('ErrorHandler handles timeout errors', () => {
        const context: ErrorContext = {
            fileName: 'large-file.js',
            languageId: 'javascript',
            fileSize: 10000000, // 10MB
            operation: 'analysis'
        };

        const analysisError = errorHandler.handleTimeoutError(context);

        assert.strictEqual(analysisError.file, 'large-file.js');
        assert.ok(analysisError.error.includes('timeout'));
    });

    test('ErrorHandler handles file size errors', () => {
        const context: ErrorContext = {
            fileName: 'huge-file.css',
            languageId: 'css',
            fileSize: 50000000, // 50MB
            operation: 'size_validation'
        };

        const analysisError = errorHandler.handleFileSizeError(context);

        assert.strictEqual(analysisError.file, 'huge-file.css');
        assert.ok(analysisError.error.includes('too large'));
        assert.ok(analysisError.error.includes('50000000'));
    });

    test('ErrorHandler tracks error statistics', () => {
        const context: ErrorContext = {
            fileName: 'test.js',
            languageId: 'javascript',
            operation: 'test'
        };

        // Generate different types of errors
        errorHandler.handleParsingError(new Error('Parse error'), context);
        errorHandler.handleTimeoutError(context);
        errorHandler.handleFileSizeError(context);

        const stats = errorHandler.getErrorStats();
        assert.strictEqual(stats[ErrorType.PARSING_ERROR], 1);
        assert.strictEqual(stats[ErrorType.TIMEOUT_ERROR], 1);
        assert.strictEqual(stats[ErrorType.FILE_SIZE_ERROR], 1);
    });

    test('FallbackAnalyzer provides basic CSS analysis', async () => {
        const cssContent = `
            .container {
                display: grid;
                grid-template-columns: 1fr 1fr;
                color: red;
            }
        `;

        const mockDocument = {
            fileName: 'test.css',
            languageId: 'css',
            getText: () => cssContent
        } as vscode.TextDocument;

        const features = await fallbackAnalyzer.performFallbackAnalysis(
            cssContent,
            mockDocument,
            new Error('PostCSS parsing failed')
        );

        assert.ok(features.length > 0);
        const gridFeature = features.find(f => f.id === 'css-grid');
        assert.ok(gridFeature, 'Should detect CSS Grid feature');
        assert.strictEqual(gridFeature?.type, 'css');
    });

    test('FallbackAnalyzer provides basic JavaScript analysis', async () => {
        const jsContent = `
            const data = await fetch('/api/data');
            const result = data.json();
            
            class MyClass {
                async method() {
                    return Promise.resolve();
                }
            }
        `;

        const mockDocument = {
            fileName: 'test.js',
            languageId: 'javascript',
            getText: () => jsContent
        } as vscode.TextDocument;

        const features = await fallbackAnalyzer.performFallbackAnalysis(
            jsContent,
            mockDocument,
            new Error('Acorn parsing failed')
        );

        assert.ok(features.length > 0);
        const fetchFeature = features.find(f => f.id === 'fetch');
        const asyncFeature = features.find(f => f.id === 'async-functions');
        
        assert.ok(fetchFeature, 'Should detect Fetch API');
        assert.ok(asyncFeature, 'Should detect async functions');
    });

    test('TimeoutManager executes with timeout protection', async () => {
        const fastPromise = Promise.resolve('success');
        
        const result = await timeoutManager.executeWithTimeout(
            fastPromise,
            { fileName: 'test.js', operation: 'fast_analysis' },
            1000
        );

        assert.strictEqual(result, 'success');
    });

    test('TimeoutManager handles timeout correctly', async () => {
        const slowPromise = new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
            await timeoutManager.executeWithTimeout(
                slowPromise,
                { fileName: 'test.js', operation: 'slow_analysis' },
                100 // 100ms timeout
            );
            assert.fail('Should have thrown timeout error');
        } catch (error) {
            assert.ok(error instanceof Error);
            assert.ok(error.message.includes('timeout'));
        }
    });

    test('TimeoutManager tracks active analyses', async () => {
        const promise1 = new Promise(resolve => setTimeout(resolve, 100));
        const promise2 = new Promise(resolve => setTimeout(resolve, 100));

        // Start both analyses
        const analysis1 = timeoutManager.executeWithTimeout(
            promise1,
            { fileName: 'test1.js', operation: 'analysis' }
        );
        const analysis2 = timeoutManager.executeWithTimeout(
            promise2,
            { fileName: 'test2.js', operation: 'analysis' }
        );

        const stats = timeoutManager.getActiveAnalysisStats();
        assert.strictEqual(stats.activeCount, 2);

        // Wait for completion
        await Promise.all([analysis1, analysis2]);

        const finalStats = timeoutManager.getActiveAnalysisStats();
        assert.strictEqual(finalStats.activeCount, 0);
    });
});