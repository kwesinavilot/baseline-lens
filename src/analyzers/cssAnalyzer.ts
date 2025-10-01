import * as vscode from 'vscode';
import * as postcss from 'postcss';
import { DetectedFeature, BaselineStatus } from '../types';
import { AbstractBaseAnalyzer } from './baseAnalyzer';
import { CompatibilityDataService } from '../services/compatibilityService';

export class CSSAnalyzer extends AbstractBaseAnalyzer {
    private compatibilityService: CompatibilityDataService;

    constructor(compatibilityService?: CompatibilityDataService) {
        super(['css', 'scss', 'sass', 'less', 'stylus']);
        this.compatibilityService = compatibilityService || new CompatibilityDataService();
    }

    async analyze(content: string, document: vscode.TextDocument): Promise<DetectedFeature[]> {
        return this.safeAnalyze(async () => {
            if (!this.validateContent(content, document)) {
                return [];
            }

            const features: DetectedFeature[] = [];
            
            // Handle CSS-in-JS detection first
            if (this.isCSSInJS(document)) {
                features.push(...await this.analyzeCSSInJS(content, document));
            } else {
                // Parse CSS content with PostCSS
                const root = postcss.parse(content, { from: document.fileName });
                
                features.push(...this.detectProperties(root, content, document));
                features.push(...this.detectSelectors(root, content, document));
                features.push(...this.detectAtRules(root, content, document));
                features.push(...this.detectFunctions(root, content, document));
            }
            
            return features;
        }, document, 'css_analysis');
    }



    private detectProperties(root: postcss.Root, content: string, document: vscode.TextDocument): DetectedFeature[] {
        const features: DetectedFeature[] = [];

        root.walkDecls((decl) => {
            const prop = decl.prop.toLowerCase();

            const value = decl.value.toLowerCase();

            // Get BCD key for this property
            const bcdKey = this.compatibilityService.mapCSSPropertyToBCD(prop, this.extractFirstValue(value));
            const baselineStatus = this.compatibilityService.getBCDStatus(bcdKey);
            
            if (baselineStatus && this.shouldAnalyzeFeature(bcdKey)) {
                const position = this.getPositionFromSource(decl.source, content);
                if (position) {
                    const range = this.createRange(
                        position.start.line - 1,
                        position.start.column - 1,
                        position.end.line - 1,
                        position.end.column - 1
                    );

                    features.push(this.createDetectedFeature(
                        bcdKey,
                        `${prop}: ${this.extractFirstValue(value)}`,
                        'css',
                        range,
                        baselineStatus,
                        `CSS property: ${prop}`
                    ));
                }
            }
            console.log(`CSS property '${prop}' -> BCD key '${bcdKey}' -> status:`, baselineStatus);
        });

        return features;
    }

    private detectSelectors(root: postcss.Root, content: string, document: vscode.TextDocument): DetectedFeature[] {
        const features: DetectedFeature[] = [];

        root.walkRules((rule) => {
            const selector = rule.selector;
            
            // Check for modern selectors
            const modernSelectors = [':has', ':is', ':where', ':not', '::backdrop', '::placeholder'];
            for (const selectorPattern of modernSelectors) {
                if (selector.includes(selectorPattern)) {
                    const bcdKey = `css.selectors.${selectorPattern.replace(/:/g, '').replace(/-/g, '_')}`;
                    const baselineStatus = this.compatibilityService.getBCDStatus(bcdKey);
                    
                    if (baselineStatus && baselineStatus.status !== 'widely_available' && this.shouldAnalyzeFeature(bcdKey)) {
                        const position = this.getPositionFromSource(rule.source, content);
                        if (position) {
                            const range = this.createRange(
                                position.start.line - 1,
                                position.start.column - 1,
                                position.start.line - 1,
                                position.start.column + selectorPattern.length - 1
                            );

                            features.push(this.createDetectedFeature(
                                bcdKey,
                                selectorPattern,
                                'css',
                                range,
                                baselineStatus,
                                `CSS selector: ${selectorPattern}`
                            ));
                        }
                    }
                }
            }
        });

        return features;
    }

    private detectAtRules(root: postcss.Root, content: string, document: vscode.TextDocument): DetectedFeature[] {
        const features: DetectedFeature[] = [];

        root.walkAtRules((atRule) => {
            const ruleName = atRule.name;
            const bcdKey = `css.at_rules.${ruleName.replace(/-/g, '_')}`;
            const baselineStatus = this.compatibilityService.getBCDStatus(bcdKey);

            if (baselineStatus && baselineStatus.status !== 'widely_available' && this.shouldAnalyzeFeature(bcdKey)) {
                const position = this.getPositionFromSource(atRule.source, content);
                if (position) {
                    const range = this.createRange(
                        position.start.line - 1,
                        position.start.column - 1,
                        position.start.line - 1,
                        position.start.column + ruleName.length - 1
                    );

                    features.push(this.createDetectedFeature(
                        bcdKey,
                        `@${ruleName}`,
                        'css',
                        range,
                        baselineStatus,
                        `CSS at-rule: @${ruleName}`
                    ));
                }
            }
        });

        return features;
    }

    private detectFunctions(root: postcss.Root, content: string, document: vscode.TextDocument): DetectedFeature[] {
        const features: DetectedFeature[] = [];

        root.walkDecls((decl) => {
            const value = decl.value;
            
            // Use regex to find function calls in CSS values
            const functionRegex = /([a-z-]+)\s*\(/gi;
            let match;

            while ((match = functionRegex.exec(value)) !== null) {
                const functionName = match[1].toLowerCase();
                const bcdKey = `css.types.${functionName.replace(/-/g, '_')}`;
                const baselineStatus = this.compatibilityService.getBCDStatus(bcdKey);

                if (baselineStatus && baselineStatus.status !== 'widely_available' && this.shouldAnalyzeFeature(bcdKey)) {
                    const position = this.getPositionFromSource(decl.source, content);
                    if (position) {
                        // Calculate the position of the function within the declaration
                        const functionStart = position.start.column + decl.prop.length + 1 + match.index!;
                        const range = this.createRange(
                            position.start.line - 1,
                            functionStart - 1,
                            position.start.line - 1,
                            functionStart + functionName.length - 1
                        );

                        features.push(this.createDetectedFeature(
                            bcdKey,
                            functionName,
                            'css',
                            range,
                            baselineStatus,
                            `CSS function: ${functionName}()`
                        ));
                    }
                }
            }
        });

        return features;
    }

    private isCSSInJS(document: vscode.TextDocument): boolean {
        const languageId = document.languageId;
        return ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'].includes(languageId);
    }

    private async analyzeCSSInJS(content: string, document: vscode.TextDocument): Promise<DetectedFeature[]> {
        const features: DetectedFeature[] = [];
        
        // Detect styled-components, emotion, and other CSS-in-JS patterns
        const cssInJSPatterns = [
            // styled-components: styled.div`...`
            /styled\.[a-zA-Z]+`([^`]+)`/g,
            // css prop: css`...`
            /css`([^`]+)`/g,
            // emotion: css({ ... })
            /css\s*\(\s*{([^}]+)}\s*\)/g,
            // style objects: { color: 'red', ... }
            /style\s*=\s*\{\s*\{([^}]+)\}\s*\}/g,
        ];

        for (const pattern of cssInJSPatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const cssContent = match[1];
                if (cssContent) {
                    try {
                        // Parse the extracted CSS content
                        const root = postcss.parse(cssContent);
                        const cssFeatures = [
                            ...this.detectProperties(root, cssContent, document),
                            ...this.detectSelectors(root, cssContent, document),
                            ...this.detectAtRules(root, cssContent, document),
                            ...this.detectFunctions(root, cssContent, document)
                        ];

                        // Adjust positions to account for the CSS-in-JS context
                        const matchStart = this.getPositionFromOffset(content, match.index!);
                        for (const feature of cssFeatures) {
                            const adjustedRange = new vscode.Range(
                                feature.range.start.line + matchStart.line,
                                feature.range.start.character + matchStart.character,
                                feature.range.end.line + matchStart.line,
                                feature.range.end.character + matchStart.character
                            );
                            features.push({
                                ...feature,
                                range: adjustedRange,
                                context: `CSS-in-JS: ${feature.context}`
                            });
                        }
                    } catch (error) {
                        // Ignore parsing errors for CSS-in-JS content
                        continue;
                    }
                }
            }
        }

        return features;
    }

    private getPositionFromSource(source: postcss.Source | undefined, content: string): { start: { line: number; column: number }; end: { line: number; column: number } } | null {
        if (!source || !source.start || !source.end) {
            return null;
        }

        return {
            start: { line: source.start.line, column: source.start.column },
            end: { line: source.end.line, column: source.end.column }
        };
    }

    private extractFirstValue(value: string): string {
        // Extract the first meaningful value from CSS property value
        const trimmed = value.trim();
        const firstWord = trimmed.split(/\s+/)[0];
        return firstWord.replace(/[;,()]/g, '');
    }
}