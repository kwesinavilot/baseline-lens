import * as vscode from 'vscode';
import { DetectedFeature, BaseAnalyzer, BaselineStatus } from '../types';
import { ErrorHandler, ErrorContext } from '../core/errorHandler';

/**
 * Abstract base class for all feature analyzers
 */
export abstract class AbstractBaseAnalyzer implements BaseAnalyzer {
    protected supportedLanguages: string[];
    protected errorHandler: ErrorHandler;
    protected maxContentSize: number = 10 * 1024 * 1024; // 10MB default

    constructor(supportedLanguages: string[]) {
        this.supportedLanguages = supportedLanguages;
        this.errorHandler = ErrorHandler.getInstance();
    }

    /**
     * Analyze content for web features
     */
    abstract analyze(content: string, document: vscode.TextDocument): Promise<DetectedFeature[]>;

    /**
     * Get supported language IDs
     */
    getSupportedLanguages(): string[] {
        return this.supportedLanguages;
    }

    /**
     * Create a detected feature with common properties
     */
    protected createDetectedFeature(
        id: string,
        name: string,
        type: 'css' | 'javascript' | 'html',
        range: vscode.Range,
        baselineStatus: BaselineStatus,
        context?: string
    ): DetectedFeature {
        return {
            id,
            name,
            type,
            range,
            baselineStatus,
            context,
            severity: this.determineSeverity(baselineStatus)
        };
    }

    /**
     * Determine diagnostic severity based on baseline status
     */
    protected determineSeverity(baselineStatus: BaselineStatus): 'error' | 'warning' | 'info' {
        switch (baselineStatus.status) {
            case 'limited_availability':
                return 'error';
            case 'newly_available':
                return 'warning';
            case 'widely_available':
                return 'info';
            default:
                return 'warning';
        }
    }

    /**
     * Create a range from line and column positions
     */
    protected createRange(startLine: number, startChar: number, endLine: number, endChar: number): vscode.Range {
        return new vscode.Range(
            new vscode.Position(startLine, startChar),
            new vscode.Position(endLine, endChar)
        );
    }

    /**
     * Handle parsing errors gracefully
     */
    protected handleParsingError(error: unknown, document: vscode.TextDocument): DetectedFeature[] {
        const context: ErrorContext = {
            fileName: document.fileName,
            languageId: document.languageId,
            fileSize: document.getText().length,
            operation: 'parsing'
        };

        this.errorHandler.handleParsingError(error, context);
        
        // Return empty array instead of throwing to allow graceful degradation
        return [];
    }

    /**
     * Safely execute analysis with error handling
     */
    protected async safeAnalyze(
        analysisFunction: () => Promise<DetectedFeature[]> | DetectedFeature[],
        document: vscode.TextDocument,
        operation: string = 'analysis'
    ): Promise<DetectedFeature[]> {
        const context: ErrorContext = {
            fileName: document.fileName,
            languageId: document.languageId,
            fileSize: document.getText().length,
            operation
        };

        try {
            const result = await analysisFunction();
            return result;
        } catch (error) {
            if (error instanceof Error && error.message.includes('timeout')) {
                this.errorHandler.handleTimeoutError(context);
            } else {
                this.errorHandler.handleParsingError(error, context);
            }
            return [];
        }
    }

    /**
     * Check if a feature should be analyzed based on configuration
     */
    protected shouldAnalyzeFeature(featureId: string): boolean {
        // This could be extended to check user configuration
        // For now, analyze all features
        return true;
    }

    /**
     * Validate that content is not too large for analysis
     */
    protected validateContentSize(content: string, document?: vscode.TextDocument, maxSize?: number): boolean {
        const sizeLimit = maxSize || this.maxContentSize;
        
        if (content.length > sizeLimit) {
            if (document) {
                const context: ErrorContext = {
                    fileName: document.fileName,
                    languageId: document.languageId,
                    fileSize: content.length,
                    operation: 'size_validation'
                };
                this.errorHandler.handleFileSizeError(context);
            } else {
                console.warn(`Content too large for analysis: ${content.length} bytes`);
            }
            return false;
        }
        return true;
    }

    /**
     * Validate content before analysis
     */
    protected validateContent(content: string, document: vscode.TextDocument): boolean {
        // Check size
        if (!this.validateContentSize(content, document)) {
            return false;
        }

        // Check if content is empty
        if (content.trim().length === 0) {
            return false;
        }

        // Additional validation can be added here
        return true;
    }

    /**
     * Extract line and column information from a string position
     */
    protected getPositionFromOffset(content: string, offset: number): { line: number; character: number } {
        const lines = content.substring(0, offset).split('\n');
        return {
            line: lines.length - 1,
            character: lines[lines.length - 1].length
        };
    }


}