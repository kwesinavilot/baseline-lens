import * as vscode from 'vscode';
import { AnalysisEngine } from './core/analysisEngine';
import { CompatibilityDataService } from './services/compatibilityService';
import { UIService } from './services/uiService';
import { FileWatcherService } from './services/fileWatcherService';
import { ReportGenerator } from './services/reportGenerator';
import { ConfigurationService } from './services/configurationService';
import { CommandManager } from './core/commandManager';
import { CodeActionCommands } from './services/codeActionProvider';

let analysisEngine: AnalysisEngine;
let compatibilityService: CompatibilityDataService;
let uiService: UIService;
let fileWatcherService: FileWatcherService;
let reportGenerator: ReportGenerator;
let configurationService: ConfigurationService;
let commandManager: CommandManager;

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
        // Initialize CommandManager first for safe command registration
        commandManager = new CommandManager({
            commandPrefix: 'baseline-lens',
            enableFallbackMode: true,
            logRegistrationErrors: true,
            maxRegistrationAttempts: 3
        });
        await commandManager.initialize(context);
        
        // Initialize configuration service first
        configurationService = new ConfigurationService();
        await configurationService.initialize();
        
        // Initialize core services with error handling
        compatibilityService = new CompatibilityDataService();
        await compatibilityService.initialize();
        
        analysisEngine = new AnalysisEngine();
        
        // Register analyzers with compatibility service
        const { CSSAnalyzer, JavaScriptAnalyzer, HTMLAnalyzer } = await import('./analyzers');
        analysisEngine.registerAnalyzer(['css', 'scss', 'sass', 'less'], new CSSAnalyzer(compatibilityService));
        analysisEngine.registerAnalyzer(['javascript', 'typescript', 'javascriptreact', 'typescriptreact'], new JavaScriptAnalyzer(compatibilityService));
        analysisEngine.registerAnalyzer(['html', 'vue', 'svelte'], new HTMLAnalyzer(compatibilityService));
        
        // Update analysis engine configuration based on user settings
        const config = configurationService.getConfiguration();
        analysisEngine.updateConfiguration({
            maxFileSize: config.maxFileSize,
            analysisTimeout: config.analysisTimeout,
            enableFallbackAnalysis: true,
            enableErrorLogging: true
        });
        
        uiService = new UIService(compatibilityService, configurationService);
        reportGenerator = new ReportGenerator(analysisEngine, compatibilityService);
        
        // Initialize file watcher service for real-time analysis
        fileWatcherService = new FileWatcherService(analysisEngine, uiService, configurationService);
        await fileWatcherService.initialize();

        // Register commands and providers
        
        // Register commands using CommandManager for safe registration
        const generateReportSuccess = await commandManager.registerCommand('baseline-lens.generateReport', async () => {
            await generateBaselineReport();
        });
        
        const refreshAnalysisSuccess = await commandManager.registerCommand('baseline-lens.refreshAnalysis', async () => {
            // Use file watcher service to refresh all documents
            await fileWatcherService.refreshAllDocuments();
            vscode.window.showInformationMessage('Analysis refreshed for all open documents');
        });
        
        const toggleIndicatorsSuccess = await commandManager.registerCommand('baseline-lens.toggleInlineIndicators', async () => {
            const config = configurationService.getConfiguration();
            const newValue = !config.showInlineIndicators;
            await configurationService.updateConfiguration('showInlineIndicators', newValue);
            vscode.window.showInformationMessage(`Inline indicators ${newValue ? 'enabled' : 'disabled'}`);
        });
        
        const toggleDiagnosticsSuccess = await commandManager.registerCommand('baseline-lens.toggleDiagnostics', async () => {
            const config = configurationService.getConfiguration();
            const newValue = !config.showDiagnostics;
            await configurationService.updateConfiguration('showDiagnostics', newValue);
            vscode.window.showInformationMessage(`Diagnostics ${newValue ? 'enabled' : 'disabled'}`);
        });

        // Log command registration results
        if (!generateReportSuccess) {
            console.warn('Failed to register baseline-lens.generateReport command');
        }
        if (!refreshAnalysisSuccess) {
            console.warn('Failed to register baseline-lens.refreshAnalysis command');
        }
        if (!toggleIndicatorsSuccess) {
            console.warn('Failed to register baseline-lens.toggleInlineIndicators command');
        }
        if (!toggleDiagnosticsSuccess) {
            console.warn('Failed to register baseline-lens.toggleDiagnostics command');
        }

        // Configuration management commands
        const exportTeamConfigSuccess = await commandManager.registerCommand('baseline-lens.exportTeamConfig', async () => {
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

        const importTeamConfigSuccess = await commandManager.registerCommand('baseline-lens.importTeamConfig', async () => {
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

        const resetConfigurationSuccess = await commandManager.registerCommand('baseline-lens.resetConfiguration', async () => {
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

        const validateConfigurationSuccess = await commandManager.registerCommand('baseline-lens.validateConfiguration', async () => {
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

        // Log configuration command registration results
        if (!exportTeamConfigSuccess) {
            console.warn('Failed to register baseline-lens.exportTeamConfig command');
        }
        if (!importTeamConfigSuccess) {
            console.warn('Failed to register baseline-lens.importTeamConfig command');
        }
        if (!resetConfigurationSuccess) {
            console.warn('Failed to register baseline-lens.resetConfiguration command');
        }
        if (!validateConfigurationSuccess) {
            console.warn('Failed to register baseline-lens.validateConfiguration command');
        }

        // Walkthrough commands
        const showWalkthroughSuccess = await commandManager.registerCommand('baseline-lens.showWalkthrough', async () => {
            try {
                await vscode.commands.executeCommand('workbench.action.openWalkthrough', 'baseline-lens.getting-started');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to open walkthrough: ${error instanceof Error ? error.message : String(error)}`);
            }
        });

        const openDocumentationSuccess = await commandManager.registerCommand('baseline-lens.openDocumentation', async (feature) => {
            await CodeActionCommands.openDocumentation(feature);
        });

        const showPolyfillInfoSuccess = await commandManager.registerCommand('baseline-lens.showPolyfillInfo', async (polyfill) => {
            await CodeActionCommands.showPolyfillInfo(polyfill);
        });

        const showEducationalInfoSuccess = await commandManager.registerCommand('baseline-lens.showEducationalInfo', async (suggestion) => {
            await CodeActionCommands.showEducationalInfo(suggestion);
        });

        const openCommunitySuccess = await commandManager.registerCommand('baseline-lens.openCommunity', async () => {
            try {
                await vscode.env.openExternal(vscode.Uri.parse('https://github.com/kwesinavilot/baseline-lens/discussions'));
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to open community: ${error instanceof Error ? error.message : String(error)}`);
            }
        });

        const openSettingsSuccess = await commandManager.registerCommand('baseline-lens.openSettings', async () => {
            try {
                await vscode.commands.executeCommand('workbench.action.openSettings', 'baseline-lens');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to open settings: ${error instanceof Error ? error.message : String(error)}`);
            }
        });

        // Internal command for walkthrough tracking
        const showHoverSuccess = await commandManager.registerCommand('baseline-lens.showHover', () => {
            // This command is used internally to track when hover is shown for walkthrough completion
            // No action needed - just used as a completion event
        });
        
        // Add error diagnostics command
        const showErrorStatsSuccess = await commandManager.registerCommand('baseline-lens.showErrorStats', () => {
            const stats = analysisEngine.getAnalysisStats();
            const message = `Analysis Stats:\n` +
                `Active Analyses: ${stats.activeAnalyses}\n` +
                `Error Stats: ${JSON.stringify(stats.errorStats, null, 2)}\n` +
                `Timeout Stats: ${JSON.stringify(stats.timeoutStats, null, 2)}`;
            
            vscode.window.showInformationMessage(message, { modal: true });
        });

        // Log walkthrough and utility command registration results
        if (!showWalkthroughSuccess) {
            console.warn('Failed to register baseline-lens.showWalkthrough command');
        }
        if (!openDocumentationSuccess) {
            console.warn('Failed to register baseline-lens.openDocumentation command');
        }
        if (!openCommunitySuccess) {
            console.warn('Failed to register baseline-lens.openCommunity command');
        }
        if (!showHoverSuccess) {
            console.warn('Failed to register baseline-lens.showHover command');
        }
        if (!showErrorStatsSuccess) {
            console.warn('Failed to register baseline-lens.showErrorStats command');
        }
        if (!openSettingsSuccess) {
            console.warn('Failed to register baseline-lens.openSettings command');
        }

        context.subscriptions.push(
            configurationService,
            fileWatcherService,
            commandManager, // CommandManager handles all command disposables
            uiService,
            analysisEngine
        );
        
        // Check if any critical commands failed to register
        const criticalCommands = [
            { name: 'generateReport', success: generateReportSuccess },
            { name: 'refreshAnalysis', success: refreshAnalysisSuccess }
        ];
        
        const failedCriticalCommands = criticalCommands.filter(cmd => !cmd.success);
        if (failedCriticalCommands.length > 0) {
            const failedNames = failedCriticalCommands.map(cmd => cmd.name).join(', ');
            console.warn(`Critical commands failed to register: ${failedNames}`);
            vscode.window.showWarningMessage(
                `Some Baseline Lens commands failed to register: ${failedNames}. Extension functionality may be limited.`
            );
        }

        // Show walkthrough on first activation
        const hasShownWalkthrough = context.globalState.get('baseline-lens.hasShownWalkthrough', false);
        if (!hasShownWalkthrough && showWalkthroughSuccess) {
            // Delay showing walkthrough to ensure extension is fully loaded
            setTimeout(async () => {
                try {
                    await vscode.commands.executeCommand('workbench.action.openWalkthrough', 'baseline-lens.getting-started');
                    await context.globalState.update('baseline-lens.hasShownWalkthrough', true);
                } catch (error) {
                    console.warn('Failed to show initial walkthrough:', error);
                }
            }, 2000);
        }

        // Log command registration statistics
        const stats = commandManager.getRegistrationStats();
        console.log(`Command registration completed: ${stats.successfulRegistrations}/${stats.totalCommands} successful`);

        // Debug: Test if analysis works
        setTimeout(async () => {
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor && activeEditor.document) {
                console.log('Testing analysis on active document:', activeEditor.document.fileName);
                try {
                    const result = await analysisEngine.analyzeDocument(activeEditor.document);
                    console.log('Analysis result:', result);
                    if (result.features.length > 0) {
                        console.log('Found features:', result.features.map(f => f.name));
                        uiService.updateDiagnostics(activeEditor.document, result.features);
                        uiService.updateDecorations(activeEditor.document, result.features);
                    } else {
                        console.log('No features detected');
                    }
                } catch (error) {
                    console.error('Analysis failed:', error);
                }
            }
        }, 3000);
        
        console.log('Baseline Lens extension initialized successfully');
    } catch (error) {
        console.error('Failed to activate Baseline Lens extension:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Try to provide more specific error handling for command registration issues
        if (errorMessage.includes('command') && errorMessage.includes('already exists')) {
            vscode.window.showErrorMessage(
                `Failed to activate Baseline Lens: Command registration conflict detected. ` +
                `This may occur during development. Try reloading the window. Error: ${errorMessage}`
            );
        } else {
            vscode.window.showErrorMessage(`Failed to activate Baseline Lens extension: ${errorMessage}`);
        }
        
        // Ensure CommandManager is disposed even if activation fails
        if (commandManager) {
            try {
                commandManager.dispose();
            } catch (disposeError) {
                console.error('Error disposing CommandManager after activation failure:', disposeError);
            }
        }
    }
}



export function deactivate() {
    console.log('Baseline Lens extension is deactivating');
    
    // Define services with their disposal capabilities
    const disposalOrder: Array<{ 
        name: string; 
        service: any; 
        hasDispose: boolean;
    }> = [
        { name: 'analysisEngine', service: analysisEngine, hasDispose: true },
        { name: 'uiService', service: uiService, hasDispose: true },
        { name: 'fileWatcherService', service: fileWatcherService, hasDispose: true },
        { name: 'reportGenerator', service: reportGenerator, hasDispose: false },
        { name: 'compatibilityService', service: compatibilityService, hasDispose: false },
        { name: 'configurationService', service: configurationService, hasDispose: true },
        { name: 'commandManager', service: commandManager, hasDispose: true }
    ];
    
    const disposalResults: { name: string; success: boolean; error?: Error }[] = [];
    
    // Dispose services in reverse order of initialization for proper cleanup
    for (const { name, service, hasDispose } of disposalOrder) {
        try {
            if (service) {
                if (hasDispose && typeof service.dispose === 'function') {
                    service.dispose();
                    disposalResults.push({ name, success: true });
                    console.log(`Successfully disposed ${name}`);
                } else if (!hasDispose) {
                    // Service doesn't need disposal - just log that it was handled
                    console.log(`Service ${name} does not require disposal`);
                    disposalResults.push({ name, success: true });
                } else {
                    console.warn(`Service ${name} expected to have dispose method but doesn't`);
                    disposalResults.push({ name, success: false, error: new Error('Expected dispose method not found') });
                }
            } else {
                console.log(`Service ${name} was not initialized or already disposed`);
                disposalResults.push({ name, success: true });
            }
        } catch (error) {
            const disposalError = error instanceof Error ? error : new Error(String(error));
            console.error(`Error disposing ${name}:`, disposalError);
            disposalResults.push({ name, success: false, error: disposalError });
        }
    }
    
    // Cleanup verification to prevent resource leaks
    const failedDisposals = disposalResults.filter(result => !result.success);
    if (failedDisposals.length > 0) {
        console.warn(`Failed to dispose ${failedDisposals.length} services:`, 
            failedDisposals.map(f => `${f.name}: ${f.error?.message}`).join(', '));
    }
    
    // Clear global service references to prevent memory leaks
    try {
        analysisEngine = undefined as any;
        compatibilityService = undefined as any;
        uiService = undefined as any;
        fileWatcherService = undefined as any;
        reportGenerator = undefined as any;
        configurationService = undefined as any;
        commandManager = undefined as any;
        
        console.log('Cleared all global service references');
    } catch (error) {
        console.error('Error clearing global references:', error);
    }
    
    // Log final deactivation summary
    const successfulDisposals = disposalResults.filter(result => result.success).length;
    console.log(`Baseline Lens extension deactivation completed: ${successfulDisposals}/${disposalResults.length} services disposed successfully`);
    
    if (failedDisposals.length === 0) {
        console.log('All services disposed cleanly - no resource leaks detected');
    }
}