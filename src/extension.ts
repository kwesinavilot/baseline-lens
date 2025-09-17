import * as vscode from 'vscode';
import { AnalysisEngine } from './core/analysisEngine';
import { CompatibilityDataService } from './services/compatibilityService';
import { UIService } from './services/uiService';

let analysisEngine: AnalysisEngine;
let compatibilityService: CompatibilityDataService;
let uiService: UIService;

export async function activate(context: vscode.ExtensionContext) {
    console.log('Baseline Lens extension is now active');
    
    try {
        // Initialize core services
        compatibilityService = new CompatibilityDataService();
        await compatibilityService.initialize();
        
        analysisEngine = new AnalysisEngine();
        uiService = new UIService(compatibilityService);
        
        // Register document change listeners for real-time analysis
        const documentChangeListener = vscode.workspace.onDidChangeTextDocument(async (event) => {
            await analyzeDocument(event.document);
        });

        const documentOpenListener = vscode.workspace.onDidOpenTextDocument(async (document) => {
            await analyzeDocument(document);
        });

        const documentCloseListener = vscode.workspace.onDidCloseTextDocument((document) => {
            // Clear diagnostics and decorations when document is closed
            uiService.updateDiagnostics(document, []);
            uiService.clearDecorations(document);
        });

        // Analyze currently open documents
        vscode.workspace.textDocuments.forEach(async (document) => {
            await analyzeDocument(document);
        });

        // Register commands and providers
        uiService.registerCommands(context);
        
        // Register commands
        const generateReportCommand = vscode.commands.registerCommand('baseline-lens.generateReport', () => {
            vscode.window.showInformationMessage('Generate Baseline Report command executed');
        });
        
        const refreshAnalysisCommand = vscode.commands.registerCommand('baseline-lens.refreshAnalysis', async () => {
            // Re-analyze all open documents
            for (const document of vscode.workspace.textDocuments) {
                await analyzeDocument(document);
            }
            vscode.window.showInformationMessage('Analysis refreshed for all open documents');
        });
        
        const toggleIndicatorsCommand = vscode.commands.registerCommand('baseline-lens.toggleInlineIndicators', () => {
            vscode.window.showInformationMessage('Toggle Inline Indicators command executed');
        });
        
        context.subscriptions.push(
            documentChangeListener,
            documentOpenListener,
            documentCloseListener,
            generateReportCommand,
            refreshAnalysisCommand,
            toggleIndicatorsCommand,
            uiService
        );
        
        console.log('Baseline Lens extension initialized successfully');
    } catch (error) {
        console.error('Failed to activate Baseline Lens extension:', error);
        vscode.window.showErrorMessage('Failed to activate Baseline Lens extension');
    }
}

/**
 * Analyze a document and update UI with results
 */
async function analyzeDocument(document: vscode.TextDocument): Promise<void> {
    try {
        // Skip analysis for unsupported file types
        const supportedLanguages = ['css', 'javascript', 'typescript', 'html', 'vue', 'svelte'];
        if (!supportedLanguages.includes(document.languageId)) {
            return;
        }

        // Perform analysis
        const result = await analysisEngine.analyzeDocument(document);
        
        // Update UI with results
        uiService.updateDiagnostics(document, result.features);
        uiService.updateDecorations(document, result.features);
        
    } catch (error) {
        console.error(`Failed to analyze document ${document.fileName}:`, error);
        
        // Clear any existing diagnostics/decorations on error
        uiService.updateDiagnostics(document, []);
        uiService.clearDecorations(document);
    }
}

export function deactivate() {
    console.log('Baseline Lens extension is deactivated');
    if (uiService) {
        uiService.dispose();
    }
}