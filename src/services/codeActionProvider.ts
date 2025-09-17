import * as vscode from 'vscode';
import { DetectedFeature } from '../types';
import { SuggestionEngine, FeatureSuggestion, Alternative, Polyfill } from './suggestionEngine';

export class BaselineLensCodeActionProvider implements vscode.CodeActionProvider {
    private suggestionEngine: SuggestionEngine;
    private documentFeatures: Map<string, DetectedFeature[]> = new Map();

    constructor(suggestionEngine: SuggestionEngine) {
        this.suggestionEngine = suggestionEngine;
    }

    /**
     * Update features for a document
     */
    updateFeatures(document: vscode.TextDocument, features: DetectedFeature[]): void {
        this.documentFeatures.set(document.uri.toString(), features);
    }

    /**
     * Clear features for a document
     */
    clearFeatures(document: vscode.TextDocument): void {
        this.documentFeatures.delete(document.uri.toString());
    }

    /**
     * Provide code actions for detected features
     */
    provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
        const actions: vscode.CodeAction[] = [];
        const features = this.documentFeatures.get(document.uri.toString()) || [];

        // Find features that intersect with the current range
        const relevantFeatures = features.filter(feature => 
            feature.range.intersection(range) !== undefined
        );

        for (const feature of relevantFeatures) {
            // Only provide actions for features that need suggestions
            if (this.shouldProvideActions(feature)) {
                const suggestion = this.suggestionEngine.generateSuggestions(feature);
                actions.push(...this.createCodeActionsForSuggestion(document, suggestion));
            }
        }

        return actions;
    }

    /**
     * Check if code actions should be provided for a feature
     */
    private shouldProvideActions(feature: DetectedFeature): boolean {
        return feature.baselineStatus.status === 'newly_available' || 
               feature.baselineStatus.status === 'limited_availability';
    }

    /**
     * Create code actions for a feature suggestion
     */
    private createCodeActionsForSuggestion(
        document: vscode.TextDocument,
        suggestion: FeatureSuggestion
    ): vscode.CodeAction[] {
        const actions: vscode.CodeAction[] = [];

        // Create actions for alternatives
        for (const alternative of suggestion.alternatives) {
            if (alternative.codeSnippet) {
                actions.push(this.createAlternativeAction(document, suggestion.feature, alternative));
            }
        }

        // Create actions for polyfills
        for (const polyfill of suggestion.polyfills) {
            actions.push(this.createPolyfillAction(document, suggestion.feature, polyfill));
        }

        // Create educational action
        if (suggestion.educationalHints.length > 0) {
            actions.push(this.createEducationalAction(suggestion));
        }

        // Create "Learn More" action
        actions.push(this.createLearnMoreAction(suggestion.feature));

        return actions;
    }

    /**
     * Create code action for alternative implementation
     */
    private createAlternativeAction(
        document: vscode.TextDocument,
        feature: DetectedFeature,
        alternative: Alternative
    ): vscode.CodeAction {
        const action = new vscode.CodeAction(
            `Use ${alternative.name} instead`,
            vscode.CodeActionKind.QuickFix
        );

        action.diagnostics = this.getDiagnosticsForFeature(document, feature);
        action.isPreferred = alternative.supportLevel === 'widely_available';

        // Create edit to replace the feature with alternative
        const edit = new vscode.WorkspaceEdit();
        if (alternative.codeSnippet) {
            edit.replace(document.uri, feature.range, alternative.codeSnippet);
        }
        action.edit = edit;

        // Documentation is handled through hover and other mechanisms

        return action;
    }

    /**
     * Create code action for polyfill installation
     */
    private createPolyfillAction(
        document: vscode.TextDocument,
        feature: DetectedFeature,
        polyfill: Polyfill
    ): vscode.CodeAction {
        const action = new vscode.CodeAction(
            `Add ${polyfill.name} polyfill`,
            vscode.CodeActionKind.QuickFix
        );

        action.diagnostics = this.getDiagnosticsForFeature(document, feature);

        // Create command to show polyfill information
        action.command = {
            title: `Add ${polyfill.name} polyfill`,
            command: 'baseline-lens.showPolyfillInfo',
            arguments: [polyfill]
        };

        // Add documentation
        let documentation = `**${polyfill.name}**\n\n${polyfill.description}`;
        if (polyfill.installCommand) {
            documentation += `\n\n**Installation:**\n\`\`\`bash\n${polyfill.installCommand}\n\`\`\``;
        }
        if (polyfill.codeSnippet) {
            documentation += `\n\n**Usage:**\n\`\`\`javascript\n${polyfill.codeSnippet}\n\`\`\``;
        }

        // Documentation is handled through the command execution

        return action;
    }

    /**
     * Create educational code action
     */
    private createEducationalAction(suggestion: FeatureSuggestion): vscode.CodeAction {
        const action = new vscode.CodeAction(
            `Learn about ${suggestion.feature.name}`,
            vscode.CodeActionKind.Empty
        );

        action.command = {
            title: `Learn about ${suggestion.feature.name}`,
            command: 'baseline-lens.showEducationalInfo',
            arguments: [suggestion]
        };

        // Educational content is handled through the command execution

        return action;
    }

    /**
     * Create "Learn More" action with external links
     */
    private createLearnMoreAction(feature: DetectedFeature): vscode.CodeAction {
        const action = new vscode.CodeAction(
            `Learn more about ${feature.name}`,
            vscode.CodeActionKind.Empty
        );

        action.command = {
            title: `Learn more about ${feature.name}`,
            command: 'baseline-lens.openDocumentation',
            arguments: [feature]
        };

        return action;
    }

    /**
     * Get diagnostics for a specific feature
     */
    private getDiagnosticsForFeature(
        document: vscode.TextDocument,
        feature: DetectedFeature
    ): vscode.Diagnostic[] {
        // Get diagnostics from the current document that match this feature
        const diagnostics = vscode.languages.getDiagnostics(document.uri);
        return diagnostics.filter(diagnostic => 
            diagnostic.source === 'baseline-lens' &&
            diagnostic.code === feature.id &&
            diagnostic.range.intersection(feature.range) !== undefined
        );
    }

    /**
     * Format support level for display
     */
    private formatSupportLevel(supportLevel: string): string {
        switch (supportLevel) {
            case 'widely_available':
                return '✅ Widely Available';
            case 'newly_available':
                return '⚠️ Newly Available';
            case 'limited_availability':
                return '🚫 Limited Availability';
            default:
                return '❓ Unknown';
        }
    }
}

/**
 * Commands for handling code action interactions
 */
export class CodeActionCommands {
    /**
     * Show polyfill information and installation instructions
     */
    static async showPolyfillInfo(polyfill: Polyfill): Promise<void> {
        const items: vscode.QuickPickItem[] = [];

        if (polyfill.installCommand) {
            items.push({
                label: '📦 Install Package',
                description: polyfill.installCommand,
                detail: 'Copy installation command to clipboard'
            });
        }

        if (polyfill.codeSnippet) {
            items.push({
                label: '📋 Copy Code Snippet',
                description: 'Copy usage example to clipboard',
                detail: polyfill.codeSnippet
            });
        }

        if (polyfill.url) {
            items.push({
                label: '🌐 Open Documentation',
                description: polyfill.url,
                detail: 'Open polyfill documentation in browser'
            });
        }

        const selected = await vscode.window.showQuickPick(items, {
            title: `${polyfill.name} - ${polyfill.description}`,
            placeHolder: 'Choose an action'
        });

        if (selected) {
            if (selected.label.includes('Install Package') && polyfill.installCommand) {
                await vscode.env.clipboard.writeText(polyfill.installCommand);
                vscode.window.showInformationMessage('Installation command copied to clipboard');
            } else if (selected.label.includes('Copy Code Snippet') && polyfill.codeSnippet) {
                await vscode.env.clipboard.writeText(polyfill.codeSnippet);
                vscode.window.showInformationMessage('Code snippet copied to clipboard');
            } else if (selected.label.includes('Open Documentation') && polyfill.url) {
                vscode.env.openExternal(vscode.Uri.parse(polyfill.url));
            }
        }
    }

    /**
     * Show educational information about a feature
     */
    static async showEducationalInfo(suggestion: FeatureSuggestion): Promise<void> {
        const content = new vscode.MarkdownString();
        content.isTrusted = true;

        // Feature header
        const statusIcon = suggestion.riskLevel === 'high' ? '🚫' : 
                          suggestion.riskLevel === 'medium' ? '⚠️' : '✅';
        content.appendMarkdown(`# ${statusIcon} ${suggestion.feature.name}\n\n`);

        // Risk level
        content.appendMarkdown(`**Risk Level:** ${suggestion.riskLevel.toUpperCase()}\n\n`);

        // Educational hints
        if (suggestion.educationalHints.length > 0) {
            content.appendMarkdown(`## What you should know\n\n`);
            suggestion.educationalHints.forEach(hint => {
                content.appendMarkdown(`- ${hint}\n`);
            });
            content.appendMarkdown('\n');
        }

        // Alternatives
        if (suggestion.alternatives.length > 0) {
            content.appendMarkdown(`## Alternatives\n\n`);
            suggestion.alternatives.forEach(alt => {
                const supportIcon = alt.supportLevel === 'widely_available' ? '✅' : 
                                   alt.supportLevel === 'newly_available' ? '⚠️' : '🚫';
                content.appendMarkdown(`### ${supportIcon} ${alt.name}\n`);
                content.appendMarkdown(`${alt.description}\n\n`);
            });
        }

        // Polyfills
        if (suggestion.polyfills.length > 0) {
            content.appendMarkdown(`## Available Polyfills\n\n`);
            suggestion.polyfills.forEach(polyfill => {
                content.appendMarkdown(`### 📦 ${polyfill.name}\n`);
                content.appendMarkdown(`${polyfill.description}\n\n`);
            });
        }

        // Show in webview
        const panel = vscode.window.createWebviewPanel(
            'baselineLensEducation',
            `Baseline Lens: ${suggestion.feature.name}`,
            vscode.ViewColumn.Beside,
            { enableScripts: false }
        );

        panel.webview.html = this.getWebviewContent(content.value);
    }

    /**
     * Open documentation for a feature
     */
    static async openDocumentation(feature: DetectedFeature): Promise<void> {
        const items: vscode.QuickPickItem[] = [
            {
                label: '🌐 MDN Web Docs',
                description: `Search for ${feature.name} on MDN`,
                detail: 'Open Mozilla Developer Network documentation'
            },
            {
                label: '📊 Can I Use',
                description: `Check ${feature.name} support on Can I Use`,
                detail: 'View detailed browser compatibility data'
            },
            {
                label: '📋 Copy Feature Name',
                description: feature.name,
                detail: 'Copy feature name to clipboard for manual search'
            }
        ];

        const selected = await vscode.window.showQuickPick(items, {
            title: `Learn more about ${feature.name}`,
            placeHolder: 'Choose a documentation source'
        });

        if (selected) {
            if (selected.label.includes('MDN Web Docs')) {
                const searchUrl = `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(feature.name)}`;
                vscode.env.openExternal(vscode.Uri.parse(searchUrl));
            } else if (selected.label.includes('Can I Use')) {
                const searchUrl = `https://caniuse.com/?search=${encodeURIComponent(feature.name)}`;
                vscode.env.openExternal(vscode.Uri.parse(searchUrl));
            } else if (selected.label.includes('Copy Feature Name')) {
                await vscode.env.clipboard.writeText(feature.name);
                vscode.window.showInformationMessage('Feature name copied to clipboard');
            }
        }
    }

    /**
     * Generate HTML content for webview
     */
    private static getWebviewContent(markdownContent: string): string {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Baseline Lens Educational Info</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    line-height: 1.6;
                    padding: 20px;
                    max-width: 800px;
                    margin: 0 auto;
                }
                h1, h2, h3 { color: var(--vscode-textLink-foreground); }
                code {
                    background-color: var(--vscode-textCodeBlock-background);
                    padding: 2px 4px;
                    border-radius: 3px;
                }
                pre {
                    background-color: var(--vscode-textCodeBlock-background);
                    padding: 10px;
                    border-radius: 5px;
                    overflow-x: auto;
                }
                ul { padding-left: 20px; }
                li { margin-bottom: 8px; }
            </style>
        </head>
        <body>
            ${markdownContent}
        </body>
        </html>`;
    }
}