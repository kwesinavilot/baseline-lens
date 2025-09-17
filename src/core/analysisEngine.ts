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

            const analysisTime = Date.now() - startTime;
            this.logAnalysisPerformance(document, features.length, analysisTime);

            return {
                features,
                diagnostics: [], // Diagnostics are now created by UIService
                decorations: []  // Decorations are now created by UIService
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
                    
                    // Add file path to each detected feature
                    const featuresWithPath = result.features.map(feature => ({
                        ...feature,
                        filePath: fileUri.fsPath
                    }));
                    
                    allFeatures.push(...featuresWithPath);
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
     * Log analysis performance metrics
     */
    private logAnalysisPerformance(document: vscode.TextDocument, featureCount: number, analysisTime: number): void {
        if (analysisTime > 100) { // Log if analysis takes more than 100ms
            console.log(`Analysis performance: ${document.fileName} - ${featureCount} features in ${analysisTime}ms`);
        }
    }
}