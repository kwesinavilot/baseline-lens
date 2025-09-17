import * as vscode from 'vscode';
import { ErrorHandler, ErrorContext, ErrorType } from './errorHandler';

export interface TimeoutConfig {
    defaultTimeout: number;
    largeFileTimeout: number;
    largeFileThreshold: number;
    maxConcurrentAnalysis: number;
    enableProgressReporting: boolean;
}

export interface AnalysisTask<T> {
    id: string;
    promise: Promise<T>;
    startTime: number;
    context: ErrorContext;
    abortController?: AbortController;
}

/**
 * Manages timeouts and concurrent analysis operations
 */
export class TimeoutManager {
    private static instance: TimeoutManager;
    private config: TimeoutConfig;
    private errorHandler: ErrorHandler;
    private activeTasks: Map<string, AnalysisTask<any>> = new Map();
    private taskCounter: number = 0;

    private constructor() {
        this.config = {
            defaultTimeout: 5000, // 5 seconds
            largeFileTimeout: 15000, // 15 seconds for large files
            largeFileThreshold: 1024 * 1024, // 1MB
            maxConcurrentAnalysis: 10,
            enableProgressReporting: true
        };
        this.errorHandler = ErrorHandler.getInstance();
    }

    static getInstance(): TimeoutManager {
        if (!TimeoutManager.instance) {
            TimeoutManager.instance = new TimeoutManager();
        }
        return TimeoutManager.instance;
    }

    /**
     * Update timeout configuration
     */
    updateConfig(config: Partial<TimeoutConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Execute analysis with timeout protection
     */
    async executeWithTimeout<T>(
        analysisPromise: Promise<T>,
        context: ErrorContext,
        customTimeout?: number
    ): Promise<T> {
        // Check if we've exceeded max concurrent analysis
        if (this.activeTasks.size >= this.config.maxConcurrentAnalysis) {
            throw new Error(`Maximum concurrent analysis limit reached (${this.config.maxConcurrentAnalysis})`);
        }

        const taskId = this.generateTaskId();
        const timeout = customTimeout || this.determineTimeout(context);
        const abortController = new AbortController();

        const task: AnalysisTask<T> = {
            id: taskId,
            promise: analysisPromise,
            startTime: Date.now(),
            context,
            abortController
        };

        this.activeTasks.set(taskId, task);

        try {
            // Create timeout promise
            const timeoutPromise = new Promise<never>((_, reject) => {
                const timeoutId = setTimeout(() => {
                    abortController.abort();
                    const error = new Error(`Analysis timeout after ${timeout}ms`);
                    reject(error);
                }, timeout);

                // Clear timeout if abort signal is triggered
                abortController.signal.addEventListener('abort', () => {
                    clearTimeout(timeoutId);
                });
            });

            // Race between analysis and timeout
            const result = await Promise.race([analysisPromise, timeoutPromise]);
            
            // Log successful completion
            const duration = Date.now() - task.startTime;
            if (duration > 1000) { // Log if analysis takes more than 1 second
                console.log(`Analysis completed in ${duration}ms for ${context.fileName}`);
            }

            return result;

        } catch (error) {
            // Handle timeout or other errors
            if (abortController.signal.aborted || (error instanceof Error && error.message.includes('timeout'))) {
                this.errorHandler.handleTimeoutError(context);
                throw new Error(`Analysis timeout: ${context.fileName || 'unknown file'}`);
            }
            throw error;
        } finally {
            // Clean up task
            this.activeTasks.delete(taskId);
        }
    }

    /**
     * Execute analysis with progress reporting
     */
    async executeWithProgress<T>(
        analysisFunction: (progress: (value: number, message?: string) => void) => Promise<T>,
        context: ErrorContext,
        title: string = 'Analyzing...',
        customTimeout?: number
    ): Promise<T> {
        if (!this.config.enableProgressReporting) {
            // If progress reporting is disabled, execute without progress
            return this.executeWithTimeout(analysisFunction(() => {}), context, customTimeout);
        }

        return vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Window,
                title,
                cancellable: true
            },
            async (progress, token) => {
                const progressCallback = (value: number, message?: string) => {
                    progress.report({ increment: value, message });
                };

                // Create analysis promise with progress callback
                const analysisPromise = analysisFunction(progressCallback);

                // Handle cancellation
                token.onCancellationRequested(() => {
                    // Find and abort the task
                    for (const [taskId, task] of this.activeTasks.entries()) {
                        if (task.context === context) {
                            task.abortController?.abort();
                            break;
                        }
                    }
                });

                return this.executeWithTimeout(analysisPromise, context, customTimeout);
            }
        );
    }

    /**
     * Execute multiple analyses with concurrency control
     */
    async executeBatch<T>(
        analyses: Array<{ promise: Promise<T>; context: ErrorContext }>,
        batchSize: number = 5
    ): Promise<Array<T | Error>> {
        const results: Array<T | Error> = [];
        
        // Process analyses in batches
        for (let i = 0; i < analyses.length; i += batchSize) {
            const batch = analyses.slice(i, i + batchSize);
            
            const batchPromises = batch.map(async ({ promise, context }) => {
                try {
                    return await this.executeWithTimeout(promise, context);
                } catch (error) {
                    return error instanceof Error ? error : new Error(String(error));
                }
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }

        return results;
    }

    /**
     * Abort all active analyses
     */
    abortAllAnalyses(): void {
        for (const [taskId, task] of this.activeTasks.entries()) {
            task.abortController?.abort();
        }
        this.activeTasks.clear();
    }

    /**
     * Abort specific analysis by context
     */
    abortAnalysis(context: ErrorContext): boolean {
        for (const [taskId, task] of this.activeTasks.entries()) {
            if (task.context.fileName === context.fileName) {
                task.abortController?.abort();
                this.activeTasks.delete(taskId);
                return true;
            }
        }
        return false;
    }

    /**
     * Get active analysis statistics
     */
    getActiveAnalysisStats(): {
        activeCount: number;
        longestRunning: { taskId: string; duration: number; fileName?: string } | null;
        averageDuration: number;
    } {
        const now = Date.now();
        let totalDuration = 0;
        let longestRunning: { taskId: string; duration: number; fileName?: string } | null = null;

        for (const [taskId, task] of this.activeTasks.entries()) {
            const duration = now - task.startTime;
            totalDuration += duration;

            if (!longestRunning || duration > longestRunning.duration) {
                longestRunning = {
                    taskId,
                    duration,
                    fileName: task.context.fileName
                };
            }
        }

        return {
            activeCount: this.activeTasks.size,
            longestRunning,
            averageDuration: this.activeTasks.size > 0 ? totalDuration / this.activeTasks.size : 0
        };
    }

    /**
     * Determine appropriate timeout based on context
     */
    private determineTimeout(context: ErrorContext): number {
        if (context.fileSize && context.fileSize > this.config.largeFileThreshold) {
            return this.config.largeFileTimeout;
        }
        return this.config.defaultTimeout;
    }

    /**
     * Generate unique task ID
     */
    private generateTaskId(): string {
        return `task_${++this.taskCounter}_${Date.now()}`;
    }

    /**
     * Clean up expired tasks (safety mechanism)
     */
    private cleanupExpiredTasks(): void {
        const now = Date.now();
        const maxAge = this.config.largeFileTimeout * 2; // Double the max timeout

        for (const [taskId, task] of this.activeTasks.entries()) {
            if (now - task.startTime > maxAge) {
                console.warn(`Cleaning up expired task: ${taskId}`);
                task.abortController?.abort();
                this.activeTasks.delete(taskId);
            }
        }
    }

    /**
     * Start periodic cleanup of expired tasks
     */
    startPeriodicCleanup(): void {
        setInterval(() => {
            this.cleanupExpiredTasks();
        }, 30000); // Clean up every 30 seconds
    }

    /**
     * Dispose resources
     */
    dispose(): void {
        this.abortAllAnalyses();
    }
}