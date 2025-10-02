import * as vscode from 'vscode';
import * as path from 'path';
import { ExtensionConfig, TeamConfig } from '../types';

/**
 * Service for managing extension configuration including VS Code settings,
 * team-level configuration, and validation
 */
export class ConfigurationService {
    private static readonly CONFIG_SECTION = 'baseline-lens';
    private static readonly TEAM_CONFIG_FILE = '.baseline-lens.json';
    
    private _config: ExtensionConfig | null = null;
    private _teamConfig: TeamConfig | null = null;
    private _configWatcher: vscode.FileSystemWatcher | null = null;
    private _onConfigChanged = new vscode.EventEmitter<ExtensionConfig>();
    
    public readonly onConfigChanged = this._onConfigChanged.event;

    constructor() {
        // Watch for VS Code configuration changes
        vscode.workspace.onDidChangeConfiguration(this.handleConfigurationChange, this);
        
        // Initialize team config watcher
        this.initializeTeamConfigWatcher();
    }

    /**
     * Initialize the configuration service
     */
    public async initialize(): Promise<void> {
        await this.loadConfiguration();
    }

    /**
     * Get the current merged configuration
     */
    public getConfiguration(): ExtensionConfig {
        if (!this._config) {
            throw new Error('Configuration not initialized. Call initialize() first.');
        }
        return this._config;
    }

    /**
     * Get team configuration if available
     */
    public getTeamConfiguration(): TeamConfig | null {
        return this._teamConfig;
    }

    /**
     * Check if a file type is enabled for analysis
     */
    public isFileTypeEnabled(languageId: string): boolean {
        const config = this.getConfiguration();
        return config.enabledFileTypes.includes(languageId);
    }

    /**
     * Check if an analyzer is enabled
     */
    public isAnalyzerEnabled(analyzerType: 'css' | 'javascript' | 'html'): boolean {
        const config = this.getConfiguration();
        return config.enabledAnalyzers[analyzerType];
    }

    /**
     * Check if a file should be excluded from analysis
     */
    public isFileExcluded(filePath: string): boolean {
        const config = this.getConfiguration();
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath));
        
        if (!workspaceFolder) {
            return true; // Exclude files outside workspace
        }

        const relativePath = path.relative(workspaceFolder.uri.fsPath, filePath);
        
        return config.excludePatterns.some(pattern => {
            // Convert glob pattern to regex for basic matching
            const regexPattern = pattern
                .replace(/\*\*/g, '.*')
                .replace(/\*/g, '[^/]*')
                .replace(/\?/g, '[^/]');
            
            const regex = new RegExp(`^${regexPattern}$`);
            return regex.test(relativePath) || regex.test(relativePath.replace(/\\/g, '/'));
        });
    }

    /**
     * Get diagnostic severity for a baseline status
     */
    public getDiagnosticSeverity(baselineStatus: 'widely_available' | 'newly_available' | 'limited_availability'): vscode.DiagnosticSeverity | null {
        const config = this.getConfiguration();
        const severity = config.baselineStatusMapping[baselineStatus];
        
        switch (severity) {
            case 'error':
                return vscode.DiagnosticSeverity.Error;
            case 'warning':
                return vscode.DiagnosticSeverity.Warning;
            case 'info':
                return vscode.DiagnosticSeverity.Information;
            case 'none':
                return null;
            default:
                return vscode.DiagnosticSeverity.Warning;
        }
    }

    /**
     * Check if file size is within limits
     */
    public isFileSizeAcceptable(sizeInBytes: number): boolean {
        const config = this.getConfiguration();
        return sizeInBytes <= config.maxFileSize;
    }

    /**
     * Get analysis timeout
     */
    public getAnalysisTimeout(): number {
        return this.getConfiguration().analysisTimeout;
    }

    /**
     * Update a configuration value
     */
    public async updateConfiguration<K extends keyof ExtensionConfig>(
        key: K,
        value: ExtensionConfig[K],
        target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace
    ): Promise<void> {
        const config = vscode.workspace.getConfiguration(ConfigurationService.CONFIG_SECTION);
        await config.update(key, value, target);
    }

    /**
     * Reset configuration to defaults
     */
    public async resetConfiguration(target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace): Promise<void> {
        const config = vscode.workspace.getConfiguration(ConfigurationService.CONFIG_SECTION);
        const defaultConfig = this.getDefaultConfiguration();
        
        for (const [key, value] of Object.entries(defaultConfig)) {
            await config.update(key, value, target);
        }
    }

    /**
     * Validate configuration and return any errors
     */
    public validateConfiguration(config: Partial<ExtensionConfig>): string[] {
        const errors: string[] = [];

        if (config.supportThreshold !== undefined) {
            if (config.supportThreshold < 0 || config.supportThreshold > 100) {
                errors.push('Support threshold must be between 0 and 100');
            }
        }

        if (config.maxFileSize !== undefined) {
            if (config.maxFileSize < 1024) {
                errors.push('Maximum file size must be at least 1024 bytes (1KB)');
            }
        }

        if (config.analysisTimeout !== undefined) {
            if (config.analysisTimeout < 1000) {
                errors.push('Analysis timeout must be at least 1000 milliseconds');
            }
        }

        if (config.customBrowserMatrix !== undefined) {
            for (const browserSpec of config.customBrowserMatrix) {
                if (!this.isValidBrowserSpec(browserSpec)) {
                    errors.push(`Invalid browser specification: ${browserSpec}`);
                }
            }
        }

        return errors;
    }

    /**
     * Export current configuration for team sharing
     */
    public async exportTeamConfiguration(): Promise<string> {
        const config = this.getConfiguration();
        const teamConfig: TeamConfig = {
            supportThreshold: config.supportThreshold,
            customBrowserMatrix: config.customBrowserMatrix.length > 0 ? config.customBrowserMatrix : undefined,
            excludePatterns: config.excludePatterns,
            baselineStatusMapping: config.baselineStatusMapping,
            enabledAnalyzers: config.enabledAnalyzers,
            maxFileSize: config.maxFileSize,
            analysisTimeout: config.analysisTimeout
        };

        return JSON.stringify(teamConfig, null, 2);
    }

    /**
     * Import team configuration
     */
    public async importTeamConfiguration(configContent: string): Promise<void> {
        try {
            const teamConfig: TeamConfig = JSON.parse(configContent);
            const errors = this.validateTeamConfiguration(teamConfig);
            
            if (errors.length > 0) {
                throw new Error(`Invalid team configuration: ${errors.join(', ')}`);
            }

            // Apply team configuration to workspace settings
            if (teamConfig.supportThreshold !== undefined) {
                await this.updateConfiguration('supportThreshold', teamConfig.supportThreshold);
            }
            if (teamConfig.customBrowserMatrix !== undefined) {
                await this.updateConfiguration('customBrowserMatrix', teamConfig.customBrowserMatrix);
            }
            if (teamConfig.excludePatterns !== undefined) {
                await this.updateConfiguration('excludePatterns', teamConfig.excludePatterns);
            }
            if (teamConfig.baselineStatusMapping !== undefined) {
                const currentMapping = this.getConfiguration().baselineStatusMapping;
                const mergedMapping = { ...currentMapping, ...teamConfig.baselineStatusMapping };
                await this.updateConfiguration('baselineStatusMapping', mergedMapping);
            }
            if (teamConfig.enabledAnalyzers !== undefined) {
                const currentAnalyzers = this.getConfiguration().enabledAnalyzers;
                const mergedAnalyzers = { ...currentAnalyzers, ...teamConfig.enabledAnalyzers };
                await this.updateConfiguration('enabledAnalyzers', mergedAnalyzers);
            }
            if (teamConfig.maxFileSize !== undefined) {
                await this.updateConfiguration('maxFileSize', teamConfig.maxFileSize);
            }
            if (teamConfig.analysisTimeout !== undefined) {
                await this.updateConfiguration('analysisTimeout', teamConfig.analysisTimeout);
            }

        } catch (error) {
            throw new Error(`Failed to import team configuration: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Dispose of resources
     */
    public dispose(): void {
        this._onConfigChanged.dispose();
        if (this._configWatcher) {
            this._configWatcher.dispose();
        }
    }

    private async loadConfiguration(): Promise<void> {
        // Load VS Code configuration
        const vsCodeConfig = vscode.workspace.getConfiguration(ConfigurationService.CONFIG_SECTION);
        
        // Load team configuration if enabled
        let teamConfig: TeamConfig | null = null;
        if (vsCodeConfig.get<boolean>('enableTeamConfig', true)) {
            teamConfig = await this.loadTeamConfiguration();
        }

        // Merge configurations
        this._config = this.mergeConfigurations(vsCodeConfig, teamConfig);
        this._teamConfig = teamConfig;
    }

    private async loadTeamConfiguration(): Promise<TeamConfig | null> {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                return null;
            }

            const configPath = path.join(workspaceFolders[0].uri.fsPath, ConfigurationService.TEAM_CONFIG_FILE);
            const configUri = vscode.Uri.file(configPath);

            try {
                const configContent = await vscode.workspace.fs.readFile(configUri);
                const teamConfig: TeamConfig = JSON.parse(configContent.toString());
                
                const errors = this.validateTeamConfiguration(teamConfig);
                if (errors.length > 0) {
                    vscode.window.showWarningMessage(`Invalid team configuration in ${ConfigurationService.TEAM_CONFIG_FILE}: ${errors.join(', ')}`);
                    return null;
                }

                return teamConfig;
            } catch (error) {
                // File doesn't exist or is invalid - this is okay
                return null;
            }
        } catch (error) {
            console.error('Error loading team configuration:', error);
            return null;
        }
    }

    private mergeConfigurations(vsCodeConfig: vscode.WorkspaceConfiguration, teamConfig: TeamConfig | null): ExtensionConfig {
        const defaultConfig = this.getDefaultConfiguration();
        
        // Start with defaults
        let config: ExtensionConfig = { ...defaultConfig };

        // Apply VS Code configuration
        config.enabledFileTypes = vsCodeConfig.get('enabledFileTypes', defaultConfig.enabledFileTypes);
        config.supportThreshold = vsCodeConfig.get('supportThreshold', defaultConfig.supportThreshold);
        config.showInlineIndicators = vsCodeConfig.get('showInlineIndicators', defaultConfig.showInlineIndicators);
        config.diagnosticSeverity = vsCodeConfig.get('diagnosticSeverity', defaultConfig.diagnosticSeverity);
        config.customBrowserMatrix = vsCodeConfig.get('customBrowserMatrix', defaultConfig.customBrowserMatrix);
        config.excludePatterns = vsCodeConfig.get('excludePatterns', defaultConfig.excludePatterns);
        config.baselineStatusMapping = vsCodeConfig.get('baselineStatusMapping', defaultConfig.baselineStatusMapping);
        config.enabledAnalyzers = vsCodeConfig.get('enabledAnalyzers', defaultConfig.enabledAnalyzers);
        config.maxFileSize = vsCodeConfig.get('maxFileSize', defaultConfig.maxFileSize);
        config.analysisTimeout = vsCodeConfig.get('analysisTimeout', defaultConfig.analysisTimeout);
        config.enableTeamConfig = vsCodeConfig.get('enableTeamConfig', defaultConfig.enableTeamConfig);
        config.showEducationalHints = vsCodeConfig.get('showEducationalHints', defaultConfig.showEducationalHints);
        config.autoRefreshOnSave = vsCodeConfig.get('autoRefreshOnSave', defaultConfig.autoRefreshOnSave);
        config.showDiagnostics = vsCodeConfig.get('showDiagnostics', defaultConfig.showDiagnostics);

        // Apply team configuration overrides
        if (teamConfig) {
            if (teamConfig.supportThreshold !== undefined) {
                config.supportThreshold = teamConfig.supportThreshold;
            }
            if (teamConfig.customBrowserMatrix !== undefined) {
                config.customBrowserMatrix = teamConfig.customBrowserMatrix;
            }
            if (teamConfig.excludePatterns !== undefined) {
                config.excludePatterns = teamConfig.excludePatterns;
            }
            if (teamConfig.baselineStatusMapping !== undefined) {
                config.baselineStatusMapping = { ...config.baselineStatusMapping, ...teamConfig.baselineStatusMapping };
            }
            if (teamConfig.enabledAnalyzers !== undefined) {
                config.enabledAnalyzers = { ...config.enabledAnalyzers, ...teamConfig.enabledAnalyzers };
            }
            if (teamConfig.maxFileSize !== undefined) {
                config.maxFileSize = teamConfig.maxFileSize;
            }
            if (teamConfig.analysisTimeout !== undefined) {
                config.analysisTimeout = teamConfig.analysisTimeout;
            }
        }

        return config;
    }

    private getDefaultConfiguration(): ExtensionConfig {
        return {
            enabledFileTypes: ['css', 'scss', 'less', 'javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'html', 'vue', 'svelte'],
            supportThreshold: 90,
            showInlineIndicators: false,
            showDiagnostics: true,
            diagnosticSeverity: 'warning',
            customBrowserMatrix: [],
            excludePatterns: ['**/node_modules/**', '**/dist/**', '**/build/**'],
            baselineStatusMapping: {
                widely_available: 'info',
                newly_available: 'warning',
                limited_availability: 'error'
            },
            enabledAnalyzers: {
                css: true,
                javascript: true,
                html: true
            },
            maxFileSize: 10485760, // 10MB
            analysisTimeout: 5000,
            enableTeamConfig: true,
            showEducationalHints: true,
            autoRefreshOnSave: true
        };
    }

    private validateTeamConfiguration(teamConfig: TeamConfig): string[] {
        const errors: string[] = [];

        if (teamConfig.supportThreshold !== undefined) {
            if (typeof teamConfig.supportThreshold !== 'number' || teamConfig.supportThreshold < 0 || teamConfig.supportThreshold > 100) {
                errors.push('supportThreshold must be a number between 0 and 100');
            }
        }

        if (teamConfig.customBrowserMatrix !== undefined) {
            if (!Array.isArray(teamConfig.customBrowserMatrix)) {
                errors.push('customBrowserMatrix must be an array');
            } else {
                for (const spec of teamConfig.customBrowserMatrix) {
                    if (typeof spec !== 'string' || !this.isValidBrowserSpec(spec)) {
                        errors.push(`Invalid browser specification: ${spec}`);
                    }
                }
            }
        }

        if (teamConfig.excludePatterns !== undefined) {
            if (!Array.isArray(teamConfig.excludePatterns)) {
                errors.push('excludePatterns must be an array');
            }
        }

        if (teamConfig.maxFileSize !== undefined) {
            if (typeof teamConfig.maxFileSize !== 'number' || teamConfig.maxFileSize < 1024) {
                errors.push('maxFileSize must be a number >= 1024');
            }
        }

        if (teamConfig.analysisTimeout !== undefined) {
            if (typeof teamConfig.analysisTimeout !== 'number' || teamConfig.analysisTimeout < 1000) {
                errors.push('analysisTimeout must be a number >= 1000');
            }
        }

        return errors;
    }

    private isValidBrowserSpec(spec: string): boolean {
        // Basic validation for browser specifications like "chrome >= 90", "firefox >= 88"
        const browserSpecRegex = /^(chrome|firefox|safari|edge|ie|opera|ios|android)\s*(>=|>|<=|<|=)\s*\d+(\.\d+)*$/i;
        return browserSpecRegex.test(spec.trim());
    }

    private initializeTeamConfigWatcher(): void {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return;
        }

        const configPath = path.join(workspaceFolders[0].uri.fsPath, ConfigurationService.TEAM_CONFIG_FILE);
        const pattern = new vscode.RelativePattern(workspaceFolders[0], ConfigurationService.TEAM_CONFIG_FILE);
        
        this._configWatcher = vscode.workspace.createFileSystemWatcher(pattern);
        
        this._configWatcher.onDidCreate(this.handleTeamConfigChange, this);
        this._configWatcher.onDidChange(this.handleTeamConfigChange, this);
        this._configWatcher.onDidDelete(this.handleTeamConfigChange, this);
    }

    private async handleConfigurationChange(event: vscode.ConfigurationChangeEvent): Promise<void> {
        if (event.affectsConfiguration(ConfigurationService.CONFIG_SECTION)) {
            await this.loadConfiguration();
            this._onConfigChanged.fire(this._config!);
        }
    }

    private async handleTeamConfigChange(): Promise<void> {
        await this.loadConfiguration();
        this._onConfigChanged.fire(this._config!);
    }
}