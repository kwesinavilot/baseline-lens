import * as vscode from 'vscode';
import { DetectedFeature, BaseAnalyzer, BaselineStatus } from '../types';

/**
 * Abstract base class for all feature analyzers
 */
export abstract class AbstractBaseAnalyzer implements BaseAnalyzer {
    protected supportedLanguages: string[];

    constructor(supportedLanguages: string[]) {
        this.supportedLanguages = supportedLanguages;
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
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(`Parsing error in ${document.fileName}: ${errorMessage}`);
        
        // Return empty array instead of throwing to allow graceful degradation
        return [];
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
    protected validateContentSize(content: string, maxSize: number = 10 * 1024 * 1024): boolean {
        if (content.length > maxSize) {
            console.warn(`Content too large for analysis: ${content.length} bytes`);
            return false;
        }
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

    /**
     * Create a mock baseline status for testing purposes
     */
    protected createMockBaselineStatus(status: 'widely_available' | 'newly_available' | 'limited_availability'): BaselineStatus {
        return {
            status,
            baseline_date: status === 'widely_available' ? '2020-01-01' : undefined,
            support: {
                chrome: { version_added: '80' },
                firefox: { version_added: '75' },
                safari: { version_added: '13.1' }
            }
        };
    }
}