import * as vscode from 'vscode';
import { AnalysisResult, DetectedFeature, BaseAnalyzer, ProjectAnalysisResult, AnalysisError, BaselineStatus } from '../types';

export class AnalysisEngine {
    private analyzers: Map<string, BaseAnalyzer> = new Map();
    private analysisTimeout: number = 5000; // 5 seconds timeout for large files

    constructor() {
        // Analyzers will be registered by their respective modules
    }

    /**
     * Register an analyzer for specific file types
     */
    registerAnalyzer(languages: string[], analyzer: BaseAnalyzer): void {
        for (const language of languages) {
            this.analyzers.set(language, analyzer);
        }
    }

    /**
     * Analyze a single document for web features
     */
    async analyzeDocument(document: vscode.TextDocument): Promise<AnalysisResult> {
        const startTime = Date.now();
        
        try {
            // Get appropriate analyzer for the document language
            const analyzer = this.getAnalyzerForDocument(document);
            if (!analyzer) {
                return this.createEmptyResult();
            }

            // Perform analysis with timeout protection
            const features = await this.analyzeWithTimeout(
                analyzer.analyze(document.getText(), document),
                this.analysisTimeout
            );

            // Convert features to diagnostics and decorations
            const diagnostics = this.createDiagnostics(features, document);
            const decorations = this.createDecorations(features);

            const analysisTime = Date.now() - startTime;
            this.logAnalysisPerformance(document, features.length, analysisTime);

            return {
                features,
                diagnostics,
                decorations
            };

        } catch (error) {
            return this.handleAnalysisError(error, document);
        }
    }

    /**
     * Analyze entire project for web features
     */
    async analyzeProject(): Promise<ProjectAnalysisResult> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('No workspace folder found');
        }

        const allFeatures: DetectedFeature[] = [];
        const errors: AnalysisError[] = [];
        let totalFiles = 0;
        let analyzedFiles = 0;

        // Find all supported files in the workspace
        const supportedExtensions = this.getSupportedFileExtensions();
        const includePattern = `**/*.{${supportedExtensions.join(',')}}`;
        
        try {
            const files = await vscode.workspace.findFiles(includePattern, '**/node_modules/**');
            totalFiles = files.length;

            // Analyze each file
            for (const fileUri of files) {
                try {
                    const document = await vscode.workspace.openTextDocument(fileUri);
                    const result = await this.analyzeDocument(document);
                    allFeatures.push(...result.features);
                    analyzedFiles++;
                } catch (error) {
                    errors.push({
                        file: fileUri.fsPath,
                        error: error instanceof Error ? error.message : String(error)
                    });
                }
            }

            // Generate summary statistics
            const summary = this.generateSummary(allFeatures);

            return {
                totalFiles,
                analyzedFiles,
                features: allFeatures,
                errors,
                summary
            };

        } catch (error) {
            throw new Error(`Project analysis failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get analyzer for a specific document
     */
    private getAnalyzerForDocument(document: vscode.TextDocument): BaseAnalyzer | undefined {
        return this.analyzers.get(document.languageId);
    }

    /**
     * Execute analysis with timeout protection
     */
    private async analyzeWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Analysis timeout')), timeoutMs);
        });

        return Promise.race([promise, timeoutPromise]);
    }

    /**
     * Convert detected features to VS Code diagnostics
     */
    private createDiagnostics(features: DetectedFeature[], document: vscode.TextDocument): vscode.Diagnostic[] {
        return features
            .filter(feature => feature.severity !== 'info' || this.shouldShowInfoDiagnostics())
            .map(feature => {
                const diagnostic = new vscode.Diagnostic(
                    feature.range,
                    this.createDiagnosticMessage(feature),
                    this.mapSeverity(feature.severity)
                );

                diagnostic.source = 'Baseline Lens';
                diagnostic.code = feature.id;
                
                return diagnostic;
            });
    }

    /**
     * Convert detected features to VS Code decorations
     */
    private createDecorations(features: DetectedFeature[]): vscode.DecorationOptions[] {
        return features.map(feature => ({
            range: feature.range,
            hoverMessage: this.createHoverMessage(feature),
            renderOptions: {
                after: {
                    contentText: this.getStatusIcon(feature.baselineStatus.status),
                    margin: '0 0 0 0.5em'
                }
            }
        }));
    }

    /**
     * Handle analysis errors gracefully
     */
    private handleAnalysisError(error: unknown, document: vscode.TextDocument): AnalysisResult {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Log error for debugging
        console.error(`Analysis error for ${document.fileName}:`, errorMessage);

        // Create a diagnostic for the error
        const diagnostic = new vscode.Diagnostic(
            new vscode.Range(0, 0, 0, 0),
            `Baseline Lens analysis failed: ${errorMessage}`,
            vscode.DiagnosticSeverity.Information
        );
        diagnostic.source = 'Baseline Lens';

        return {
            features: [],
            diagnostics: [diagnostic],
            decorations: []
        };
    }

    /**
     * Create empty analysis result
     */
    private createEmptyResult(): AnalysisResult {
        return {
            features: [],
            diagnostics: [],
            decorations: []
        };
    }

    /**
     * Generate summary statistics for project analysis
     */
    private generateSummary(features: DetectedFeature[]) {
        const summary = {
            widelyAvailable: 0,
            newlyAvailable: 0,
            limitedAvailability: 0
        };

        for (const feature of features) {
            switch (feature.baselineStatus.status) {
                case 'widely_available':
                    summary.widelyAvailable++;
                    break;
                case 'newly_available':
                    summary.newlyAvailable++;
                    break;
                case 'limited_availability':
                    summary.limitedAvailability++;
                    break;
            }
        }

        return summary;
    }

    /**
     * Get supported file extensions from registered analyzers
     */
    private getSupportedFileExtensions(): string[] {
        const extensions: string[] = [];
        
        // Map common language IDs to file extensions
        const languageExtensions: { [key: string]: string[] } = {
            'css': ['css', 'scss', 'sass', 'less'],
            'javascript': ['js', 'jsx', 'mjs'],
            'typescript': ['ts', 'tsx'],
            'html': ['html', 'htm'],
            'vue': ['vue'],
            'svelte': ['svelte']
        };

        for (const languageId of this.analyzers.keys()) {
            const exts = languageExtensions[languageId] || [languageId];
            extensions.push(...exts);
        }

        return [...new Set(extensions)]; // Remove duplicates
    }

    /**
     * Create diagnostic message for a feature
     */
    private createDiagnosticMessage(feature: DetectedFeature): string {
        const statusText = this.getStatusText(feature.baselineStatus.status);
        return `${feature.name} has ${statusText} browser support`;
    }

    /**
     * Create hover message for a feature
     */
    private createHoverMessage(feature: DetectedFeature): vscode.MarkdownString {
        const markdown = new vscode.MarkdownString();
        markdown.isTrusted = true;
        
        const statusText = this.getStatusText(feature.baselineStatus.status);
        const icon = this.getStatusIcon(feature.baselineStatus.status);
        
        markdown.appendMarkdown(`${icon} **${feature.name}** - ${statusText}\n\n`);
        
        if (feature.baselineStatus.baseline_date) {
            markdown.appendMarkdown(`Baseline since: ${feature.baselineStatus.baseline_date}\n\n`);
        }

        return markdown;
    }

    /**
     * Map feature severity to VS Code diagnostic severity
     */
    private mapSeverity(severity: 'error' | 'warning' | 'info'): vscode.DiagnosticSeverity {
        switch (severity) {
            case 'error':
                return vscode.DiagnosticSeverity.Error;
            case 'warning':
                return vscode.DiagnosticSeverity.Warning;
            case 'info':
                return vscode.DiagnosticSeverity.Information;
        }
    }

    /**
     * Get status icon for baseline status
     */
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

    /**
     * Get human-readable status text
     */
    private getStatusText(status: string): string {
        switch (status) {
            case 'widely_available':
                return 'widely available';
            case 'newly_available':
                return 'newly available';
            case 'limited_availability':
                return 'limited';
            default:
                return 'unknown';
        }
    }

    /**
     * Check if info diagnostics should be shown
     */
    private shouldShowInfoDiagnostics(): boolean {
        // This could be configurable via extension settings
        return false;
    }

    /**
     * Log analysis performance metrics
     */
    private logAnalysisPerformance(document: vscode.TextDocument, featureCount: number, analysisTime: number): void {
        if (analysisTime > 100) { // Log if analysis takes more than 100ms
            console.log(`Analysis performance: ${document.fileName} - ${featureCount} features in ${analysisTime}ms`);
        }
    }
}