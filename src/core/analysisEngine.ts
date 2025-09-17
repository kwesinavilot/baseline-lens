import * as vscode from 'vscode';
import { AnalysisResult, DetectedFeature, BaseAnalyzer, ProjectAnalysisResult, AnalysisError, BaselineStatus } from '../types';
import { ErrorHandler, ErrorContext, ErrorType } from './errorHandler';
import { FallbackAnalyzer } from './fallbackAnalyzer';
import { TimeoutManager } from './timeoutManager';

export class AnalysisEngine {
    private analyzers: Map<string, BaseAnalyzer> = new Map();
    private analysisTimeout: number = 5000; // 5 seconds timeout for large files
    private errorHandler: ErrorHandler;
    private fallbackAnalyzer: FallbackAnalyzer;
    private timeoutManager: TimeoutManager;
    private maxFileSize: number = 10 * 1024 * 1024; // 10MB max file size

    constructor() {
        // Analyzers will be registered by their respective modules
        this.errorHandler = ErrorHandler.getInstance();
        this.fallbackAnalyzer = new FallbackAnalyzer();
        this.timeoutManager = TimeoutManager.getInstance();
        
        // Start periodic cleanup of expired tasks
        this.timeoutManager.startPeriodicCleanup();
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
        const content = document.getText();
        
        const context: ErrorContext = {
            fileName: document.fileName,
            languageId: document.languageId,
            fileSize: content.length,
            operation: 'document_analysis'
        };

        try {
            // Check file size limits
            if (content.length > this.maxFileSize) {
                const error = this.errorHandler.handleFileSizeError(context);
                return this.createErrorResult([error]);
            }

            // Get appropriate analyzer for the document language
            const analyzer = this.getAnalyzerForDocument(document);
            if (!analyzer) {
                return this.createEmptyResult();
            }

            // Perform analysis with timeout protection
            const analysisPromise = analyzer.analyze(content, document);
            const features = await this.timeoutManager.executeWithTimeout(
                analysisPromise,
                context,
                this.determineTimeout(content.length)
            );

            const analysisTime = Date.now() - startTime;
            this.logAnalysisPerformance(document, features.length, analysisTime);

            return {
                features,
                diagnostics: [], // Diagnostics are now created by UIService
                decorations: []  // Decorations are now created by UIService
            };

        } catch (error) {
            return this.handleAnalysisError(error, document, context);
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

            // Prepare analysis tasks
            const analysisTasks = files.map(fileUri => ({
                promise: this.analyzeFileForProject(fileUri),
                context: {
                    fileName: fileUri.fsPath,
                    operation: 'project_analysis'
                } as ErrorContext
            }));

            // Execute analyses in batches with concurrency control
            const results = await this.timeoutManager.executeBatch(analysisTasks, 5);

            // Process results
            for (let i = 0; i < results.length; i++) {
                const result = results[i];
                const fileUri = files[i];

                if (result instanceof Error) {
                    errors.push({
                        file: fileUri.fsPath,
                        error: result.message
                    });
                } else {
                    const { features: fileFeatures, error: fileError } = result;
                    
                    if (fileError) {
                        errors.push(fileError);
                    }
                    
                    if (fileFeatures.length > 0) {
                        // Add file path to each detected feature
                        const featuresWithPath = fileFeatures.map(feature => ({
                            ...feature,
                            filePath: fileUri.fsPath
                        }));
                        
                        allFeatures.push(...featuresWithPath);
                        analyzedFiles++;
                    }
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
            const context: ErrorContext = {
                operation: 'project_analysis',
                additionalInfo: { totalFiles, analyzedFiles }
            };
            this.errorHandler.handleUnknownError(error, context);
            throw new Error(`Project analysis failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Analyze a single file for project analysis
     */
    private async analyzeFileForProject(fileUri: vscode.Uri): Promise<{ features: DetectedFeature[]; error?: AnalysisError }> {
        try {
            const document = await vscode.workspace.openTextDocument(fileUri);
            const result = await this.analyzeDocument(document);
            
            return { features: result.features };
        } catch (error) {
            const analysisError: AnalysisError = {
                file: fileUri.fsPath,
                error: error instanceof Error ? error.message : String(error)
            };
            
            return { features: [], error: analysisError };
        }
    }

    /**
     * Get analyzer for a specific document
     */
    private getAnalyzerForDocument(document: vscode.TextDocument): BaseAnalyzer | undefined {
        return this.analyzers.get(document.languageId);
    }

    /**
     * Handle analysis errors gracefully with fallback analysis
     */
    private async handleAnalysisError(error: unknown, document: vscode.TextDocument, context: ErrorContext): Promise<AnalysisResult> {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Determine error type and handle appropriately
        let analysisError: AnalysisError;
        
        if (errorMessage.includes('timeout')) {
            analysisError = this.errorHandler.handleTimeoutError(context);
        } else if (errorMessage.includes('parsing') || errorMessage.includes('parse')) {
            analysisError = this.errorHandler.handleParsingError(error, context);
        } else {
            analysisError = this.errorHandler.handleUnknownError(error, context);
        }

        // Attempt fallback analysis if enabled
        let fallbackFeatures: DetectedFeature[] = [];
        try {
            fallbackFeatures = await this.fallbackAnalyzer.performFallbackAnalysis(
                document.getText(),
                document,
                error
            );
            
            if (fallbackFeatures.length > 0) {
                console.log(`Fallback analysis found ${fallbackFeatures.length} features for ${document.fileName}`);
            }
        } catch (fallbackError) {
            console.warn(`Fallback analysis also failed for ${document.fileName}:`, fallbackError);
        }

        return {
            features: fallbackFeatures,
            diagnostics: [], // Diagnostics are handled by UIService
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
     * Determine appropriate timeout based on file size
     */
    private determineTimeout(fileSize: number): number {
        if (fileSize > 1024 * 1024) { // 1MB
            return 15000; // 15 seconds for large files
        } else if (fileSize > 100 * 1024) { // 100KB
            return 10000; // 10 seconds for medium files
        }
        return this.analysisTimeout; // Default timeout for small files
    }

    /**
     * Create error result with analysis errors
     */
    private createErrorResult(errors: AnalysisError[]): AnalysisResult {
        return {
            features: [],
            diagnostics: [],
            decorations: []
        };
    }

    /**
     * Log analysis performance metrics
     */
    private logAnalysisPerformance(document: vscode.TextDocument, featureCount: number, analysisTime: number): void {
        if (analysisTime > 100) { // Log if analysis takes more than 100ms
            console.log(`Analysis performance: ${document.fileName} - ${featureCount} features in ${analysisTime}ms`);
        }
    }

    /**
     * Update configuration for error handling and timeouts
     */
    updateConfiguration(config: {
        maxFileSize?: number;
        analysisTimeout?: number;
        enableFallbackAnalysis?: boolean;
        enableErrorLogging?: boolean;
    }): void {
        if (config.maxFileSize !== undefined) {
            this.maxFileSize = config.maxFileSize;
        }
        if (config.analysisTimeout !== undefined) {
            this.analysisTimeout = config.analysisTimeout;
        }
        
        // Update timeout manager configuration
        this.timeoutManager.updateConfig({
            defaultTimeout: this.analysisTimeout,
            largeFileTimeout: this.analysisTimeout * 3,
            largeFileThreshold: this.maxFileSize / 10
        });

        // Update error handler configuration
        this.errorHandler.updateConfig({
            enableLogging: config.enableErrorLogging ?? true,
            enableFallbackAnalysis: config.enableFallbackAnalysis ?? true
        });
    }

    /**
     * Get analysis statistics
     */
    getAnalysisStats(): {
        activeAnalyses: number;
        errorStats: { [key: string]: number };
        timeoutStats: any;
    } {
        return {
            activeAnalyses: this.timeoutManager.getActiveAnalysisStats().activeCount,
            errorStats: this.errorHandler.getErrorStats(),
            timeoutStats: this.timeoutManager.getActiveAnalysisStats()
        };
    }

    /**
     * Dispose resources
     */
    dispose(): void {
        this.timeoutManager.dispose();
        this.errorHandler.dispose();
    }
}