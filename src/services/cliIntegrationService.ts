import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface CLICapabilities {
    isAvailable: boolean;
    version?: string;
    features: {
        projectAnalysis: boolean;
        gitHooks: boolean;
        cicdSetup: boolean;
        smartConfig: boolean;
    };
}

export class CLIIntegrationService {
    private capabilities: CLICapabilities | null = null;
    private statusBarItem: vscode.StatusBarItem;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right, 
            100
        );
    }

    async initialize(): Promise<void> {
        this.capabilities = await this.detectCLI();
        this.updateStatusBar();
        
        if (this.capabilities.isAvailable) {
            console.log(`Baseline Lens CLI detected (v${this.capabilities.version})`);
        }
    }

    private async detectCLI(): Promise<CLICapabilities> {
        try {
            const { stdout } = await execAsync('baseline-lens-cli --version');
            const version = stdout.trim();
            
            return {
                isAvailable: true,
                version,
                features: {
                    projectAnalysis: true,
                    gitHooks: true,
                    cicdSetup: true,
                    smartConfig: true
                }
            };
        } catch {
            return {
                isAvailable: false,
                features: {
                    projectAnalysis: false,
                    gitHooks: false,
                    cicdSetup: false,
                    smartConfig: false
                }
            };
        }
    }

    private updateStatusBar(): void {
        if (!this.capabilities) return;

        if (this.capabilities.isAvailable) {
            this.statusBarItem.text = '$(check) Baseline Lens';
            this.statusBarItem.tooltip = `Baseline Lens CLI v${this.capabilities.version} available`;
            this.statusBarItem.command = 'baseline-lens.showCLICommands';
        } else {
            this.statusBarItem.text = '$(info) Baseline Lens';
            this.statusBarItem.tooltip = 'Baseline Lens Extension (CLI not installed)';
        }
        
        this.statusBarItem.show();
    }

    isAvailable(): boolean {
        return this.capabilities?.isAvailable ?? false;
    }

    getCapabilities(): CLICapabilities | null {
        return this.capabilities;
    }

    async executeCommand(command: string, args: string[] = []): Promise<string> {
        if (!this.isAvailable()) {
            throw new Error('CLI not available');
        }

        const fullCommand = `baseline-lens-cli ${command} ${args.join(' ')}`;
        const { stdout } = await execAsync(fullCommand);
        return stdout;
    }

    async showProjectAnalysis(): Promise<void> {
        if (!this.isAvailable()) {
            vscode.window.showInformationMessage(
                'Install Baseline Lens CLI for project-wide analysis',
                'Install CLI'
            ).then(selection => {
                if (selection === 'Install CLI') {
                    this.showInstallInstructions();
                }
            });
            return;
        }

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder found');
            return;
        }

        const terminal = vscode.window.createTerminal({
            name: 'Baseline Lens Analysis',
            cwd: workspaceFolder.uri.fsPath
        });

        terminal.sendText('baseline-lens-cli analyze --changed-only');
        terminal.show();
    }

    async setupGitHooks(): Promise<void> {
        if (!this.isAvailable()) {
            vscode.window.showInformationMessage(
                'Install Baseline Lens CLI to set up git hooks',
                'Install CLI'
            ).then(selection => {
                if (selection === 'Install CLI') {
                    this.showInstallInstructions();
                }
            });
            return;
        }

        const hookType = await vscode.window.showQuickPick([
            { label: 'Pre-commit', value: 'pre-commit', description: 'Check compatibility before each commit' },
            { label: 'Pre-push', value: 'pre-push', description: 'Check compatibility before pushing' }
        ], {
            placeHolder: 'Select git hook type'
        });

        if (!hookType) return;

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder found');
            return;
        }

        const terminal = vscode.window.createTerminal({
            name: 'Baseline Lens Setup',
            cwd: workspaceFolder.uri.fsPath
        });

        terminal.sendText(`baseline-lens-cli init-hooks --type ${hookType.value}`);
        terminal.show();
    }

    async setupCICD(): Promise<void> {
        if (!this.isAvailable()) {
            vscode.window.showInformationMessage(
                'Install Baseline Lens CLI to set up CI/CD integration',
                'Install CLI'
            ).then(selection => {
                if (selection === 'Install CLI') {
                    this.showInstallInstructions();
                }
            });
            return;
        }

        const platform = await vscode.window.showQuickPick([
            { label: 'GitHub Actions', value: 'github' },
            { label: 'GitLab CI', value: 'gitlab' },
            { label: 'Azure Pipelines', value: 'azure' },
            { label: 'Jenkins', value: 'jenkins' }
        ], {
            placeHolder: 'Select CI/CD platform'
        });

        if (!platform) return;

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder found');
            return;
        }

        const terminal = vscode.window.createTerminal({
            name: 'Baseline Lens Setup',
            cwd: workspaceFolder.uri.fsPath
        });

        terminal.sendText(`baseline-lens-cli init-ci --type ${platform.value}`);
        terminal.show();
    }

    async generateSmartConfig(): Promise<void> {
        if (!this.isAvailable()) {
            vscode.window.showInformationMessage(
                'Install Baseline Lens CLI for smart configuration generation',
                'Install CLI'
            ).then(selection => {
                if (selection === 'Install CLI') {
                    this.showInstallInstructions();
                }
            });
            return;
        }

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder found');
            return;
        }

        try {
            const result = await this.executeCommand('init-config', ['--dry-run']);
            
            // Show config preview
            const doc = await vscode.workspace.openTextDocument({
                content: result,
                language: 'json'
            });
            
            const editor = await vscode.window.showTextDocument(doc);
            
            const apply = await vscode.window.showInformationMessage(
                'Apply this configuration to your project?',
                'Apply', 'Cancel'
            );
            
            if (apply === 'Apply') {
                const terminal = vscode.window.createTerminal({
                    name: 'Baseline Lens Config',
                    cwd: workspaceFolder.uri.fsPath
                });
                terminal.sendText('baseline-lens-cli init-config');
                terminal.show();
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate config: ${error}`);
        }
    }

    private showInstallInstructions(): void {
        const message = `Install Baseline Lens CLI for enhanced features:

npm install -g baseline-lens-cli

This adds:
• Project-wide analysis
• Git hooks integration  
• CI/CD setup
• Smart configuration generation`;

        vscode.window.showInformationMessage(message, { modal: true });
    }

    async showCLICommands(): Promise<void> {
        if (!this.isAvailable()) {
            this.showInstallInstructions();
            return;
        }

        const commands = [
            { label: '$(search) Analyze Project', description: 'Run project-wide compatibility analysis', action: 'analyze' },
            { label: '$(git-branch) Setup Git Hooks', description: 'Configure pre-commit/pre-push hooks', action: 'hooks' },
            { label: '$(gear) Setup CI/CD', description: 'Generate CI/CD configuration', action: 'cicd' },
            { label: '$(settings) Smart Config', description: 'Generate optimal configuration', action: 'config' },
            { label: '$(terminal) Open Terminal', description: 'Open terminal with CLI ready', action: 'terminal' }
        ];

        const selected = await vscode.window.showQuickPick(commands, {
            placeHolder: 'Select CLI command'
        });

        if (!selected) return;

        switch (selected.action) {
            case 'analyze':
                await this.showProjectAnalysis();
                break;
            case 'hooks':
                await this.setupGitHooks();
                break;
            case 'cicd':
                await this.setupCICD();
                break;
            case 'config':
                await this.generateSmartConfig();
                break;
            case 'terminal':
                const terminal = vscode.window.createTerminal('Baseline Lens CLI');
                terminal.sendText('baseline-lens-cli help');
                terminal.show();
                break;
        }
    }

    dispose(): void {
        this.statusBarItem.dispose();
    }
}