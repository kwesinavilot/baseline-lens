import * as vscode from 'vscode';
import * as postcss from 'postcss';
import { DetectedFeature, BaselineStatus } from '../types';
import { AbstractBaseAnalyzer } from './baseAnalyzer';

export class CSSAnalyzer extends AbstractBaseAnalyzer {
    private cssFeatureMap!: Map<string, string>;
    private cssFunctionMap!: Map<string, string>;
    private cssAtRuleMap!: Map<string, string>;
    private cssSelectorMap!: Map<string, string>;

    constructor() {
        super(['css', 'scss', 'sass', 'less', 'stylus']);
        this.initializeFeatureMaps();
    }

    async analyze(content: string, document: vscode.TextDocument): Promise<DetectedFeature[]> {
        if (!this.validateContentSize(content)) {
            return [];
        }

        try {
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
        } catch (error) {
            return this.handleParsingError(error, document);
        }
    }

    private initializeFeatureMaps(): void {
        // CSS Properties mapping to web-features identifiers
        this.cssFeatureMap = new Map([
            // Grid Layout
            ['display', 'css-grid'],
            ['grid', 'css-grid'],
            ['grid-template', 'css-grid'],
            ['grid-template-areas', 'css-grid'],
            ['grid-template-columns', 'css-grid'],
            ['grid-template-rows', 'css-grid'],
            ['grid-area', 'css-grid'],
            ['grid-column', 'css-grid'],
            ['grid-row', 'css-grid'],
            ['grid-gap', 'css-grid'],
            ['gap', 'css-gap'],
            
            // Flexbox
            ['flex', 'flexbox'],
            ['flex-direction', 'flexbox'],
            ['flex-wrap', 'flexbox'],
            ['flex-flow', 'flexbox'],
            ['justify-content', 'flexbox'],
            ['align-items', 'flexbox'],
            ['align-content', 'flexbox'],
            ['align-self', 'flexbox'],
            
            // Container Queries
            ['container', 'css-container-queries'],
            ['container-type', 'css-container-queries'],
            ['container-name', 'css-container-queries'],
            
            // Custom Properties
            ['--*', 'css-variables'],
            
            // Transforms
            ['transform', 'css-transforms'],
            ['transform-origin', 'css-transforms'],
            ['transform-style', 'css-transforms-3d'],
            ['perspective', 'css-transforms-3d'],
            ['perspective-origin', 'css-transforms-3d'],
            
            // Animations
            ['animation', 'css-animation'],
            ['animation-name', 'css-animation'],
            ['animation-duration', 'css-animation'],
            ['animation-timing-function', 'css-animation'],
            ['animation-delay', 'css-animation'],
            ['animation-iteration-count', 'css-animation'],
            ['animation-direction', 'css-animation'],
            ['animation-fill-mode', 'css-animation'],
            ['animation-play-state', 'css-animation'],
            
            // Transitions
            ['transition', 'css-transitions'],
            ['transition-property', 'css-transitions'],
            ['transition-duration', 'css-transitions'],
            ['transition-timing-function', 'css-transitions'],
            ['transition-delay', 'css-transitions'],
            
            // Modern Layout
            ['aspect-ratio', 'css-aspect-ratio'],
            ['object-fit', 'css-object-fit'],
            ['object-position', 'css-object-fit'],
            
            // Typography
            ['font-feature-settings', 'css-font-feature-settings'],
            ['font-variant-ligatures', 'css-font-variant-ligatures'],
            ['text-decoration-color', 'css-text-decoration-color'],
            ['text-decoration-style', 'css-text-decoration-style'],
            ['text-decoration-line', 'css-text-decoration-line'],
            
            // Colors
            ['color-scheme', 'css-color-scheme'],
            ['accent-color', 'css-accent-color'],
            
            // Scroll
            ['scroll-behavior', 'css-scroll-behavior'],
            ['scroll-snap-type', 'css-scroll-snap'],
            ['scroll-snap-align', 'css-scroll-snap'],
            ['overscroll-behavior', 'css-overscroll-behavior'],
        ]);

        // CSS Functions mapping
        this.cssFunctionMap = new Map([
            ['clamp', 'css-math-functions'],
            ['min', 'css-math-functions'],
            ['max', 'css-math-functions'],
            ['calc', 'css-calc'],
            ['var', 'css-variables'],
            ['rgb', 'css-color-function'],
            ['rgba', 'css-color-function'],
            ['hsl', 'css-color-function'],
            ['hsla', 'css-color-function'],
            ['color', 'css-color-function'],
            ['color-mix', 'css-color-mix'],
            ['linear-gradient', 'css-gradients'],
            ['radial-gradient', 'css-gradients'],
            ['conic-gradient', 'css-conic-gradients'],
            ['repeating-linear-gradient', 'css-gradients'],
            ['repeating-radial-gradient', 'css-gradients'],
            ['repeating-conic-gradient', 'css-conic-gradients'],
        ]);

        // CSS At-rules mapping
        this.cssAtRuleMap = new Map([
            ['@media', 'css-mediaqueries'],
            ['@supports', 'css-featurequeries'],
            ['@keyframes', 'css-animation'],
            ['@import', 'css-cascade'],
            ['@layer', 'css-cascade-layers'],
            ['@container', 'css-container-queries'],
            ['@property', 'css-properties-values-api'],
            ['@font-face', 'css-font-loading'],
            ['@font-feature-values', 'css-font-feature-values'],
        ]);

        // CSS Selectors mapping
        this.cssSelectorMap = new Map([
            [':has', 'css-has'],
            [':is', 'css-matches-pseudo'],
            [':where', 'css-where-pseudo'],
            [':not', 'css-not-pseudo'],
            ['::backdrop', 'css-backdrop-pseudo'],
            ['::placeholder', 'css-placeholder-pseudo'],
            ['::selection', 'css-selection-pseudo'],
            [':focus-visible', 'css-focus-visible'],
            [':focus-within', 'css-focus-within'],
            [':target', 'css-target-pseudo'],
            ['::before', 'css-pseudo-elements'],
            ['::after', 'css-pseudo-elements'],
            ['::first-line', 'css-pseudo-elements'],
            ['::first-letter', 'css-pseudo-elements'],
        ]);
    }

    private detectProperties(root: postcss.Root, content: string, document: vscode.TextDocument): DetectedFeature[] {
        const features: DetectedFeature[] = [];

        root.walkDecls((decl) => {
            const prop = decl.prop.toLowerCase();
            let featureId: string | undefined;

            // Check for custom properties (CSS variables)
            if (prop.startsWith('--')) {
                featureId = this.cssFeatureMap.get('--*');
            } else {
                featureId = this.cssFeatureMap.get(prop);
            }

            if (featureId && this.shouldAnalyzeFeature(featureId)) {
                const position = this.getPositionFromSource(decl.source, content);
                if (position) {
                    const range = this.createRange(
                        position.start.line - 1,
                        position.start.column - 1,
                        position.end.line - 1,
                        position.end.column - 1
                    );

                    const baselineStatus = this.getFeatureBaselineStatus(featureId);
                    features.push(this.createDetectedFeature(
                        featureId,
                        prop,
                        'css',
                        range,
                        baselineStatus,
                        `CSS property: ${prop}`
                    ));
                }
            }
        });

        return features;
    }

    private detectSelectors(root: postcss.Root, content: string, document: vscode.TextDocument): DetectedFeature[] {
        const features: DetectedFeature[] = [];

        root.walkRules((rule) => {
            const selector = rule.selector;
            
            // Check for modern pseudo-classes and pseudo-elements
            for (const [selectorPattern, featureId] of this.cssSelectorMap.entries()) {
                if (selector.includes(selectorPattern) && this.shouldAnalyzeFeature(featureId)) {
                    const position = this.getPositionFromSource(rule.source, content);
                    if (position) {
                        const range = this.createRange(
                            position.start.line - 1,
                            position.start.column - 1,
                            position.start.line - 1,
                            position.start.column + selectorPattern.length - 1
                        );

                        const baselineStatus = this.getFeatureBaselineStatus(featureId);
                        features.push(this.createDetectedFeature(
                            featureId,
                            selectorPattern,
                            'css',
                            range,
                            baselineStatus,
                            `CSS selector: ${selectorPattern}`
                        ));
                    }
                }
            }
        });

        return features;
    }

    private detectAtRules(root: postcss.Root, content: string, document: vscode.TextDocument): DetectedFeature[] {
        const features: DetectedFeature[] = [];

        root.walkAtRules((atRule) => {
            const ruleName = `@${atRule.name}`;
            const featureId = this.cssAtRuleMap.get(ruleName);

            if (featureId && this.shouldAnalyzeFeature(featureId)) {
                const position = this.getPositionFromSource(atRule.source, content);
                if (position) {
                    const range = this.createRange(
                        position.start.line - 1,
                        position.start.column - 1,
                        position.start.line - 1,
                        position.start.column + ruleName.length - 1
                    );

                    const baselineStatus = this.getFeatureBaselineStatus(featureId);
                    features.push(this.createDetectedFeature(
                        featureId,
                        ruleName,
                        'css',
                        range,
                        baselineStatus,
                        `CSS at-rule: ${ruleName}`
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
                const featureId = this.cssFunctionMap.get(functionName);

                if (featureId && this.shouldAnalyzeFeature(featureId)) {
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

                        const baselineStatus = this.getFeatureBaselineStatus(featureId);
                        features.push(this.createDetectedFeature(
                            featureId,
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

    private getFeatureBaselineStatus(featureId: string): BaselineStatus {
        // This is a mock implementation. In a real implementation, this would
        // query the CompatibilityDataService to get actual baseline status
        // For now, we'll return mock data based on common feature maturity
        const widelyAvailableFeatures = [
            'flexbox', 'css-transitions', 'css-transforms', 'css-animation',
            'css-calc', 'css-gradients', 'css-pseudo-elements'
        ];
        
        const newlyAvailableFeatures = [
            'css-grid', 'css-gap', 'css-aspect-ratio', 'css-object-fit',
            'css-scroll-behavior', 'css-scroll-snap'
        ];

        if (widelyAvailableFeatures.includes(featureId)) {
            return this.createMockBaselineStatus('widely_available');
        } else if (newlyAvailableFeatures.includes(featureId)) {
            return this.createMockBaselineStatus('newly_available');
        } else {
            return this.createMockBaselineStatus('limited_availability');
        }
    }
}