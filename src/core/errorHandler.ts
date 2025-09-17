import * as vscode from 'vscode';
import { AnalysisError } from '../types';

export enum ErrorType {
    PARSING_ERROR = 'parsing_error',
    TIMEOUT_ERROR = 'timeout_error',
    DATA_LOADING_ERROR = 'data_loading_error',
    CONFIGURATION_ERROR = 'configuration_error',
    FILE_SIZE_ERROR = 'file_size_error',
    UNKNOWN_ERROR = 'unknown_error'
}

export interface ErrorContext {
    fileName?: string;
    languageId?: string;
    fileSize?: number;
    operation?: string;
    additionalInfo?: Record<string, any>;
}

export interface ErrorHandlerConfig {
    enableLogging: boolean;
    logLevel: 'error' | 'warning' | 'info' | 'debug';
    maxLogEntries: number;
    enableDiagnostics: boolean;
    enableFallbackAnalysis: boolean;
}

export class ErrorHandler {
    private static instance: ErrorHandler;
    private config: ErrorHandlerConfig;
    private errorLog: Array<{ timestamp: Date; type: ErrorType; message: string; context?: ErrorContext }> = [];
    private outputChannel: vscode.OutputChannel;

    private constructor() {
        this.config = {
            enableLogging: true,
            logLevel: 'warning',
            maxLogEntries: 1000,
            enableDiagnostics: true,
            enableFallbackAnalysis: true
        };
        this.outputChannel = vscode.window.createOutputChannel('Baseline Lens');
    }

    static getInstance(): ErrorHandler {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }
        return ErrorHandler.instance;
    }

    /**
     * Update error handler configuration
     */
    updateConfig(config: Partial<ErrorHandlerConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Handle parsing errors gracefully
     */
    handleParsingError(error: unknown, context: ErrorContext): AnalysisError {
        const errorMessage = this.extractErrorMessage(error);
        const analysisError: AnalysisError = {
            file: context.fileName || 'unknown',
            error: `Parsing failed: ${errorMessage}`,
            line: this.extractLineNumber(error),
            column: this.extractColumnNumber(error)
        };

        this.logError(ErrorType.PARSING_ERROR, errorMessage, context);
        
        if (this.config.enableDiagnostics) {
            this.createDiagnostic(analysisError, vscode.DiagnosticSeverity.Information);
        }

        return analysisError;
    }

    /**
     * Handle timeout errors
     */
    handleTimeoutError(context: ErrorContext): AnalysisError {
        const errorMessage = `Analysis timeout exceeded for large file`;
        const analysisError: AnalysisError = {
            file: context.fileName || 'unknown',
            error: errorMessage
        };

        this.logError(ErrorType.TIMEOUT_ERROR, errorMessage, context);
        
        if (this.config.enableDiagnostics) {
            this.createDiagnostic(analysisError, vscode.DiagnosticSeverity.Warning);
        }

        return analysisError;
    }

    /**
     * Handle data loading errors
     */
    handleDataLoadingError(error: unknown, context: ErrorContext): AnalysisError {
        const errorMessage = this.extractErrorMessage(error);
        const analysisError: AnalysisError = {
            file: context.fileName || 'data-service',
            error: `Data loading failed: ${errorMessage}`
        };

        this.logError(ErrorType.DATA_LOADING_ERROR, errorMessage, context);
        
        // Show user notification for critical data loading failures
        vscode.window.showWarningMessage(
            `Baseline Lens: Failed to load compatibility data. Some features may not work correctly.`,
            'View Logs'
        ).then(selection => {
            if (selection === 'View Logs') {
                this.outputChannel.show();
            }
        });

        return analysisError;
    }

    /**
     * Handle file size errors
     */
    handleFileSizeError(context: ErrorContext): AnalysisError {
        const errorMessage = `File too large for analysis (${context.fileSize} bytes)`;
        const analysisError: AnalysisError = {
            file: context.fileName || 'unknown',
            error: errorMessage
        };

        this.logError(ErrorType.FILE_SIZE_ERROR, errorMessage, context);
        
        if (this.config.enableDiagnostics) {
            this.createDiagnostic(analysisError, vscode.DiagnosticSeverity.Information);
        }

        return analysisError;
    }

    /**
     * Handle configuration errors
     */
    handleConfigurationError(error: unknown, context: ErrorContext): AnalysisError {
        const errorMessage = this.extractErrorMessage(error);
        const analysisError: AnalysisError = {
            file: context.fileName || 'configuration',
            error: `Configuration error: ${errorMessage}`
        };

        this.logError(ErrorType.CONFIGURATION_ERROR, errorMessage, context);
        
        return analysisError;
    }

    /**
     * Handle unknown errors
     */
    handleUnknownError(error: unknown, context: ErrorContext): AnalysisError {
        const errorMessage = this.extractErrorMessage(error);
        const analysisError: AnalysisError = {
            file: context.fileName || 'unknown',
            error: `Unexpected error: ${errorMessage}`
        };

        this.logError(ErrorType.UNKNOWN_ERROR, errorMessage, context);
        
        return analysisError;
    }

    /**
     * Log error with context
     */
    private logError(type: ErrorType, message: string, context?: ErrorContext): void {
        if (!this.config.enableLogging) {
            return;
        }

        const logEntry = {
            timestamp: new Date(),
            type,
            message,
            context
        };

        // Add to in-memory log
        this.errorLog.push(logEntry);
        
        // Trim log if it exceeds max entries
        if (this.errorLog.length > this.config.maxLogEntries) {
            this.errorLog = this.errorLog.slice(-this.config.maxLogEntries);
        }

        // Log to output channel
        const contextStr = context ? ` [${JSON.stringify(context)}]` : '';
        const logMessage = `[${logEntry.timestamp.toISOString()}] ${type.toUpperCase()}: ${message}${contextStr}`;
        
        this.outputChannel.appendLine(logMessage);
        
        // Also log to console for development
        if (this.shouldLogLevel(type)) {
            console.error(`Baseline Lens - ${logMessage}`);
        }
    }

    /**
     * Create VS Code diagnostic for error
     */
    private createDiagnostic(analysisError: AnalysisError, severity: vscode.DiagnosticSeverity): void {
        // This would be handled by the UIService in practice
        // For now, we just prepare the diagnostic information
    }

    /**
     * Extract error message from unknown error type
     */
    private extractErrorMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }
        if (typeof error === 'string') {
            return error;
        }
        if (error && typeof error === 'object' && 'message' in error) {
            return String((error as any).message);
        }
        return 'Unknown error occurred';
    }

    /**
     * Extract line number from parsing errors
     */
    private extractLineNumber(error: unknown): number | undefined {
        if (error instanceof Error) {
            // Try to extract line number from common parser error formats
            const lineMatch = error.message.match(/line (\d+)/i);
            if (lineMatch) {
                return parseInt(lineMatch[1], 10);
            }
            
            // Check for PostCSS-style errors
            if ('line' in error && typeof (error as any).line === 'number') {
                return (error as any).line;
            }
        }
        return undefined;
    }

    /**
     * Extract column number from parsing errors
     */
    private extractColumnNumber(error: unknown): number | undefined {
        if (error instanceof Error) {
            // Try to extract column number from common parser error formats
            const columnMatch = error.message.match(/column (\d+)/i);
            if (columnMatch) {
                return parseInt(columnMatch[1], 10);
            }
            
            // Check for PostCSS-style errors
            if ('column' in error && typeof (error as any).column === 'number') {
                return (error as any).column;
            }
        }
        return undefined;
    }

    /**
     * Check if error type should be logged based on log level
     */
    private shouldLogLevel(type: ErrorType): boolean {
        const logLevels: { [key: string]: ErrorType[] } = {
            'error': [ErrorType.DATA_LOADING_ERROR, ErrorType.CONFIGURATION_ERROR, ErrorType.UNKNOWN_ERROR],
            'warning': [ErrorType.TIMEOUT_ERROR, ErrorType.FILE_SIZE_ERROR, ErrorType.PARSING_ERROR],
            'info': [ErrorType.PARSING_ERROR],
            'debug': []
        };

        const currentLevelTypes = logLevels[this.config.logLevel] || [];
        return currentLevelTypes.includes(type);
    }

    /**
     * Get error statistics
     */
    getErrorStats(): { [key in ErrorType]: number } {
        const stats = Object.values(ErrorType).reduce((acc, type) => {
            acc[type] = 0;
            return acc;
        }, {} as { [key in ErrorType]: number });

        for (const entry of this.errorLog) {
            stats[entry.type]++;
        }

        return stats;
    }

    /**
     * Get recent errors
     */
    getRecentErrors(count: number = 10): Array<{ timestamp: Date; type: ErrorType; message: string; context?: ErrorContext }> {
        return this.errorLog.slice(-count);
    }

    /**
     * Clear error log
     */
    clearErrorLog(): void {
        this.errorLog = [];
        this.outputChannel.clear();
    }

    /**
     * Dispose resources
     */
    dispose(): void {
        this.outputChannel.dispose();
    }
}