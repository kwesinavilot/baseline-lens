import * as vscode from 'vscode';
import { parse, DefaultTreeAdapterMap } from 'parse5';
import { DetectedFeature, BaselineStatus } from '../types';
import { AbstractBaseAnalyzer } from './baseAnalyzer';
import { CSSAnalyzer } from './cssAnalyzer';
import { JavaScriptAnalyzer } from './jsAnalyzer';
import { CompatibilityDataService } from '../services/compatibilityService';

type Element = DefaultTreeAdapterMap['element'];
type Node = DefaultTreeAdapterMap['node'];
type TextNode = DefaultTreeAdapterMap['textNode'];

export class HTMLAnalyzer extends AbstractBaseAnalyzer {
    private compatibilityService: CompatibilityDataService;
    private cssAnalyzer: CSSAnalyzer;
    private jsAnalyzer: JavaScriptAnalyzer;

    constructor(compatibilityService?: CompatibilityDataService) {
        super(['html', 'htm', 'vue', 'svelte', 'angular']);
        this.compatibilityService = compatibilityService || new CompatibilityDataService();
        this.cssAnalyzer = new CSSAnalyzer(this.compatibilityService);
        this.jsAnalyzer = new JavaScriptAnalyzer(this.compatibilityService);
    }

    async analyze(content: string, document: vscode.TextDocument): Promise<DetectedFeature[]> {
        return this.safeAnalyze(async () => {
            if (!this.validateContent(content, document)) {
                return [];
            }

            const features: DetectedFeature[] = [];
            
            // Handle framework templates by extracting HTML content
            const htmlContent = this.extractHTMLFromFramework(content, document.languageId);
            
            // Parse HTML with parse5
            const documentNode = parse(htmlContent, {
                sourceCodeLocationInfo: true
            });
            
            features.push(...this.detectElements(documentNode, content, document));
            features.push(...this.detectAttributes(documentNode, content, document));
            features.push(...this.detectInputTypes(documentNode, content, document));
            
            // Extract and analyze inline CSS and JavaScript
            features.push(...await this.analyzeInlineStyles(documentNode, content, document));
            features.push(...await this.analyzeInlineScripts(documentNode, content, document));
            
            return features;
        }, document, 'html_analysis');
    }



    private extractHTMLFromFramework(content: string, languageId: string): string {
        switch (languageId) {
            case 'vue':
                // Extract HTML from Vue single file component template
                const vueTemplateMatch = content.match(/<template[^>]*>([\s\S]*?)<\/template>/i);
                return vueTemplateMatch ? vueTemplateMatch[1] : content;
                
            case 'svelte':
                // For Svelte, the entire file can contain HTML mixed with logic
                // Remove script and style blocks, keep the rest
                return content
                    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
                    
            case 'angular':
                // Angular templates are usually pure HTML
                return content;
                
            default:
                return content;
        }
    }

    private detectElements(documentNode: Node, content: string, document: vscode.TextDocument): DetectedFeature[] {
        const features: DetectedFeature[] = [];
        
        this.walkHTML(documentNode, (node: Node) => {
            if (node.nodeName && node.nodeName !== '#text' && node.nodeName !== '#document') {
                const elementName = node.nodeName.toLowerCase();
                const bcdKey = this.compatibilityService.mapHTMLElementToBCD(elementName);
                let baselineStatus = this.compatibilityService.getFeatureStatus(bcdKey);
                
                // Try BCD lookup if web-features lookup fails
                if (!baselineStatus) {
                    baselineStatus = this.compatibilityService.getBCDStatus(bcdKey);
                }
                
                if (baselineStatus && this.shouldAnalyzeFeature(bcdKey)) {
                    const location = (node as Element).sourceCodeLocation;
                    if (location) {
                        const range = this.createRange(
                            location.startLine - 1,
                            location.startCol - 1,
                            location.endLine - 1,
                            location.endCol - 1
                        );

                        features.push(this.createDetectedFeature(
                            bcdKey,
                            elementName,
                            'html',
                            range,
                            baselineStatus,
                            `HTML element: <${elementName}>`
                        ));
                    }
                }
            }
        });

        return features;
    }

    private detectAttributes(documentNode: Node, content: string, document: vscode.TextDocument): DetectedFeature[] {
        const features: DetectedFeature[] = [];
        
        this.walkHTML(documentNode, (node: Node) => {
            if ((node as Element).attrs) {
                const element = node as Element;
                
                element.attrs.forEach(attr => {
                    const attrName = attr.name.toLowerCase();
                    const bcdKey = this.compatibilityService.mapHTMLElementToBCD(element.nodeName.toLowerCase(), attrName);
                    let baselineStatus = this.compatibilityService.getFeatureStatus(bcdKey);
                    
                    // Try BCD lookup if web-features lookup fails
                    if (!baselineStatus) {
                        baselineStatus = this.compatibilityService.getBCDStatus(bcdKey);
                    }
                    
                    if (baselineStatus && this.shouldAnalyzeFeature(bcdKey)) {
                        const location = element.sourceCodeLocation;
                        if (location && location.attrs && location.attrs[attr.name]) {
                            const attrLocation = location.attrs[attr.name];
                            const range = this.createRange(
                                attrLocation.startLine - 1,
                                attrLocation.startCol - 1,
                                attrLocation.endLine - 1,
                                attrLocation.endCol - 1
                            );

                            features.push(this.createDetectedFeature(
                                bcdKey,
                                attrName,
                                'html',
                                range,
                                baselineStatus,
                                `HTML attribute: ${attrName}`
                            ));
                        }
                    }
                });
            }
        });

        return features;
    }

    private detectInputTypes(documentNode: Node, content: string, document: vscode.TextDocument): DetectedFeature[] {
        const features: DetectedFeature[] = [];
        
        this.walkHTML(documentNode, (node: Node) => {
            if (node.nodeName === 'input' && (node as Element).attrs) {
                const element = node as Element;
                const typeAttr = element.attrs.find(attr => attr.name === 'type');
                
                if (typeAttr) {
                    const inputType = typeAttr.value.toLowerCase();
                    const bcdKey = `html.elements.input.type_${inputType}`;
                    let baselineStatus = this.compatibilityService.getFeatureStatus(bcdKey);
                    
                    // Try BCD lookup if web-features lookup fails
                    if (!baselineStatus) {
                        baselineStatus = this.compatibilityService.getBCDStatus(bcdKey);
                    }
                    
                    if (baselineStatus && this.shouldAnalyzeFeature(bcdKey)) {
                        const location = element.sourceCodeLocation;
                        if (location && location.attrs && location.attrs.type) {
                            const typeLocation = location.attrs.type;
                            const range = this.createRange(
                                typeLocation.startLine - 1,
                                typeLocation.startCol - 1,
                                typeLocation.endLine - 1,
                                typeLocation.endCol - 1
                            );

                            features.push(this.createDetectedFeature(
                                bcdKey,
                                inputType,
                                'html',
                                range,
                                baselineStatus,
                                `Input type: ${inputType}`
                            ));
                        }
                    }
                }
            }
        });

        return features;
    }

    private async analyzeInlineStyles(documentNode: Node, content: string, document: vscode.TextDocument): Promise<DetectedFeature[]> {
        const features: DetectedFeature[] = [];
        
        this.walkHTML(documentNode, async (node: Node) => {
            // Analyze <style> elements
            if (node.nodeName === 'style') {
                const element = node as Element;
                const textContent = this.getTextContent(element);
                
                if (textContent) {
                    try {
                        const cssFeatures = await this.cssAnalyzer.analyze(textContent, document);
                        // Adjust positions for inline styles
                        const location = element.sourceCodeLocation;
                        if (location) {
                            cssFeatures.forEach(feature => {
                                const adjustedRange = new vscode.Range(
                                    feature.range.start.line + location.startLine - 1,
                                    feature.range.start.character,
                                    feature.range.end.line + location.startLine - 1,
                                    feature.range.end.character
                                );
                                features.push({
                                    ...feature,
                                    range: adjustedRange,
                                    context: `Inline CSS: ${feature.context}`
                                });
                            });
                        }
                    } catch (error) {
                        // Ignore CSS parsing errors in HTML context
                    }
                }
            }
            
            // Analyze style attributes
            if ((node as Element).attrs) {
                const element = node as Element;
                const styleAttr = element.attrs.find(attr => attr.name === 'style');
                
                if (styleAttr && styleAttr.value) {
                    try {
                        // Wrap style attribute value in a CSS rule for parsing
                        const cssContent = `.temp { ${styleAttr.value} }`;
                        const cssFeatures = await this.cssAnalyzer.analyze(cssContent, document);
                        
                        const location = element.sourceCodeLocation;
                        if (location && location.attrs && location.attrs.style) {
                            const styleLocation = location.attrs.style;
                            cssFeatures.forEach(feature => {
                                const adjustedRange = new vscode.Range(
                                    styleLocation.startLine - 1,
                                    styleLocation.startCol - 1 + feature.range.start.character,
                                    styleLocation.startLine - 1,
                                    styleLocation.startCol - 1 + feature.range.end.character
                                );
                                features.push({
                                    ...feature,
                                    range: adjustedRange,
                                    context: `Style attribute: ${feature.context}`
                                });
                            });
                        }
                    } catch (error) {
                        // Ignore CSS parsing errors in HTML context
                    }
                }
            }
        });

        return features;
    }

    private async analyzeInlineScripts(documentNode: Node, content: string, document: vscode.TextDocument): Promise<DetectedFeature[]> {
        const features: DetectedFeature[] = [];
        
        this.walkHTML(documentNode, async (node: Node) => {
            // Analyze <script> elements
            if (node.nodeName === 'script') {
                const element = node as Element;
                const textContent = this.getTextContent(element);
                
                if (textContent) {
                    try {
                        const jsFeatures = await this.jsAnalyzer.analyze(textContent, document);
                        // Adjust positions for inline scripts
                        const location = element.sourceCodeLocation;
                        if (location) {
                            jsFeatures.forEach(feature => {
                                const adjustedRange = new vscode.Range(
                                    feature.range.start.line + location.startLine - 1,
                                    feature.range.start.character,
                                    feature.range.end.line + location.startLine - 1,
                                    feature.range.end.character
                                );
                                features.push({
                                    ...feature,
                                    range: adjustedRange,
                                    context: `Inline JavaScript: ${feature.context}`
                                });
                            });
                        }
                    } catch (error) {
                        // Ignore JavaScript parsing errors in HTML context
                    }
                }
            }
        });

        return features;
    }

    private walkHTML(node: Node, callback: (node: Node) => void): void {
        callback(node);

        if ('childNodes' in node && node.childNodes) {
            node.childNodes.forEach(child => {
                this.walkHTML(child, callback);
            });
        }
    }

    private getTextContent(element: Element): string {
        let textContent = '';
        
        if (element.childNodes) {
            element.childNodes.forEach(child => {
                if (child.nodeName === '#text') {
                    textContent += (child as TextNode).value;
                }
            });
        }
        
        return textContent;
    }


}