import * as vscode from 'vscode';
import { parse, DefaultTreeAdapterMap } from 'parse5';
import { DetectedFeature, BaselineStatus } from '../types';
import { AbstractBaseAnalyzer } from './baseAnalyzer';
import { CSSAnalyzer } from './cssAnalyzer';
import { JavaScriptAnalyzer } from './jsAnalyzer';

type Element = DefaultTreeAdapterMap['element'];
type Node = DefaultTreeAdapterMap['node'];
type TextNode = DefaultTreeAdapterMap['textNode'];

export class HTMLAnalyzer extends AbstractBaseAnalyzer {
    private htmlElementMap: Map<string, string> = new Map();
    private htmlAttributeMap: Map<string, string> = new Map();
    private inputTypeMap: Map<string, string> = new Map();
    private cssAnalyzer: CSSAnalyzer;
    private jsAnalyzer: JavaScriptAnalyzer;

    constructor() {
        super(['html', 'htm', 'vue', 'svelte', 'angular']);
        this.cssAnalyzer = new CSSAnalyzer();
        this.jsAnalyzer = new JavaScriptAnalyzer();
        this.initializeFeatureMaps();
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

    private initializeFeatureMaps(): void {
        // HTML5 elements mapping to web-features identifiers
        this.htmlElementMap = new Map([
            // Semantic elements
            ['article', 'html5-semantic'],
            ['aside', 'html5-semantic'],
            ['figcaption', 'html5-semantic'],
            ['figure', 'html5-semantic'],
            ['footer', 'html5-semantic'],
            ['header', 'html5-semantic'],
            ['main', 'html5-semantic'],
            ['mark', 'html5-semantic'],
            ['nav', 'html5-semantic'],
            ['section', 'html5-semantic'],
            ['summary', 'html5-semantic'],
            ['time', 'html5-semantic'],
            
            // Media elements
            ['audio', 'audio'],
            ['video', 'video'],
            ['source', 'audio'],
            ['track', 'webvtt'],
            
            // Form elements
            ['datalist', 'datalist'],
            ['keygen', 'keygen'],
            ['output', 'form-validation'],
            ['progress', 'progressmeter'],
            ['meter', 'meter'],
            
            // Interactive elements
            ['details', 'details'],
            ['dialog', 'dialog'],
            ['menu', 'menu'],
            
            // Graphics and media
            ['canvas', 'canvas'],
            ['svg', 'svg'],
            
            // Web Components
            ['template', 'template'],
            ['slot', 'shadowdom'],
            
            // Embedded content
            ['embed', 'plugins'],
            ['object', 'plugins'],
            ['iframe', 'iframe'],
            
            // Ruby annotation
            ['ruby', 'ruby'],
            ['rt', 'ruby'],
            ['rp', 'ruby'],
        ]);

        // HTML attributes mapping
        this.htmlAttributeMap = new Map([
            // Global attributes
            ['contenteditable', 'contenteditable'],
            ['draggable', 'dragndrop'],
            ['hidden', 'hidden'],
            ['spellcheck', 'spellcheck'],
            ['translate', 'translate'],
            ['dir', 'dir'],
            ['lang', 'lang'],
            
            // ARIA attributes
            ['aria-label', 'wai-aria'],
            ['aria-labelledby', 'wai-aria'],
            ['aria-describedby', 'wai-aria'],
            ['aria-hidden', 'wai-aria'],
            ['aria-expanded', 'wai-aria'],
            ['aria-controls', 'wai-aria'],
            ['aria-live', 'wai-aria'],
            ['role', 'wai-aria'],
            
            // Form attributes
            ['autocomplete', 'form-validation'],
            ['autofocus', 'autofocus'],
            ['form', 'form-validation'],
            ['formaction', 'form-validation'],
            ['formenctype', 'form-validation'],
            ['formmethod', 'form-validation'],
            ['formnovalidate', 'form-validation'],
            ['formtarget', 'form-validation'],
            ['list', 'datalist'],
            ['max', 'form-validation'],
            ['min', 'form-validation'],
            ['multiple', 'form-validation'],
            ['pattern', 'form-validation'],
            ['placeholder', 'input-placeholder'],
            ['required', 'form-validation'],
            ['step', 'form-validation'],
            
            // Media attributes
            ['autoplay', 'audio'],
            ['controls', 'audio'],
            ['loop', 'audio'],
            ['muted', 'audio'],
            ['preload', 'audio'],
            ['poster', 'video'],
            
            // Link attributes
            ['download', 'download'],
            ['rel', 'link-rel'],
            ['hreflang', 'hreflang'],
            ['type', 'link-type'],
            
            // Security attributes
            ['crossorigin', 'cors'],
            ['integrity', 'subresource-integrity'],
            ['referrerpolicy', 'referrer-policy'],
            
            // Performance attributes
            ['loading', 'loading'],
            ['decoding', 'img-decoding-async'],
            
            // Microdata
            ['itemscope', 'microdata'],
            ['itemtype', 'microdata'],
            ['itemprop', 'microdata'],
            ['itemref', 'microdata'],
            ['itemid', 'microdata'],
        ]);

        // Input types mapping
        this.inputTypeMap = new Map([
            ['color', 'input-color'],
            ['date', 'input-datetime'],
            ['datetime-local', 'input-datetime'],
            ['email', 'input-email'],
            ['month', 'input-datetime'],
            ['number', 'input-number'],
            ['range', 'input-range'],
            ['search', 'input-search'],
            ['tel', 'input-tel'],
            ['time', 'input-datetime'],
            ['url', 'input-url'],
            ['week', 'input-datetime'],
        ]);
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
                const featureId = this.htmlElementMap.get(elementName);
                
                if (featureId && this.shouldAnalyzeFeature(featureId)) {
                    const location = (node as Element).sourceCodeLocation;
                    if (location) {
                        const range = this.createRange(
                            location.startLine - 1,
                            location.startCol - 1,
                            location.endLine - 1,
                            location.endCol - 1
                        );

                        const baselineStatus = this.getFeatureBaselineStatus(featureId);
                        features.push(this.createDetectedFeature(
                            featureId,
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
                    let featureId = this.htmlAttributeMap.get(attrName);
                    
                    // Handle ARIA attributes with wildcard matching
                    if (!featureId && attrName.startsWith('aria-')) {
                        featureId = this.htmlAttributeMap.get('aria-label'); // Use any ARIA feature as representative
                    }
                    
                    if (featureId && this.shouldAnalyzeFeature(featureId)) {
                        const location = element.sourceCodeLocation;
                        if (location && location.attrs && location.attrs[attr.name]) {
                            const attrLocation = location.attrs[attr.name];
                            const range = this.createRange(
                                attrLocation.startLine - 1,
                                attrLocation.startCol - 1,
                                attrLocation.endLine - 1,
                                attrLocation.endCol - 1
                            );

                            const baselineStatus = this.getFeatureBaselineStatus(featureId);
                            features.push(this.createDetectedFeature(
                                featureId,
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
                    const featureId = this.inputTypeMap.get(inputType);
                    
                    if (featureId && this.shouldAnalyzeFeature(featureId)) {
                        const location = element.sourceCodeLocation;
                        if (location && location.attrs && location.attrs.type) {
                            const typeLocation = location.attrs.type;
                            const range = this.createRange(
                                typeLocation.startLine - 1,
                                typeLocation.startCol - 1,
                                typeLocation.endLine - 1,
                                typeLocation.endCol - 1
                            );

                            const baselineStatus = this.getFeatureBaselineStatus(featureId);
                            features.push(this.createDetectedFeature(
                                featureId,
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

    private getFeatureBaselineStatus(featureId: string): BaselineStatus {
        // Mock implementation - in real implementation, this would query CompatibilityDataService
        const widelyAvailableFeatures = [
            'html5-semantic', 'audio', 'video', 'canvas', 'form-validation',
            'contenteditable', 'dragndrop', 'hidden', 'input-email', 'input-url'
        ];
        
        const newlyAvailableFeatures = [
            'dialog', 'details', 'template', 'loading', 'input-color',
            'input-datetime', 'wai-aria', 'subresource-integrity'
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