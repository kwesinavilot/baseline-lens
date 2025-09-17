import * as vscode from 'vscode';
import { parse, Node } from 'acorn';
import { DetectedFeature, BaselineStatus } from '../types';
import { AbstractBaseAnalyzer } from './baseAnalyzer';

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
    private webAPIMap: Map<string, string> = new Map();
    private syntaxFeatureMap: Map<string, string> = new Map();
    private builtinMap: Map<string, string> = new Map();

    constructor() {
        super(['javascript', 'typescript', 'javascriptreact', 'typescriptreact']);
        this.initializeFeatureMaps();
    }

    async analyze(content: string, document: vscode.TextDocument): Promise<DetectedFeature[]> {
        if (!this.validateContentSize(content)) {
            return [];
        }

        try {
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
        } catch (error) {
            return this.handleParsingError(error, document);
        }
    }

    private initializeFeatureMaps(): void {
        // Web APIs mapping to web-features identifiers
        this.webAPIMap = new Map([
            // Fetch API
            ['fetch', 'fetch'],
            ['Request', 'fetch'],
            ['Response', 'fetch'],
            ['Headers', 'fetch'],
            
            // Service Workers
            ['ServiceWorker', 'serviceworkers'],
            ['navigator.serviceWorker', 'serviceworkers'],
            
            // Web Workers
            ['Worker', 'webworkers'],
            ['SharedWorker', 'sharedworkers'],
            
            // Storage APIs
            ['localStorage', 'webstorage'],
            ['sessionStorage', 'webstorage'],
            ['indexedDB', 'indexeddb'],
            
            // Geolocation
            ['navigator.geolocation', 'geolocation'],
            
            // Notifications
            ['Notification', 'notifications'],
            
            // WebRTC
            ['RTCPeerConnection', 'webrtc'],
            ['getUserMedia', 'getusermedia'],
            ['navigator.mediaDevices', 'mediadevices'],
            
            // Canvas and WebGL
            ['getContext', 'canvas'],
            ['WebGLRenderingContext', 'webgl'],
            ['WebGL2RenderingContext', 'webgl2'],
            
            // Web Audio
            ['AudioContext', 'webaudio'],
            ['webkitAudioContext', 'webaudio'],
            
            // Intersection Observer
            ['IntersectionObserver', 'intersectionobserver'],
            
            // Resize Observer
            ['ResizeObserver', 'resizeobserver'],
            
            // Mutation Observer
            ['MutationObserver', 'mutationobserver'],
            
            // Performance API
            ['performance', 'performance-timeline'],
            ['PerformanceObserver', 'performance-observer'],
            
            // Clipboard API
            ['navigator.clipboard', 'clipboard-api'],
            
            // File API
            ['File', 'fileapi'],
            ['FileReader', 'fileapi'],
            ['Blob', 'fileapi'],
            
            // WebSockets
            ['WebSocket', 'websockets'],
            
            // History API
            ['history.pushState', 'history'],
            ['history.replaceState', 'history'],
            
            // Page Visibility
            ['document.visibilityState', 'page-visibility'],
            
            // Fullscreen API
            ['requestFullscreen', 'fullscreen'],
            
            // Pointer Events
            ['PointerEvent', 'pointer-events'],
            
            // Touch Events
            ['TouchEvent', 'touch'],
            
            // Gamepad API
            ['navigator.getGamepads', 'gamepad'],
            
            // Battery API
            ['navigator.getBattery', 'battery-status'],
            
            // Vibration API
            ['navigator.vibrate', 'vibration'],
            
            // Screen Orientation
            ['screen.orientation', 'screen-orientation'],
            
            // Payment Request
            ['PaymentRequest', 'payment-request'],
            
            // Web Share
            ['navigator.share', 'web-share'],
            
            // Broadcast Channel
            ['BroadcastChannel', 'broadcastchannel'],
            
            // AbortController
            ['AbortController', 'abortcontroller'],
            ['AbortSignal', 'abortcontroller'],
        ]);

        // Modern JavaScript syntax features
        this.syntaxFeatureMap = new Map([
            // ES2015 (ES6)
            ['ArrowFunctionExpression', 'arrow-functions'],
            ['TemplateLiteral', 'template-literals'],
            ['SpreadElement', 'spread-syntax'],
            ['RestElement', 'rest-parameters'],
            ['AssignmentPattern', 'default-parameters'],
            ['ClassDeclaration', 'es6-class'],
            ['ClassExpression', 'es6-class'],
            ['ForOfStatement', 'for-of'],
            ['ImportDeclaration', 'es6-module'],
            ['ExportNamedDeclaration', 'es6-module'],
            ['ExportDefaultDeclaration', 'es6-module'],
            ['ExportAllDeclaration', 'es6-module'],
            
            // ES2017
            ['async', 'async-functions'],
            ['await', 'async-functions'],
            
            // ES2018
            ['ObjectPattern', 'object-rest-spread'],
            ['RestElement', 'object-rest-spread'],
            
            // ES2020
            ['ChainExpression', 'optional-chaining'],
            ['LogicalExpression', 'nullish-coalescing'],
            ['ImportExpression', 'dynamic-import'],
            
            // ES2021
            ['LogicalAssignmentExpression', 'logical-assignment'],
            
            // ES2022
            ['PrivateIdentifier', 'private-class-fields'],
            ['PropertyDefinition', 'public-class-fields'],
            ['StaticBlock', 'static-class-features'],
        ]);

        // Built-in objects and methods
        this.builtinMap = new Map([
            // ES2015+
            ['Promise', 'promises'],
            ['Symbol', 'symbol'],
            ['Map', 'map'],
            ['Set', 'set'],
            ['WeakMap', 'weakmap'],
            ['WeakSet', 'weakset'],
            ['Proxy', 'proxy'],
            ['Reflect', 'reflect'],
            
            // ES2016+
            ['Array.prototype.includes', 'array-includes'],
            
            // ES2017+
            ['Object.values', 'object-values'],
            ['Object.entries', 'object-entries'],
            ['Object.getOwnPropertyDescriptors', 'object-getownpropertydescriptors'],
            ['String.prototype.padStart', 'string-padding'],
            ['String.prototype.padEnd', 'string-padding'],
            
            // ES2018+
            ['Promise.prototype.finally', 'promise-finally'],
            
            // ES2019+
            ['Array.prototype.flat', 'array-flat'],
            ['Array.prototype.flatMap', 'array-flat'],
            ['Object.fromEntries', 'object-fromentries'],
            ['String.prototype.trimStart', 'string-trim'],
            ['String.prototype.trimEnd', 'string-trim'],
            
            // ES2020+
            ['BigInt', 'bigint'],
            ['globalThis', 'globalthis'],
            ['Promise.allSettled', 'promise-allsettled'],
            ['String.prototype.matchAll', 'string-matchall'],
            
            // ES2021+
            ['Promise.any', 'promise-any'],
            ['String.prototype.replaceAll', 'string-replaceall'],
            ['WeakRef', 'weakrefs'],
            ['FinalizationRegistry', 'weakrefs'],
            
            // ES2022+
            ['Array.prototype.at', 'array-at'],
            ['String.prototype.at', 'string-at'],
            ['Object.hasOwn', 'object-hasown'],
            
            // Intl APIs
            ['Intl.DateTimeFormat', 'intl-datetimeformat'],
            ['Intl.NumberFormat', 'intl-numberformat'],
            ['Intl.Collator', 'intl-collator'],
            ['Intl.PluralRules', 'intl-pluralrules'],
            ['Intl.RelativeTimeFormat', 'intl-relativetimeformat'],
            ['Intl.ListFormat', 'intl-listformat'],
            ['Intl.Locale', 'intl-locale'],
        ]);
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
                const featureId = this.webAPIMap.get(apiName);
                
                if (featureId && this.shouldAnalyzeFeature(featureId)) {
                    const position = this.getPositionFromOffset(content, node.start);
                    const endPosition = this.getPositionFromOffset(content, node.end);
                    const range = this.createRange(
                        position.line,
                        position.character,
                        endPosition.line,
                        endPosition.character
                    );

                    const baselineStatus = this.getFeatureBaselineStatus(featureId);
                    features.push(this.createDetectedFeature(
                        featureId,
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
                    const featureId = this.webAPIMap.get(name);
                    
                    if (featureId && this.shouldAnalyzeFeature(featureId)) {
                        const position = this.getPositionFromOffset(content, node.start);
                        const endPosition = this.getPositionFromOffset(content, node.end);
                        const range = this.createRange(
                            position.line,
                            position.character,
                            endPosition.line,
                            endPosition.character
                        );

                        const baselineStatus = this.getFeatureBaselineStatus(featureId);
                        features.push(this.createDetectedFeature(
                            featureId,
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
            let featureId: string | undefined;
            let featureName: string = '';

            // Map AST node types to features
            featureId = this.syntaxFeatureMap.get(node.type);
            featureName = node.type;

            // Special cases for syntax features
            if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
                if (node.async) {
                    featureId = this.syntaxFeatureMap.get('async');
                    featureName = 'async function';
                }
                if (node.generator) {
                    featureId = 'generators';
                    featureName = 'generator function';
                }
            }

            if (node.type === 'AwaitExpression') {
                featureId = this.syntaxFeatureMap.get('await');
                featureName = 'await';
            }

            if (node.type === 'LogicalExpression' && node.operator === '??') {
                featureId = this.syntaxFeatureMap.get('LogicalExpression');
                featureName = 'nullish coalescing (??)';
            }

            if (node.type === 'MemberExpression' && node.optional) {
                featureId = this.syntaxFeatureMap.get('ChainExpression');
                featureName = 'optional chaining (?.)';
            }

            if (featureId && this.shouldAnalyzeFeature(featureId)) {
                const position = this.getPositionFromOffset(content, node.start);
                const endPosition = this.getPositionFromOffset(content, node.end);
                const range = this.createRange(
                    position.line,
                    position.character,
                    endPosition.line,
                    endPosition.character
                );

                const baselineStatus = this.getFeatureBaselineStatus(featureId);
                features.push(this.createDetectedFeature(
                    featureId,
                    featureName,
                    'javascript',
                    range,
                    baselineStatus,
                    `JavaScript syntax: ${featureName}`
                ));
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
                const featureId = this.builtinMap.get(memberName);
                
                if (featureId && this.shouldAnalyzeFeature(featureId)) {
                    const position = this.getPositionFromOffset(content, node.start);
                    const endPosition = this.getPositionFromOffset(content, node.end);
                    const range = this.createRange(
                        position.line,
                        position.character,
                        endPosition.line,
                        endPosition.character
                    );

                    const baselineStatus = this.getFeatureBaselineStatus(featureId);
                    features.push(this.createDetectedFeature(
                        featureId,
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
                
                if (name) {
                    const featureId = this.builtinMap.get(name);
                    
                    if (featureId && this.shouldAnalyzeFeature(featureId)) {
                        const position = this.getPositionFromOffset(content, node.start);
                        const endPosition = this.getPositionFromOffset(content, node.end);
                        const range = this.createRange(
                            position.line,
                            position.character,
                            endPosition.line,
                            endPosition.character
                        );

                        const baselineStatus = this.getFeatureBaselineStatus(featureId);
                        features.push(this.createDetectedFeature(
                            featureId,
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

    private getFeatureBaselineStatus(featureId: string): BaselineStatus {
        // Mock implementation - in real implementation, this would query CompatibilityDataService
        const widelyAvailableFeatures = [
            'promises', 'arrow-functions', 'template-literals', 'es6-class', 'fetch',
            'webstorage', 'canvas', 'websockets', 'fileapi', 'geolocation'
        ];
        
        const newlyAvailableFeatures = [
            'async-functions', 'optional-chaining', 'nullish-coalescing', 'bigint',
            'array-flat', 'object-fromentries', 'string-matchall', 'resizeobserver'
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