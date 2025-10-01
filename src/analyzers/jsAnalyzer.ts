import * as vscode from 'vscode';
import { parse, Node } from 'acorn';
import { DetectedFeature, BaselineStatus } from '../types';
import { AbstractBaseAnalyzer } from './baseAnalyzer';
import { CompatibilityDataService } from '../services/compatibilityService';

interface AcornNode extends Node {
    type: string;
    start: number;
    end: number;
    name?: string;
    property?: AcornNode;
    object?: AcornNode;
    callee?: AcornNode;
    id?: AcornNode;
    key?: AcornNode;
    value?: AcornNode;
    left?: AcornNode;
    right?: AcornNode;
    operator?: string;
    argument?: AcornNode;
    optional?: boolean;
    arguments?: AcornNode[];
    body?: AcornNode | AcornNode[];
    declarations?: AcornNode[];
    init?: AcornNode;
    params?: AcornNode[];
    async?: boolean;
    generator?: boolean;
    method?: boolean;
    computed?: boolean;
    kind?: string;
    raw?: string;
}

export class JavaScriptAnalyzer extends AbstractBaseAnalyzer {
    private compatibilityService: CompatibilityDataService;

    constructor(compatibilityService?: CompatibilityDataService) {
        super(['javascript', 'typescript', 'javascriptreact', 'typescriptreact']);
        this.compatibilityService = compatibilityService || new CompatibilityDataService();
    }

    async analyze(content: string, document: vscode.TextDocument): Promise<DetectedFeature[]> {
        return this.safeAnalyze(async () => {
            if (!this.validateContent(content, document)) {
                return [];
            }

            const features: DetectedFeature[] = [];
            
            // Handle TypeScript by stripping types for basic analysis
            const jsContent = this.stripTypeScript(content, document.languageId);
            
            // Parse JavaScript/TypeScript with Acorn
            const ast = parse(jsContent, {
                ecmaVersion: 'latest',
                sourceType: 'module',
                allowReturnOutsideFunction: true,
                allowImportExportEverywhere: true,
                allowAwaitOutsideFunction: true
            }) as AcornNode;
            
            features.push(...this.detectAPIs(ast, content, document));
            features.push(...this.detectSyntax(ast, content, document));
            features.push(...this.detectBuiltins(ast, content, document));
            
            return features;
        }, document, 'javascript_analysis');
    }



    private stripTypeScript(content: string, languageId: string): string {
        if (!languageId.includes('typescript')) {
            return content;
        }

        // Basic TypeScript stripping - remove type annotations
        // This is a simplified approach; a full implementation would use the TypeScript compiler API
        return content
            // Remove type annotations from variables: let x: string = ...
            .replace(/:\s*[A-Za-z_$][A-Za-z0-9_$<>[\]|&\s]*(?=\s*[=;,)])/g, '')
            // Remove interface declarations
            .replace(/interface\s+[A-Za-z_$][A-Za-z0-9_$]*\s*{[^}]*}/g, '')
            // Remove type declarations
            .replace(/type\s+[A-Za-z_$][A-Za-z0-9_$]*\s*=[^;]+;/g, '')
            // Remove generic type parameters
            .replace(/<[A-Za-z_$][A-Za-z0-9_$<>[\]|&\s,]*>/g, '')
            // Remove as type assertions
            .replace(/\s+as\s+[A-Za-z_$][A-Za-z0-9_$<>[\]|&\s]*/g, '')
            // Remove non-null assertions
            .replace(/!/g, '');
    }

    private detectAPIs(ast: AcornNode, content: string, document: vscode.TextDocument): DetectedFeature[] {
        const features: DetectedFeature[] = [];
        
        this.walkAST(ast, (node: AcornNode) => {
            // Detect API usage through member expressions and identifiers
            if (node.type === 'MemberExpression') {
                const apiName = this.getMemberExpressionName(node);
                const bcdKey = this.compatibilityService.mapJSAPIToBCD(apiName);
                let baselineStatus = this.compatibilityService.getFeatureStatus(bcdKey);
                
                // Try BCD lookup if web-features lookup fails
                if (!baselineStatus) {
                    baselineStatus = this.compatibilityService.getBCDStatus(bcdKey);
                }
                
                if (baselineStatus && this.shouldAnalyzeFeature(bcdKey)) {
                    const position = this.getPositionFromOffset(content, node.start);
                    const endPosition = this.getPositionFromOffset(content, node.end);
                    const range = this.createRange(
                        position.line,
                        position.character,
                        endPosition.line,
                        endPosition.character
                    );

                    features.push(this.createDetectedFeature(
                        bcdKey,
                        apiName,
                        'javascript',
                        range,
                        baselineStatus,
                        `Web API: ${apiName}`
                    ));
                }
            }
            
            // Detect API constructors and global objects
            if (node.type === 'Identifier' || node.type === 'NewExpression') {
                const name = node.type === 'NewExpression' && node.callee?.type === 'Identifier' 
                    ? node.callee.name 
                    : node.name;
                
                if (name) {
                    const bcdKey = this.compatibilityService.mapJSAPIToBCD(name);
                    let baselineStatus = this.compatibilityService.getFeatureStatus(bcdKey);
                    
                    // Try BCD lookup if web-features lookup fails
                    if (!baselineStatus) {
                        baselineStatus = this.compatibilityService.getBCDStatus(bcdKey);
                    }
                    
                    if (baselineStatus && this.shouldAnalyzeFeature(bcdKey)) {
                        const position = this.getPositionFromOffset(content, node.start);
                        const endPosition = this.getPositionFromOffset(content, node.end);
                        const range = this.createRange(
                            position.line,
                            position.character,
                            endPosition.line,
                            endPosition.character
                        );

                        features.push(this.createDetectedFeature(
                            bcdKey,
                            name,
                            'javascript',
                            range,
                            baselineStatus,
                            `Web API: ${name}`
                        ));
                    }
                }
            }
        });

        return features;
    }

    private detectSyntax(ast: AcornNode, content: string, document: vscode.TextDocument): DetectedFeature[] {
        const features: DetectedFeature[] = [];
        
        this.walkAST(ast, (node: AcornNode) => {
            let bcdKey: string | undefined;
            let featureName: string = '';

            // Map AST node types to BCD keys
            if (node.type === 'ArrowFunctionExpression') {
                bcdKey = 'javascript.functions.arrow_functions';
                featureName = 'arrow function';
            } else if (node.type === 'TemplateLiteral') {
                bcdKey = 'javascript.grammar.template_literals';
                featureName = 'template literal';
            } else if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
                if (node.async) {
                    bcdKey = 'javascript.statements.async_function';
                    featureName = 'async function';
                }
            } else if (node.type === 'AwaitExpression') {
                bcdKey = 'javascript.operators.await';
                featureName = 'await';
            } else if (node.type === 'LogicalExpression' && node.operator === '??') {
                bcdKey = 'javascript.operators.nullish_coalescing';
                featureName = 'nullish coalescing (??)';
            } else if (node.type === 'MemberExpression' && node.optional) {
                bcdKey = 'javascript.operators.optional_chaining';
                featureName = 'optional chaining (?.)';
            }

            if (bcdKey) {
                const baselineStatus = this.compatibilityService.getFeatureStatus(bcdKey);
                if (baselineStatus && this.shouldAnalyzeFeature(bcdKey)) {
                    const position = this.getPositionFromOffset(content, node.start);
                    const endPosition = this.getPositionFromOffset(content, node.end);
                    const range = this.createRange(
                        position.line,
                        position.character,
                        endPosition.line,
                        endPosition.character
                    );

                    features.push(this.createDetectedFeature(
                        bcdKey,
                        featureName,
                        'javascript',
                        range,
                        baselineStatus,
                        `JavaScript syntax: ${featureName}`
                    ));
                }
            }
        });

        return features;
    }

    private detectBuiltins(ast: AcornNode, content: string, document: vscode.TextDocument): DetectedFeature[] {
        const features: DetectedFeature[] = [];
        
        this.walkAST(ast, (node: AcornNode) => {
            // Detect built-in objects and methods
            if (node.type === 'MemberExpression') {
                const memberName = this.getMemberExpressionName(node);
                const bcdKey = `javascript.builtins.${memberName.replace('.', '.')}`;
                const baselineStatus = this.compatibilityService.getFeatureStatus(bcdKey);
                
                if (baselineStatus && this.shouldAnalyzeFeature(bcdKey)) {
                    const position = this.getPositionFromOffset(content, node.start);
                    const endPosition = this.getPositionFromOffset(content, node.end);
                    const range = this.createRange(
                        position.line,
                        position.character,
                        endPosition.line,
                        endPosition.character
                    );

                    features.push(this.createDetectedFeature(
                        bcdKey,
                        memberName,
                        'javascript',
                        range,
                        baselineStatus,
                        `Built-in: ${memberName}`
                    ));
                }
            }

            // Detect built-in constructors
            if (node.type === 'Identifier' || (node.type === 'NewExpression' && node.callee?.type === 'Identifier')) {
                const name = node.type === 'NewExpression' ? node.callee!.name : node.name;
                
                if (name && ['Promise', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Symbol', 'Proxy'].includes(name)) {
                    const bcdKey = `javascript.builtins.${name}`;
                    const baselineStatus = this.compatibilityService.getFeatureStatus(bcdKey);
                    
                    if (baselineStatus && this.shouldAnalyzeFeature(bcdKey)) {
                        const position = this.getPositionFromOffset(content, node.start);
                        const endPosition = this.getPositionFromOffset(content, node.end);
                        const range = this.createRange(
                            position.line,
                            position.character,
                            endPosition.line,
                            endPosition.character
                        );

                        features.push(this.createDetectedFeature(
                            bcdKey,
                            name,
                            'javascript',
                            range,
                            baselineStatus,
                            `Built-in: ${name}`
                        ));
                    }
                }
            }
        });

        return features;
    }

    private walkAST(node: AcornNode, callback: (node: AcornNode) => void): void {
        callback(node);

        // Recursively walk all child nodes
        for (const key in node) {
            const value = (node as any)[key];
            if (value && typeof value === 'object') {
                if (Array.isArray(value)) {
                    value.forEach(child => {
                        if (child && typeof child === 'object' && child.type) {
                            this.walkAST(child, callback);
                        }
                    });
                } else if (value.type) {
                    this.walkAST(value, callback);
                }
            }
        }
    }

    private getMemberExpressionName(node: AcornNode): string {
        if (node.type !== 'MemberExpression') {
            return '';
        }

        const objectName = node.object?.type === 'Identifier' ? node.object.name :
                          node.object?.type === 'MemberExpression' ? this.getMemberExpressionName(node.object) : '';
        
        const propertyName = node.property?.type === 'Identifier' ? node.property.name : '';

        return objectName && propertyName ? `${objectName}.${propertyName}` : propertyName || objectName || '';
    }


}