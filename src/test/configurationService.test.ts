import * as assert from 'assert';
import * as vscode from 'vscode';
import { ConfigurationService } from '../services/configurationService';
import { ExtensionConfig, TeamConfig } from '../types';

suite('ConfigurationService Tests', () => {
    let configService: ConfigurationService;

    setup(async () => {
        configService = new ConfigurationService();
        await configService.initialize();
    });

    teardown(() => {
        configService.dispose();
    });

    test('should initialize with default configuration', async () => {
        const config = configService.getConfiguration();
        
        assert.strictEqual(config.supportThreshold, 90);
        assert.strictEqual(config.showInlineIndicators, true);
        assert.strictEqual(config.diagnosticSeverity, 'warning');
        assert.deepStrictEqual(config.enabledFileTypes, ['css', 'scss', 'less', 'javascript', 'typescript', 'html', 'vue', 'svelte']);
        assert.deepStrictEqual(config.excludePatterns, ['**/node_modules/**', '**/dist/**', '**/build/**']);
    });

    test('should validate file type enablement', () => {
        assert.strictEqual(configService.isFileTypeEnabled('css'), true);
        assert.strictEqual(configService.isFileTypeEnabled('javascript'), true);
        assert.strictEqual(configService.isFileTypeEnabled('python'), false);
    });

    test('should validate analyzer enablement', () => {
        assert.strictEqual(configService.isAnalyzerEnabled('css'), true);
        assert.strictEqual(configService.isAnalyzerEnabled('javascript'), true);
        assert.strictEqual(configService.isAnalyzerEnabled('html'), true);
    });

    test('should check file exclusion patterns', () => {
        assert.strictEqual(configService.isFileExcluded('/project/node_modules/package/file.js'), true);
        assert.strictEqual(configService.isFileExcluded('/project/dist/bundle.js'), true);
        assert.strictEqual(configService.isFileExcluded('/project/src/main.js'), false);
    });

    test('should validate file size limits', () => {
        const config = configService.getConfiguration();
        assert.strictEqual(configService.isFileSizeAcceptable(1024), true);
        assert.strictEqual(configService.isFileSizeAcceptable(config.maxFileSize), true);
        assert.strictEqual(configService.isFileSizeAcceptable(config.maxFileSize + 1), false);
    });

    test('should map baseline status to diagnostic severity', () => {
        assert.strictEqual(configService.getDiagnosticSeverity('widely_available'), vscode.DiagnosticSeverity.Information);
        assert.strictEqual(configService.getDiagnosticSeverity('newly_available'), vscode.DiagnosticSeverity.Warning);
        assert.strictEqual(configService.getDiagnosticSeverity('limited_availability'), vscode.DiagnosticSeverity.Error);
    });

    test('should validate configuration values', () => {
        const validConfig: Partial<ExtensionConfig> = {
            supportThreshold: 85,
            maxFileSize: 5242880,
            analysisTimeout: 3000
        };
        
        const errors = configService.validateConfiguration(validConfig);
        assert.strictEqual(errors.length, 0);
    });

    test('should detect invalid configuration values', () => {
        const invalidConfig: Partial<ExtensionConfig> = {
            supportThreshold: 150, // Invalid: > 100
            maxFileSize: 500, // Invalid: < 1024
            analysisTimeout: 500, // Invalid: < 1000
            customBrowserMatrix: ['invalid-spec'] // Invalid browser spec
        };
        
        const errors = configService.validateConfiguration(invalidConfig);
        assert.strictEqual(errors.length, 4);
        assert.ok(errors.some(e => e.includes('Support threshold')));
        assert.ok(errors.some(e => e.includes('Maximum file size')));
        assert.ok(errors.some(e => e.includes('Analysis timeout')));
        assert.ok(errors.some(e => e.includes('Invalid browser specification')));
    });

    test('should validate browser specifications', () => {
        const validSpecs = [
            'chrome >= 90',
            'firefox >= 88',
            'safari >= 14',
            'edge >= 88',
            'ie >= 11'
        ];

        const invalidSpecs = [
            'chrome',
            'firefox > ',
            'invalid-browser >= 90',
            'chrome >= abc'
        ];

        for (const spec of validSpecs) {
            const errors = configService.validateConfiguration({ customBrowserMatrix: [spec] });
            assert.strictEqual(errors.length, 0, `Valid spec should not produce errors: ${spec}`);
        }

        for (const spec of invalidSpecs) {
            const errors = configService.validateConfiguration({ customBrowserMatrix: [spec] });
            assert.ok(errors.length > 0, `Invalid spec should produce errors: ${spec}`);
        }
    });

    test('should export team configuration', async () => {
        const exportedConfig = await configService.exportTeamConfiguration();
        const teamConfig: TeamConfig = JSON.parse(exportedConfig);
        
        assert.ok(typeof teamConfig.supportThreshold === 'number');
        assert.ok(Array.isArray(teamConfig.excludePatterns));
        assert.ok(typeof teamConfig.baselineStatusMapping === 'object');
        assert.ok(typeof teamConfig.enabledAnalyzers === 'object');
    });

    test('should validate team configuration', () => {
        const validTeamConfig: TeamConfig = {
            supportThreshold: 85,
            customBrowserMatrix: ['chrome >= 90'],
            excludePatterns: ['**/test/**'],
            maxFileSize: 5242880,
            analysisTimeout: 3000
        };

        const errors = configService['validateTeamConfiguration'](validTeamConfig);
        assert.strictEqual(errors.length, 0);
    });

    test('should detect invalid team configuration', () => {
        const invalidTeamConfig: TeamConfig = {
            supportThreshold: 150, // Invalid
            customBrowserMatrix: ['invalid'], // Invalid
            excludePatterns: 'not-an-array' as any, // Invalid
            maxFileSize: 500, // Invalid
            analysisTimeout: 500 // Invalid
        };

        const errors = configService['validateTeamConfiguration'](invalidTeamConfig);
        assert.ok(errors.length > 0);
    });

    test('should get analysis timeout from configuration', () => {
        const timeout = configService.getAnalysisTimeout();
        assert.strictEqual(typeof timeout, 'number');
        assert.ok(timeout >= 1000);
    });
});