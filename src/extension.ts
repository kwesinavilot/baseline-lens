import * as vscode from 'vscode';
import { AnalysisEngine } from './core/analysisEngine';
import { CompatibilityDataService } from './services/compatibilityService';
import { UIService } from './services/uiService';
import { FileWatcherService } from './services/fileWatcherService';
import { ReportGenerator } from './services/reportGenerator';

let analysisEngine: AnalysisEngine;
let compatibilityService: CompatibilityDataService;
let uiService: UIService;
let fileWatcherService: FileWatcherService;
let reportGenerator: ReportGenerator;

/**
 * Generate and export a baseline compatibility report
 */
async function generateBaselineReport(): Promise<void> {
    try {
        // Check if workspace is available
        if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder found. Please open a project to generate a report.');
            return;
        }

        // Show format selection
        const format = await vscode.window.showQuickPick(
            [
                { label: 'JSON', value: 'json', description: 'Machine-readable format for CI/CD integration' },
                { label: 'Markdown', value: 'markdown', description: 'Human-readable format for documentation' }
            ],
            {
                placeHolder: 'Select report format',
                title: 'Baseline Lens Report Format'
            }
        );

        if (!format) {
            return; // User cancelled
        }

        // Show progress with cancellation support
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Generating Baseline Report',
                cancellable: true
            },
            async (progress, token) => {
                return new Promise<void>(async (resolve, reject) => {
                    try {
                        // Generate the report with progress updates
                        const report = await reportGenerator.generateProjectReport(
                            (progressValue, message) => {
                                progress.report({ 
                                    increment: progressValue - (progress as any).value || 0,
                                    message 
                                });
                                
                                // Check for cancellation
                                if (token.isCancellationRequested) {
                                    throw new Error('Report generation cancelled by user');
                                }
                            }
                        );

                        // Export the report
                        const exportedContent = reportGenerator.exportReport(report, format.value as 'json' | 'markdown');
                        
                        // Determine file extension
                        const fileExtension = format.value === 'json' ? 'json' : 'md';
                        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
                        const defaultFileName = `baseline-report-${timestamp}.${fileExtension}`;

                        // Show save dialog
                        const saveUri = await vscode.window.showSaveDialog({
                            defaultUri: vscode.Uri.joinPath(
                                vscode.workspace.workspaceFolders![0].uri,
                                defaultFileName
                            ),
                            filters: format.value === 'json' 
                                ? { 'JSON Files': ['json'] }
                                : { 'Markdown Files': ['md'] }
                        });

                        if (saveUri) {
                            // Write the report to file
                            await vscode.workspace.fs.writeFile(
                                saveUri,
                                Buffer.from(exportedContent, 'utf8')
                            );

                            // Show success message with option to open the report
                            const openAction = 'Open Report';
                            const result = await vscode.window.showInformationMessage(
                                `Baseline report generated successfully! Found ${report.summary.totalFeatures} features across ${report.analyzedFiles} files.`,
                                openAction
                            );

                            if (result === openAction) {
                                await vscode.window.showTextDocument(saveUri);
                            }
                        }

                        resolve();
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        
                        if (errorMessage.includes('cancelled')) {
                            vscode.window.showInformationMessage('Report generation cancelled.');
                        } else {
                            vscode.window.showErrorMessage(`Failed to generate report: ${errorMessage}`);
                        }
                        
                        reject(error);
                    }
                });
            }
        );

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to generate baseline report: ${errorMessage}`);
    }
}

export async function activate(context: vscode.ExtensionContext) {
    console.log('Baseline Lens extension is now active');
    
    try {
        // Initialize core services
        compatibilityService = new CompatibilityDataService();
        await compatibilityService.initialize();
        
        analysisEngine = new AnalysisEngine();
        uiService = new UIService(compatibilityService);
        reportGenerator = new ReportGenerator(analysisEngine, compatibilityService);
        
        // Initialize file watcher service for real-time analysis
        fileWatcherService = new FileWatcherService(analysisEngine, uiService);
        await fileWatcherService.initialize();

        // Register commands and providers
        uiService.registerCommands(context);
        
        // Register commands
        const generateReportCommand = vscode.commands.registerCommand('baseline-lens.generateReport', async () => {
            await generateBaselineReport();
        });
        
        const refreshAnalysisCommand = vscode.commands.registerCommand('baseline-lens.refreshAnalysis', async () => {
            // Use file watcher service to refresh all documents
            await fileWatcherService.refreshAllDocuments();
            vscode.window.showInformationMessage('Analysis refreshed for all open documents');
        });
        
        const toggleIndicatorsCommand = vscode.commands.registerCommand('baseline-lens.toggleInlineIndicators', () => {
            vscode.window.showInformationMessage('Toggle Inline Indicators command executed');
        });
        
        context.subscriptions.push(
            fileWatcherService,
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
    if (fileWatcherService) {
        fileWatcherService.dispose();
    }
    if (uiService) {
        uiService.dispose();
    }
}