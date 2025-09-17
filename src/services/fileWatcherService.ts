import * as vscode from 'vscode';
import { AnalysisEngine } from '../core/analysisEngine';
import { UIService } from './uiService';
import { ConfigurationService } from './configurationService';

/**
 * Configuration options for the FileWatcherService
 */
interface FileWatcherConfig {
    debounceDelay: number;
    maxFileSize: number;
    supportedLanguages: string[];
    incrementalAnalysisThreshold: number;
}

/**
 * Represents a pending analysis task
 */
interface PendingAnalysis {
    document: vscode.TextDocument;
    timeout: NodeJS.Timeout;
    changeCount: number;
}

/**
 * Service responsible for monitoring document changes and triggering analysis
 * with performance optimizations like debouncing and incremental analysis
 */
export class FileWatcherService implements vscode.Disposable {
    private readonly analysisEngine: AnalysisEngine;
    private readonly uiService: UIService;
    private readonly configurationService: ConfigurationService;
    private readonly config: FileWatcherConfig;
    private readonly pendingAnalyses = new Map<string, PendingAnalysis>();
    private readonly documentChangeListener: vscode.Disposable;
    private readonly documentOpenListener: vscode.Disposable;
    private readonly documentCloseListener: vscode.Disposable;
    private readonly documentSaveListener: vscode.Disposable;
    private readonly configChangeListener: vscode.Disposable;
    private isDisposed = false;

    constructor(analysisEngine: AnalysisEngine, uiService: UIService, configurationService: ConfigurationService, config?: Partial<FileWatcherConfig>) {
        this.analysisEngine = analysisEngine;
        this.uiService = uiService;
        this.configurationService = configurationService;
        
        // Default configuration
        this.config = {
            debounceDelay: 300, // 300ms debounce delay
            maxFileSize: 10 * 1024 * 1024, // 10MB max file size
            supportedLanguages: ['css', 'javascript', 'typescript', 'html', 'vue', 'svelte', 'jsx', 'tsx'],
            incrementalAnalysisThreshold: 1000, // Lines threshold for incremental analysis
            ...config
        };

        // Register document event listeners
        this.documentChangeListener = vscode.workspace.onDidChangeTextDocument(
            this.onDocumentChange.bind(this)
        );
        
        this.documentOpenListener = vscode.workspace.onDidOpenTextDocument(
            this.onDocumentOpen.bind(this)
        );
        
        this.documentCloseListener = vscode.workspace.onDidCloseTextDocument(
            this.onDocumentClose.bind(this)
        );
        
        this.documentSaveListener = vscode.workspace.onDidSaveTextDocument(
            this.onDocumentSave.bind(this)
        );

        // Listen for configuration changes
        this.configChangeListener = this.configurationService.onConfigChanged(
            this.onConfigurationChanged.bind(this)
        );
    }

    /**
     * Initialize the file watcher service and analyze currently open documents
     */
    public async initialize(): Promise<void> {
        if (this.isDisposed) {
            return;
        }

        // Analyze all currently open documents
        const openDocuments = vscode.workspace.textDocuments;
        for (const document of openDocuments) {
            if (this.shouldAnalyzeDocument(document)) {
                await this.scheduleAnalysis(document, false);
            }
        }
    }

    /**
     * Handle document change events with debouncing
     */
    private onDocumentChange(event: vscode.TextDocumentChangeEvent): void {
        if (this.isDisposed || !this.shouldAnalyzeDocument(event.document)) {
            return;
        }

        const document = event.document;
        const uri = document.uri.toString();

        // Cancel any existing pending analysis for this document
        this.cancelPendingAnalysis(uri);

        // Check if this is a significant change that warrants analysis
        const hasSignificantChanges = event.contentChanges.some(change => 
            change.text.length > 0 || change.rangeLength > 0
        );

        if (!hasSignificantChanges) {
            return;
        }

        // Schedule debounced analysis
        this.scheduleAnalysis(document, true);
    }

    /**
     * Handle document open events
     */
    private async onDocumentOpen(document: vscode.TextDocument): Promise<void> {
        if (this.isDisposed || !this.shouldAnalyzeDocument(document)) {
            return;
        }

        // Analyze immediately when document is opened (no debouncing)
        await this.scheduleAnalysis(document, false);
    }

    /**
     * Handle document close events
     */
    private onDocumentClose(document: vscode.TextDocument): void {
        if (this.isDisposed) {
            return;
        }

        const uri = document.uri.toString();
        
        // Cancel any pending analysis
        this.cancelPendingAnalysis(uri);
        
        // Clear diagnostics and decorations
        this.uiService.updateDiagnostics(document, []);
        this.uiService.clearDecorations(document);
    }

    /**
     * Handle document save events
     */
    private async onDocumentSave(document: vscode.TextDocument): Promise<void> {
        if (this.isDisposed || !this.shouldAnalyzeDocument(document)) {
            return;
        }

        // Check if auto-refresh on save is enabled
        const config = this.configurationService.getConfiguration();
        if (!config.autoRefreshOnSave) {
            return;
        }

        // Force immediate analysis on save (no debouncing)
        const uri = document.uri.toString();
        this.cancelPendingAnalysis(uri);
        await this.performAnalysis(document);
    }

    /**
     * Handle configuration changes
     */
    private async onConfigurationChanged(): Promise<void> {
        if (this.isDisposed) {
            return;
        }

        // Refresh all documents when configuration changes
        await this.refreshAllDocuments();
    }

    /**
     * Schedule analysis for a document with optional debouncing
     */
    private async scheduleAnalysis(document: vscode.TextDocument, debounce: boolean): Promise<void> {
        const uri = document.uri.toString();

        if (debounce) {
            // Cancel existing timeout if any
            this.cancelPendingAnalysis(uri);

            // Create new debounced analysis
            const timeout = setTimeout(async () => {
                if (!this.isDisposed) {
                    await this.performAnalysis(document);
                    this.pendingAnalyses.delete(uri);
                }
            }, this.config.debounceDelay);

            const existing = this.pendingAnalyses.get(uri);
            this.pendingAnalyses.set(uri, {
                document,
                timeout,
                changeCount: (existing?.changeCount || 0) + 1
            });
        } else {
            // Immediate analysis
            await this.performAnalysis(document);
        }
    }

    /**
     * Cancel pending analysis for a document
     */
    private cancelPendingAnalysis(uri: string): void {
        const pending = this.pendingAnalyses.get(uri);
        if (pending) {
            clearTimeout(pending.timeout);
            this.pendingAnalyses.delete(uri);
        }
    }

    /**
     * Perform the actual document analysis
     */
    private async performAnalysis(document: vscode.TextDocument): Promise<void> {
        if (this.isDisposed) {
            return;
        }

        try {
            // Check file size limits using configuration service
            const config = this.configurationService.getConfiguration();
            if (!this.configurationService.isFileSizeAcceptable(document.getText().length)) {
                console.warn(`Skipping analysis for large file: ${document.fileName} (${document.getText().length} bytes)`);
                return;
            }

            // Determine if incremental analysis should be used
            const useIncrementalAnalysis = document.lineCount > this.config.incrementalAnalysisThreshold;
            
            let result;
            if (useIncrementalAnalysis) {
                // For large files, use incremental analysis if available
                result = await this.performIncrementalAnalysis(document);
            } else {
                // Standard full analysis for smaller files
                result = await this.analysisEngine.analyzeDocument(document);
            }

            // Update UI with results
            this.uiService.updateDiagnostics(document, result.features);
            this.uiService.updateDecorations(document, result.features);

        } catch (error) {
            console.error(`Failed to analyze document ${document.fileName}:`, error);
            
            // Clear any existing diagnostics/decorations on error
            this.uiService.updateDiagnostics(document, []);
            this.uiService.clearDecorations(document);
        }
    }

    /**
     * Perform incremental analysis for large files
     * This is a placeholder for future optimization - currently falls back to full analysis
     */
    private async performIncrementalAnalysis(document: vscode.TextDocument): Promise<any> {
        // TODO: Implement true incremental analysis in future iterations
        // For now, we'll use the standard analysis but with some optimizations
        
        // Could implement strategies like:
        // - Analyze only visible ranges
        // - Cache results and only re-analyze changed sections
        // - Use worker threads for heavy parsing
        
        return await this.analysisEngine.analyzeDocument(document);
    }

    /**
     * Check if a document should be analyzed
     */
    private shouldAnalyzeDocument(document: vscode.TextDocument): boolean {
        // Skip if document is not supported by configuration
        if (!this.configurationService.isFileTypeEnabled(document.languageId)) {
            return false;
        }

        // Skip if file is excluded by patterns
        if (this.configurationService.isFileExcluded(document.fileName)) {
            return false;
        }

        // Skip if document is too large
        if (!this.configurationService.isFileSizeAcceptable(document.getText().length)) {
            return false;
        }

        // Skip untitled documents or non-file schemes
        if (document.uri.scheme !== 'file' && document.uri.scheme !== 'untitled') {
            return false;
        }

        return true;
    }

    /**
     * Get statistics about pending analyses
     */
    public getStats(): { pendingCount: number; totalChanges: number } {
        let totalChanges = 0;
        for (const pending of this.pendingAnalyses.values()) {
            totalChanges += pending.changeCount;
        }

        return {
            pendingCount: this.pendingAnalyses.size,
            totalChanges
        };
    }

    /**
     * Force analysis of all open documents
     */
    public async refreshAllDocuments(): Promise<void> {
        if (this.isDisposed) {
            return;
        }

        // Clear all pending analyses
        for (const [uri] of this.pendingAnalyses) {
            this.cancelPendingAnalysis(uri);
        }

        // Analyze all open documents
        const openDocuments = vscode.workspace.textDocuments;
        for (const document of openDocuments) {
            if (this.shouldAnalyzeDocument(document)) {
                await this.performAnalysis(document);
            }
        }
    }

    /**
     * Update configuration
     */
    public updateConfig(newConfig: Partial<FileWatcherConfig>): void {
        Object.assign(this.config, newConfig);
    }

    /**
     * Dispose of the service and clean up resources
     */
    public dispose(): void {
        if (this.isDisposed) {
            return;
        }

        this.isDisposed = true;

        // Cancel all pending analyses
        for (const [uri] of this.pendingAnalyses) {
            this.cancelPendingAnalysis(uri);
        }

        // Dispose of event listeners
        this.documentChangeListener.dispose();
        this.documentOpenListener.dispose();
        this.documentCloseListener.dispose();
        this.documentSaveListener.dispose();
        this.configChangeListener.dispose();
    }
}