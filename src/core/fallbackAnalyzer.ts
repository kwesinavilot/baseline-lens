import * as vscode from 'vscode';
import { DetectedFeature, BaselineStatus } from '../types';
import { ErrorHandler, ErrorContext } from './errorHandler';

/**
 * Fallback analyzer that provides basic feature detection when full parsing fails
 */
export class FallbackAnalyzer {
    private errorHandler: ErrorHandler;

    constructor() {
        this.errorHandler = ErrorHandler.getInstance();
    }

    /**
     * Perform fallback analysis using regex patterns when parsing fails
     */
    async performFallbackAnalysis(
        content: string, 
        document: vscode.TextDocument,
        originalError: unknown
    ): Promise<DetectedFeature[]> {
        const context: ErrorContext = {
            fileName: document.fileName,
            languageId: document.languageId,
            fileSize: content.length,
            operation: 'fallback_analysis'
        };

        try {
            const features: DetectedFeature[] = [];
            
            switch (document.languageId) {
                case 'css':
                case 'scss':
                case 'sass':
                case 'less':
                    features.push(...this.fallbackCSSAnalysis(content, document));
                    break;
                    
                case 'javascript':
                case 'typescript':
                case 'javascriptreact':
                case 'typescriptreact':
                    features.push(...this.fallbackJSAnalysis(content, document));
                    break;
                    
                case 'html':
                    features.push(...this.fallbackHTMLAnalysis(content, document));
                    break;
                    
                default:
                    // Try to detect any web features using generic patterns
                    features.push(...this.fallbackGenericAnalysis(content, document));
            }

            return features;
        } catch (fallbackError) {
            this.errorHandler.handleUnknownError(fallbackError, context);
            return [];
        }
    }

    /**
     * Fallback CSS analysis using regex patterns
     */
    private fallbackCSSAnalysis(content: string, document: vscode.TextDocument): DetectedFeature[] {
        const features: DetectedFeature[] = [];
        const lines = content.split('\n');

        // Common CSS patterns that are likely to be modern features
        const cssPatterns = [
            // Grid
            { pattern: /\b(display\s*:\s*grid|grid-template|grid-area|grid-column|grid-row)\b/gi, feature: 'css-grid', name: 'CSS Grid' },
            // Flexbox
            { pattern: /\b(display\s*:\s*flex|flex-direction|justify-content|align-items)\b/gi, feature: 'flexbox', name: 'Flexbox' },
            // Custom Properties
            { pattern: /--[\w-]+\s*:/g, feature: 'css-variables', name: 'CSS Custom Properties' },
            // Container Queries
            { pattern: /@container\b/gi, feature: 'css-container-queries', name: 'Container Queries' },
            // Modern selectors
            { pattern: /:has\(/gi, feature: 'css-has', name: ':has() selector' },
            { pattern: /:is\(/gi, feature: 'css-matches-pseudo', name: ':is() selector' },
            { pattern: /:where\(/gi, feature: 'css-where-pseudo', name: ':where() selector' },
            // Math functions
            { pattern: /\b(clamp|min|max)\s*\(/gi, feature: 'css-math-functions', name: 'CSS Math Functions' },
            // Aspect ratio
            { pattern: /aspect-ratio\s*:/gi, feature: 'css-aspect-ratio', name: 'aspect-ratio' },
            // Color functions
            { pattern: /color-mix\s*\(/gi, feature: 'css-color-mix', name: 'color-mix()' },
        ];

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            
            for (const { pattern, feature, name } of cssPatterns) {
                let match;
                pattern.lastIndex = 0; // Reset regex state
                
                while ((match = pattern.exec(line)) !== null) {
                    const range = new vscode.Range(
                        lineIndex,
                        match.index,
                        lineIndex,
                        match.index + match[0].length
                    );

                    features.push({
                        id: feature,
                        name,
                        type: 'css',
                        range,
                        baselineStatus: this.getMockBaselineStatus(feature),
                        severity: this.determineSeverity(feature),
                        context: `Fallback detection: ${match[0]}`
                    });
                }
            }
        }

        return features;
    }

    /**
     * Fallback JavaScript analysis using regex patterns
     */
    private fallbackJSAnalysis(content: string, document: vscode.TextDocument): DetectedFeature[] {
        const features: DetectedFeature[] = [];
        const lines = content.split('\n');

        // Common JavaScript patterns for modern features
        const jsPatterns = [
            // ES6+ features
            { pattern: /\b(const|let)\b/g, feature: 'es6-const-let', name: 'const/let declarations' },
            { pattern: /=>\s*{|=>\s*\w/g, feature: 'arrow-functions', name: 'Arrow Functions' },
            { pattern: /\bclass\s+\w+/g, feature: 'es6-class', name: 'ES6 Classes' },
            { pattern: /\basync\s+function|\basync\s*\(/g, feature: 'async-functions', name: 'Async Functions' },
            { pattern: /\bawait\b/g, feature: 'async-await', name: 'Async/Await' },
            { pattern: /\.\.\.\w+/g, feature: 'spread-operator', name: 'Spread Operator' },
            { pattern: /\bfor\s*\(\s*\w+\s+of\s+/g, feature: 'for-of-loop', name: 'for...of Loop' },
            
            // Web APIs
            { pattern: /\bfetch\s*\(/g, feature: 'fetch', name: 'Fetch API' },
            { pattern: /\bnew\s+Promise\s*\(/g, feature: 'promises', name: 'Promises' },
            { pattern: /\bnavigator\.serviceWorker/g, feature: 'service-workers', name: 'Service Workers' },
            { pattern: /\bIntersectionObserver\b/g, feature: 'intersection-observer', name: 'Intersection Observer' },
            { pattern: /\bResizeObserver\b/g, feature: 'resize-observer', name: 'Resize Observer' },
            { pattern: /\bMutationObserver\b/g, feature: 'mutation-observer', name: 'Mutation Observer' },
            { pattern: /\bWebSocket\b/g, feature: 'websockets', name: 'WebSockets' },
            { pattern: /\bgetUserMedia\b/g, feature: 'getusermedia', name: 'getUserMedia' },
            { pattern: /\bnotification\b/gi, feature: 'notifications', name: 'Notifications API' },
            { pattern: /\bgeolocation\b/gi, feature: 'geolocation', name: 'Geolocation API' },
        ];

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            
            for (const { pattern, feature, name } of jsPatterns) {
                let match;
                pattern.lastIndex = 0; // Reset regex state
                
                while ((match = pattern.exec(line)) !== null) {
                    const range = new vscode.Range(
                        lineIndex,
                        match.index,
                        lineIndex,
                        match.index + match[0].length
                    );

                    features.push({
                        id: feature,
                        name,
                        type: 'javascript',
                        range,
                        baselineStatus: this.getMockBaselineStatus(feature),
                        severity: this.determineSeverity(feature),
                        context: `Fallback detection: ${match[0]}`
                    });
                }
            }
        }

        return features;
    }

    /**
     * Fallback HTML analysis using regex patterns
     */
    private fallbackHTMLAnalysis(content: string, document: vscode.TextDocument): DetectedFeature[] {
        const features: DetectedFeature[] = [];
        const lines = content.split('\n');

        // Common HTML patterns for modern features
        const htmlPatterns = [
            // Modern HTML elements
            { pattern: /<(article|aside|details|figcaption|figure|footer|header|main|mark|nav|section|summary|time)\b/gi, feature: 'html5-semantic-elements', name: 'HTML5 Semantic Elements' },
            { pattern: /<(audio|video)\b/gi, feature: 'html5-media', name: 'HTML5 Media Elements' },
            { pattern: /<canvas\b/gi, feature: 'canvas', name: 'Canvas Element' },
            { pattern: /<svg\b/gi, feature: 'svg', name: 'SVG Element' },
            { pattern: /<dialog\b/gi, feature: 'dialog-element', name: 'Dialog Element' },
            { pattern: /<template\b/gi, feature: 'template-element', name: 'Template Element' },
            { pattern: /<slot\b/gi, feature: 'html-slot-element', name: 'Slot Element' },
            
            // Modern input types
            { pattern: /type\s*=\s*["'](email|url|tel|search|range|color|date|datetime-local|month|week|time|number)["']/gi, feature: 'html5-input-types', name: 'HTML5 Input Types' },
            
            // Modern attributes
            { pattern: /\bcontenteditable\b/gi, feature: 'contenteditable', name: 'contenteditable' },
            { pattern: /\bdraggable\b/gi, feature: 'drag-and-drop', name: 'Drag and Drop' },
            { pattern: /\bhidden\b/gi, feature: 'hidden-attribute', name: 'hidden attribute' },
            { pattern: /\bdata-[\w-]+/gi, feature: 'dataset-api', name: 'Data Attributes' },
            { pattern: /\brole\s*=/gi, feature: 'wai-aria', name: 'ARIA Roles' },
            { pattern: /\baria-[\w-]+/gi, feature: 'wai-aria', name: 'ARIA Attributes' },
        ];

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            
            for (const { pattern, feature, name } of htmlPatterns) {
                let match;
                pattern.lastIndex = 0; // Reset regex state
                
                while ((match = pattern.exec(line)) !== null) {
                    const range = new vscode.Range(
                        lineIndex,
                        match.index,
                        lineIndex,
                        match.index + match[0].length
                    );

                    features.push({
                        id: feature,
                        name,
                        type: 'html',
                        range,
                        baselineStatus: this.getMockBaselineStatus(feature),
                        severity: this.determineSeverity(feature),
                        context: `Fallback detection: ${match[0]}`
                    });
                }
            }
        }

        return features;
    }

    /**
     * Generic fallback analysis for unknown file types
     */
    private fallbackGenericAnalysis(content: string, document: vscode.TextDocument): DetectedFeature[] {
        const features: DetectedFeature[] = [];
        const lines = content.split('\n');

        // Very basic patterns that might indicate web features
        const genericPatterns = [
            { pattern: /\bfetch\s*\(/g, feature: 'fetch', name: 'Fetch API', type: 'javascript' as const },
            { pattern: /\basync\s*\/\s*await/g, feature: 'async-await', name: 'Async/Await', type: 'javascript' as const },
            { pattern: /display\s*:\s*grid/gi, feature: 'css-grid', name: 'CSS Grid', type: 'css' as const },
            { pattern: /display\s*:\s*flex/gi, feature: 'flexbox', name: 'Flexbox', type: 'css' as const },
        ];

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            
            for (const { pattern, feature, name, type } of genericPatterns) {
                let match;
                pattern.lastIndex = 0; // Reset regex state
                
                while ((match = pattern.exec(line)) !== null) {
                    const range = new vscode.Range(
                        lineIndex,
                        match.index,
                        lineIndex,
                        match.index + match[0].length
                    );

                    features.push({
                        id: feature,
                        name,
                        type,
                        range,
                        baselineStatus: this.getMockBaselineStatus(feature),
                        severity: this.determineSeverity(feature),
                        context: `Generic fallback detection: ${match[0]}`
                    });
                }
            }
        }

        return features;
    }

    /**
     * Get mock baseline status for fallback analysis
     */
    private getMockBaselineStatus(featureId: string): BaselineStatus {
        // Categorize features by likely support level
        const widelySupported = [
            'flexbox', 'css-transitions', 'css-transforms', 'html5-semantic-elements',
            'html5-media', 'canvas', 'svg', 'es6-const-let', 'arrow-functions',
            'promises', 'fetch', 'websockets'
        ];
        
        const newlySupported = [
            'css-grid', 'css-gap', 'css-aspect-ratio', 'async-functions', 'async-await',
            'intersection-observer', 'resize-observer', 'service-workers'
        ];

        const status = widelySupported.includes(featureId) 
            ? 'widely_available' 
            : newlySupported.includes(featureId)
            ? 'newly_available'
            : 'limited_availability';

        return {
            status,
            baseline_date: status === 'widely_available' ? '2020-01-01' : undefined,
            support: {
                chrome: { version_added: status === 'limited_availability' ? false : '80' },
                firefox: { version_added: status === 'limited_availability' ? false : '75' },
                safari: { version_added: status === 'limited_availability' ? false : '13.1' }
            }
        };
    }

    /**
     * Determine severity based on feature ID
     */
    private determineSeverity(featureId: string): 'error' | 'warning' | 'info' {
        const baselineStatus = this.getMockBaselineStatus(featureId);
        
        switch (baselineStatus.status) {
            case 'limited_availability':
                return 'error';
            case 'newly_available':
                return 'warning';
            case 'widely_available':
                return 'info';
            default:
                return 'warning';
        }
    }
}