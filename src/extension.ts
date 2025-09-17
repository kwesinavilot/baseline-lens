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
        uiService = new UIService();
        
        // Register commands and providers
        uiService.registerCommands(context);
        
        // Register commands
        const generateReportCommand = vscode.commands.registerCommand('baseline-lens.generateReport', () => {
            vscode.window.showInformationMessage('Generate Baseline Report command executed');
        });
        
        const refreshAnalysisCommand = vscode.commands.registerCommand('baseline-lens.refreshAnalysis', () => {
            vscode.window.showInformationMessage('Refresh Analysis command executed');
        });
        
        const toggleIndicatorsCommand = vscode.commands.registerCommand('baseline-lens.toggleInlineIndicators', () => {
            vscode.window.showInformationMessage('Toggle Inline Indicators command executed');
        });
        
        context.subscriptions.push(
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

export function deactivate() {
    console.log('Baseline Lens extension is deactivated');
    if (uiService) {
        uiService.dispose();
    }
}