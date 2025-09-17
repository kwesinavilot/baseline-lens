import * as vscode from 'vscode';
import { AnalysisEngine } from './core/analysisEngine';
import { CompatibilityDataService } from './services/compatibilityService';
import { UIService } from './services/uiService';
import { FileWatcherService } from './services/fileWatcherService';
import { ReportGenerator } from './services/reportGenerator';
import { ConfigurationService } from './services/configurationService';

let analysisEngine: AnalysisEngine;
let compatibilityService: CompatibilityDataService;
let uiService: UIService;
let fileWatcherService: FileWatcherService;
let reportGenerator: ReportGenerator;
let configurationService: ConfigurationService;

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
        // Initialize configuration service first
        configurationService = new ConfigurationService();
        await configurationService.initialize();
        
        // Initialize core services with error handling
        compatibilityService = new CompatibilityDataService();
        await compatibilityService.initialize();
        
        analysisEngine = new AnalysisEngine();
        
        // Update analysis engine configuration based on user settings
        const config = configurationService.getConfiguration();
        analysisEngine.updateConfiguration({
            maxFileSize: config.maxFileSize,
            analysisTimeout: config.analysisTimeout,
            enableFallbackAnalysis: true,
            enableErrorLogging: true
        });
        
        uiService = new UIService(compatibilityService);
        reportGenerator = new ReportGenerator(analysisEngine, compatibilityService);
        
        // Initialize file watcher service for real-time analysis
        fileWatcherService = new FileWatcherService(analysisEngine, uiService, configurationService);
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
        
        const toggleIndicatorsCommand = vscode.commands.registerCommand('baseline-lens.toggleInlineIndicators', async () => {
            const config = configurationService.getConfiguration();
            const newValue = !config.showInlineIndicators;
            await configurationService.updateConfiguration('showInlineIndicators', newValue);
            vscode.window.showInformationMessage(`Inline indicators ${newValue ? 'enabled' : 'disabled'}`);
        });

        // Configuration management commands
        const exportTeamConfigCommand = vscode.commands.registerCommand('baseline-lens.exportTeamConfig', async () => {
            try {
                const configContent = await configurationService.exportTeamConfiguration();
                
                const saveUri = await vscode.window.showSaveDialog({
                    defaultUri: vscode.Uri.joinPath(
                        vscode.workspace.workspaceFolders?.[0]?.uri || vscode.Uri.file(''),
                        '.baseline-lens.json'
                    ),
                    filters: {
                        'JSON Files': ['json']
                    }
                });

                if (saveUri) {
                    await vscode.workspace.fs.writeFile(saveUri, Buffer.from(configContent, 'utf8'));
                    vscode.window.showInformationMessage('Team configuration exported successfully!');
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to export team configuration: ${error instanceof Error ? error.message : String(error)}`);
            }
        });

        const importTeamConfigCommand = vscode.commands.registerCommand('baseline-lens.importTeamConfig', async () => {
            try {
                const openUri = await vscode.window.showOpenDialog({
                    canSelectFiles: true,
                    canSelectFolders: false,
                    canSelectMany: false,
                    filters: {
                        'JSON Files': ['json']
                    }
                });

                if (openUri && openUri[0]) {
                    const configContent = await vscode.workspace.fs.readFile(openUri[0]);
                    await configurationService.importTeamConfiguration(configContent.toString());
                    vscode.window.showInformationMessage('Team configuration imported successfully!');
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to import team configuration: ${error instanceof Error ? error.message : String(error)}`);
            }
        });

        const resetConfigurationCommand = vscode.commands.registerCommand('baseline-lens.resetConfiguration', async () => {
            const result = await vscode.window.showWarningMessage(
                'Are you sure you want to reset all Baseline Lens settings to their default values?',
                { modal: true },
                'Reset',
                'Cancel'
            );

            if (result === 'Reset') {
                try {
                    await configurationService.resetConfiguration();
                    vscode.window.showInformationMessage('Configuration reset to defaults successfully!');
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to reset configuration: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
        });

        const validateConfigurationCommand = vscode.commands.registerCommand('baseline-lens.validateConfiguration', async () => {
            try {
                const config = configurationService.getConfiguration();
                const errors = configurationService.validateConfiguration(config);
                
                if (errors.length === 0) {
                    vscode.window.showInformationMessage('Configuration is valid!');
                } else {
                    const errorMessage = `Configuration validation failed:\n${errors.join('\n')}`;
                    vscode.window.showErrorMessage(errorMessage);
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to validate configuration: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
        

        
        // Add error diagnostics command
        const showErrorStatsCommand = vscode.commands.registerCommand('baseline-lens.showErrorStats', () => {
            const stats = analysisEngine.getAnalysisStats();
            const message = `Analysis Stats:\n` +
                `Active Analyses: ${stats.activeAnalyses}\n` +
                `Error Stats: ${JSON.stringify(stats.errorStats, null, 2)}\n` +
                `Timeout Stats: ${JSON.stringify(stats.timeoutStats, null, 2)}`;
            
            vscode.window.showInformationMessage(message, { modal: true });
        });

        context.subscriptions.push(
            configurationService,
            fileWatcherService,
            generateReportCommand,
            refreshAnalysisCommand,
            toggleIndicatorsCommand,
            exportTeamConfigCommand,
            importTeamConfigCommand,
            resetConfigurationCommand,
            validateConfigurationCommand,
            showErrorStatsCommand,
            uiService,
            analysisEngine
        );
        
        console.log('Baseline Lens extension initialized successfully');
    } catch (error) {
        console.error('Failed to activate Baseline Lens extension:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to activate Baseline Lens extension: ${errorMessage}`);
    }
}



export function deactivate() {
    console.log('Baseline Lens extension is deactivated');
    if (configurationService) {
        configurationService.dispose();
    }
    if (fileWatcherService) {
        fileWatcherService.dispose();
    }
    if (uiService) {
        uiService.dispose();
    }
    if (analysisEngine) {
        analysisEngine.dispose();
    }
}