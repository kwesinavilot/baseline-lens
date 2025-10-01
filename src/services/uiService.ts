import * as vscode from 'vscode';
import { DetectedFeature, AnalysisResult, BaselineStatus } from '../types';
import { HoverProvider } from './hoverProvider';
import { CompatibilityDataService } from './compatibilityService';
import { SuggestionEngine } from './suggestionEngine';
import { BaselineLensCodeActionProvider, CodeActionCommands } from './codeActionProvider';

export class UIService {
    private diagnosticCollection: vscode.DiagnosticCollection;
    private decorationTypes: Map<string, vscode.TextEditorDecorationType>;
    private activeDecorations: Map<string, vscode.DecorationOptions[]>;
    private hoverProvider: HoverProvider;
    private hoverProviderDisposable: vscode.Disposable | undefined;
    private suggestionEngine: SuggestionEngine;
    private codeActionProvider: BaselineLensCodeActionProvider;
    private codeActionProviderDisposable: vscode.Disposable | undefined;

    constructor(compatibilityService: CompatibilityDataService) {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('baseline-lens');
        this.decorationTypes = new Map();
        this.activeDecorations = new Map();
        this.hoverProvider = new HoverProvider(compatibilityService);
        this.suggestionEngine = new SuggestionEngine(compatibilityService);
        this.codeActionProvider = new BaselineLensCodeActionProvider(this.suggestionEngine);
        this.initializeDecorationTypes();
        this.registerHoverProvider();
        this.registerCodeActionProvider();
    }

    private initializeDecorationTypes(): void {
        // Widely available - green checkmark
        this.decorationTypes.set('widely_available', vscode.window.createTextEditorDecorationType({
            after: {
                contentText: ' ✅',
                color: '#22c55e',
                fontWeight: 'bold'
            },
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
        }));

        // Newly available - yellow warning
        this.decorationTypes.set('newly_available', vscode.window.createTextEditorDecorationType({
            after: {
                contentText: ' ⚠',
                color: '#f59e0b',
                fontWeight: 'bold'
            },
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
        }));

        // Limited availability - red X
        this.decorationTypes.set('limited_availability', vscode.window.createTextEditorDecorationType({
            after: {
                contentText: ' 🚫',
                color: '#ef4444',
                fontWeight: 'bold'
            },
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
        }));
    }

    /**
     * Register hover provider for all supported languages
     */
    private registerHoverProvider(): void {
        const supportedLanguages = [
            'css', 'scss', 'less', 'sass',
            'javascript', 'typescript', 'javascriptreact', 'typescriptreact',
            'html', 'vue', 'svelte'
        ];

        this.hoverProviderDisposable = vscode.languages.registerHoverProvider(
            supportedLanguages,
            this.hoverProvider
        );
    }

    /**
     * Register code action provider for all supported languages
     */
    private registerCodeActionProvider(): void {
        const supportedLanguages = [
            'css', 'scss', 'less', 'sass',
            'javascript', 'typescript', 'javascriptreact', 'typescriptreact',
            'html', 'vue', 'svelte'
        ];

        this.codeActionProviderDisposable = vscode.languages.registerCodeActionsProvider(
            supportedLanguages,
            this.codeActionProvider,
            {
                providedCodeActionKinds: [
                    vscode.CodeActionKind.QuickFix,
                    vscode.CodeActionKind.Empty
                ]
            }
        );
    }

    /**
     * Convert detected features to VS Code diagnostics
     */
    createDiagnosticsFromFeatures(features: DetectedFeature[]): vscode.Diagnostic[] {
        return features.map(feature => this.createDiagnostic(feature));
    }

    private createDiagnostic(feature: DetectedFeature): vscode.Diagnostic {
        const severity = this.mapSeverity(feature.baselineStatus.status, feature.severity);
        const message = this.createDiagnosticMessage(feature);
        
        const diagnostic = new vscode.Diagnostic(
            feature.range,
            message,
            severity
        );

        diagnostic.source = 'baseline-lens';
        diagnostic.code = feature.id;
        
        // Add related information for context
        if (feature.context) {
            diagnostic.relatedInformation = [
                new vscode.DiagnosticRelatedInformation(
                    new vscode.Location(vscode.Uri.file(''), feature.range),
                    `Context: ${feature.context}`
                )
            ];
        }

        return diagnostic;
    }

    private createDiagnosticMessage(feature: DetectedFeature): string {
        const statusText = this.getStatusText(feature.baselineStatus.status);
        let message = `${feature.name} has ${statusText} browser support`;
        
        if (feature.baselineStatus.baseline_date) {
            message += ` (baseline: ${feature.baselineStatus.baseline_date})`;
        }

        // Add context if available
        if (feature.context) {
            message += ` - ${feature.context}`;
        }

        // Add suggestion hint for risky features
        if (feature.baselineStatus.status === 'newly_available') {
            message += '. Consider providing fallbacks for older browsers.';
        } else if (feature.baselineStatus.status === 'limited_availability') {
            message += '. Consider using alternatives or polyfills.';
        }

        return message;
    }

    private getStatusText(status: string): string {
        switch (status) {
            case 'widely_available':
                return 'wide';
            case 'newly_available':
                return 'limited';
            case 'limited_availability':
                return 'poor';
            default:
                return 'unknown';
        }
    }

    private mapSeverity(baselineStatus: string, featureSeverity: string): vscode.DiagnosticSeverity {
        // Map baseline status to VS Code diagnostic severity
        switch (baselineStatus) {
            case 'widely_available':
                return vscode.DiagnosticSeverity.Information;
            case 'newly_available':
                return vscode.DiagnosticSeverity.Warning;
            case 'limited_availability':
                return vscode.DiagnosticSeverity.Error;
            default:
                // Fallback to feature severity
                switch (featureSeverity) {
                    case 'error':
                        return vscode.DiagnosticSeverity.Error;
                    case 'warning':
                        return vscode.DiagnosticSeverity.Warning;
                    case 'info':
                    default:
                        return vscode.DiagnosticSeverity.Information;
                }
        }
    }

    /**
     * Create decorations from detected features
     */
    createDecorationsFromFeatures(features: DetectedFeature[]): Map<string, vscode.DecorationOptions[]> {
        const decorationMap = new Map<string, vscode.DecorationOptions[]>();
        
        // Initialize decoration arrays
        decorationMap.set('widely_available', []);
        decorationMap.set('newly_available', []);
        decorationMap.set('limited_availability', []);

        features.forEach(feature => {
            const decorationOptions: vscode.DecorationOptions = {
                range: feature.range,
                hoverMessage: this.createHoverMessage(feature)
            };

            const decorations = decorationMap.get(feature.baselineStatus.status);
            if (decorations) {
                decorations.push(decorationOptions);
            }
        });

        return decorationMap;
    }

    private createHoverMessage(feature: DetectedFeature): vscode.MarkdownString {
        const markdown = new vscode.MarkdownString();
        markdown.isTrusted = true;
        
        // Feature name and status
        const statusIcon = this.getStatusIcon(feature.baselineStatus.status);
        markdown.appendMarkdown(`### ${statusIcon} ${feature.name}\n\n`);
        
        // Status description
        const statusDescription = this.getStatusDescription(feature.baselineStatus.status);
        markdown.appendMarkdown(`**Status:** ${statusDescription}\n\n`);
        
        // Baseline date if available
        if (feature.baselineStatus.baseline_date) {
            markdown.appendMarkdown(`**Baseline Date:** ${feature.baselineStatus.baseline_date}\n\n`);
        }

        // Browser support summary
        if (feature.baselineStatus.support) {
            markdown.appendMarkdown(`**Browser Support:**\n`);
            Object.entries(feature.baselineStatus.support).forEach(([browser, support]) => {
                const version = support.version_added === true ? 'Yes' : 
                               support.version_added === false ? 'No' : 
                               support.version_added;
                markdown.appendMarkdown(`- ${browser}: ${version}\n`);
            });
            markdown.appendMarkdown('\n');
        }

        // Context if available
        if (feature.context) {
            markdown.appendMarkdown(`**Context:** ${feature.context}\n\n`);
        }

        // Add links placeholder (will be enhanced in hover provider task)
        markdown.appendMarkdown(`[Learn more about ${feature.name}](#)`);

        return markdown;
    }

    private getStatusIcon(status: string): string {
        switch (status) {
            case 'widely_available':
                return '✅';
            case 'newly_available':
                return '⚠️';
            case 'limited_availability':
                return '🚫';
            default:
                return '❓';
        }
    }

    private getStatusDescription(status: string): string {
        switch (status) {
            case 'widely_available':
                return 'Widely Available - Safe to use in most browsers';
            case 'newly_available':
                return 'Newly Available - Use with caution, may need fallbacks';
            case 'limited_availability':
                return 'Limited Availability - Consider alternatives or polyfills';
            default:
                return 'Unknown Status';
        }
    }

    updateDiagnostics(document: vscode.TextDocument, features: DetectedFeature[]): void {
        const diagnostics = this.createDiagnosticsFromFeatures(features);
        this.diagnosticCollection.set(document.uri, diagnostics);
        
        // Update hover provider with new features
        this.hoverProvider.updateFeatures(document, features);
        
        // Update code action provider with new features
        this.codeActionProvider.updateFeatures(document, features);
    }

    updateDecorations(document: vscode.TextDocument, features: DetectedFeature[]): void {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.uri.toString() !== document.uri.toString()) {
            return;
        }

        const decorationMap = this.createDecorationsFromFeatures(features);
        
        // Apply decorations for each status type
        decorationMap.forEach((decorations, status) => {
            const decorationType = this.decorationTypes.get(status);
            if (decorationType) {
                editor.setDecorations(decorationType, decorations);
            }
        });

        // Store active decorations for cleanup
        this.activeDecorations.set(document.uri.toString(), []);
    }

    clearDecorations(document: vscode.TextDocument): void {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.uri.toString() !== document.uri.toString()) {
            return;
        }

        // Clear all decoration types
        this.decorationTypes.forEach(decorationType => {
            editor.setDecorations(decorationType, []);
        });

        this.activeDecorations.delete(document.uri.toString());
        
        // Clear hover provider features for this document
        this.hoverProvider.clearFeatures(document);
        
        // Clear code action provider features for this document
        this.codeActionProvider.clearFeatures(document);
    }

    provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | null {
        // Hover functionality is now handled by the dedicated HoverProvider
        const result = this.hoverProvider.provideHover(document, position, new vscode.CancellationTokenSource().token);
        return result instanceof vscode.Hover ? result : null;
    }

    registerCommands(context: vscode.ExtensionContext): void {
        // Register code action commands
        const showPolyfillInfoCommand = vscode.commands.registerCommand(
            'baseline-lens.showPolyfillInfo',
            CodeActionCommands.showPolyfillInfo
        );

        const showEducationalInfoCommand = vscode.commands.registerCommand(
            'baseline-lens.showEducationalInfo',
            CodeActionCommands.showEducationalInfo
        );

        context.subscriptions.push(
            showPolyfillInfoCommand,
            showEducationalInfoCommand
        );
    }

    dispose(): void {
        this.diagnosticCollection.dispose();
        
        // Dispose decoration types
        this.decorationTypes.forEach(decorationType => {
            decorationType.dispose();
        });
        this.decorationTypes.clear();
        this.activeDecorations.clear();
        
        // Dispose hover provider
        if (this.hoverProviderDisposable) {
            this.hoverProviderDisposable.dispose();
        }
        this.hoverProvider.dispose();
        
        // Dispose code action provider
        if (this.codeActionProviderDisposable) {
            this.codeActionProviderDisposable.dispose();
        }
    }
}