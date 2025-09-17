import * as vscode from 'vscode';
import { DetectedFeature, BaselineStatus } from '../types';
import { CompatibilityDataService } from './compatibilityService';

export interface FeatureSuggestion {
    feature: DetectedFeature;
    alternatives: Alternative[];
    polyfills: Polyfill[];
    educationalHints: string[];
    riskLevel: 'low' | 'medium' | 'high';
}

export interface Alternative {
    name: string;
    description: string;
    codeSnippet?: string;
    supportLevel: 'widely_available' | 'newly_available' | 'limited_availability';
    moreInfoUrl?: string;
}

export interface Polyfill {
    name: string;
    description: string;
    installCommand?: string;
    codeSnippet?: string;
    url?: string;
}

export class SuggestionEngine {
    private compatibilityService: CompatibilityDataService;
    private fallbackMappings: Map<string, Alternative[]> = new Map();
    private polyfillMappings: Map<string, Polyfill[]> = new Map();
    private educationalHints: Map<string, string[]> = new Map();

    constructor(compatibilityService: CompatibilityDataService) {
        this.compatibilityService = compatibilityService;
        this.initializeFallbackMappings();
        this.initializePolyfillMappings();
        this.initializeEducationalHints();
    }

    /**
     * Generate suggestions for a detected feature
     */
    generateSuggestions(feature: DetectedFeature): FeatureSuggestion {
        const riskLevel = this.calculateRiskLevel(feature.baselineStatus);
        const alternatives = this.getAlternatives(feature);
        const polyfills = this.getPolyfills(feature);
        const educationalHints = this.getEducationalHints(feature);

        return {
            feature,
            alternatives,
            polyfills,
            educationalHints,
            riskLevel
        };
    }

    /**
     * Get suggestions for multiple features
     */
    generateBulkSuggestions(features: DetectedFeature[]): FeatureSuggestion[] {
        return features
            .filter(feature => this.shouldProvideSuggestions(feature))
            .map(feature => this.generateSuggestions(feature));
    }

    /**
     * Calculate risk level based on baseline status
     */
    private calculateRiskLevel(baselineStatus: BaselineStatus): 'low' | 'medium' | 'high' {
        switch (baselineStatus.status) {
            case 'widely_available':
                return 'low';
            case 'newly_available':
                return 'medium';
            case 'limited_availability':
                return 'high';
            default:
                return 'high';
        }
    }

    /**
     * Check if suggestions should be provided for a feature
     */
    private shouldProvideSuggestions(feature: DetectedFeature): boolean {
        // Provide suggestions for newly available and limited availability features
        return feature.baselineStatus.status === 'newly_available' || 
               feature.baselineStatus.status === 'limited_availability';
    }

    /**
     * Get alternative implementations for a feature
     */
    private getAlternatives(feature: DetectedFeature): Alternative[] {
        const alternatives = this.fallbackMappings.get(feature.id) || [];
        
        // Add generic alternatives based on feature type
        const genericAlternatives = this.getGenericAlternatives(feature);
        
        return [...alternatives, ...genericAlternatives];
    }

    /**
     * Get polyfill suggestions for a feature
     */
    private getPolyfills(feature: DetectedFeature): Polyfill[] {
        return this.polyfillMappings.get(feature.id) || [];
    }

    /**
     * Get educational hints for a feature
     */
    private getEducationalHints(feature: DetectedFeature): string[] {
        const hints = this.educationalHints.get(feature.id) || [];
        
        // Add status-specific hints
        const statusHints = this.getStatusSpecificHints(feature.baselineStatus);
        
        return [...hints, ...statusHints];
    }

    /**
     * Get generic alternatives based on feature type
     */
    private getGenericAlternatives(feature: DetectedFeature): Alternative[] {
        const alternatives: Alternative[] = [];

        switch (feature.type) {
            case 'css':
                alternatives.push(...this.getGenericCSSAlternatives(feature));
                break;
            case 'javascript':
                alternatives.push(...this.getGenericJSAlternatives(feature));
                break;
            case 'html':
                alternatives.push(...this.getGenericHTMLAlternatives(feature));
                break;
        }

        return alternatives;
    }

    /**
     * Get generic CSS alternatives
     */
    private getGenericCSSAlternatives(feature: DetectedFeature): Alternative[] {
        const alternatives: Alternative[] = [];

        // Add progressive enhancement suggestion
        alternatives.push({
            name: 'Progressive Enhancement',
            description: 'Use feature detection and provide fallbacks',
            codeSnippet: `/* Fallback for older browsers */\n.element {\n  /* fallback styles */\n}\n\n/* Modern feature with @supports */\n@supports (${feature.context || feature.name}) {\n  .element {\n    /* modern styles */\n  }\n}`,
            supportLevel: 'widely_available',
            moreInfoUrl: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@supports'
        });

        return alternatives;
    }

    /**
     * Get generic JavaScript alternatives
     */
    private getGenericJSAlternatives(feature: DetectedFeature): Alternative[] {
        const alternatives: Alternative[] = [];

        // Add feature detection suggestion
        alternatives.push({
            name: 'Feature Detection',
            description: 'Check if the feature is available before using it',
            codeSnippet: `if ('${feature.name}' in window) {\n  // Use modern feature\n} else {\n  // Fallback implementation\n}`,
            supportLevel: 'widely_available'
        });

        return alternatives;
    }

    /**
     * Get generic HTML alternatives
     */
    private getGenericHTMLAlternatives(feature: DetectedFeature): Alternative[] {
        const alternatives: Alternative[] = [];

        // Add graceful degradation suggestion
        alternatives.push({
            name: 'Graceful Degradation',
            description: 'Provide fallback content for unsupported features',
            supportLevel: 'widely_available'
        });

        return alternatives;
    }

    /**
     * Get hints based on baseline status
     */
    private getStatusSpecificHints(baselineStatus: BaselineStatus): string[] {
        const hints: string[] = [];

        switch (baselineStatus.status) {
            case 'newly_available':
                hints.push('This feature is newly available across browsers. Consider providing fallbacks for older browser versions.');
                if (baselineStatus.baseline_date) {
                    hints.push(`This feature became baseline on ${baselineStatus.baseline_date}.`);
                }
                break;
            case 'limited_availability':
                hints.push('This feature has limited browser support. Consider using alternatives or polyfills.');
                hints.push('Test thoroughly across different browsers and versions.');
                break;
        }

        return hints;
    }

    /**
     * Initialize fallback mappings for specific features
     */
    private initializeFallbackMappings(): void {
        // CSS Grid fallbacks
        this.fallbackMappings.set('css-grid', [
            {
                name: 'Flexbox Layout',
                description: 'Use flexbox for simpler grid layouts',
                codeSnippet: `.container {\n  display: flex;\n  flex-wrap: wrap;\n}\n\n.item {\n  flex: 1 1 300px;\n}`,
                supportLevel: 'widely_available',
                moreInfoUrl: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Flexible_Box_Layout'
            },
            {
                name: 'Float-based Layout',
                description: 'Traditional float-based grid system',
                codeSnippet: `.container::after {\n  content: "";\n  display: table;\n  clear: both;\n}\n\n.item {\n  float: left;\n  width: 33.333%;\n}`,
                supportLevel: 'widely_available'
            }
        ]);

        // CSS Custom Properties fallbacks
        this.fallbackMappings.set('css-variables', [
            {
                name: 'Sass Variables',
                description: 'Use Sass/SCSS variables for compile-time substitution',
                codeSnippet: `$primary-color: #007bff;\n\n.element {\n  color: $primary-color;\n}`,
                supportLevel: 'widely_available',
                moreInfoUrl: 'https://sass-lang.com/documentation/variables'
            },
            {
                name: 'PostCSS Custom Properties',
                description: 'Use PostCSS plugin to compile custom properties',
                supportLevel: 'widely_available',
                moreInfoUrl: 'https://github.com/postcss/postcss-custom-properties'
            }
        ]);

        // Fetch API fallbacks
        this.fallbackMappings.set('fetch', [
            {
                name: 'XMLHttpRequest',
                description: 'Use traditional XMLHttpRequest for HTTP requests',
                codeSnippet: `function fetchData(url) {\n  return new Promise((resolve, reject) => {\n    const xhr = new XMLHttpRequest();\n    xhr.open('GET', url);\n    xhr.onload = () => resolve(xhr.response);\n    xhr.onerror = () => reject(xhr.statusText);\n    xhr.send();\n  });\n}`,
                supportLevel: 'widely_available'
            }
        ]);

        // ES6 Modules fallbacks
        this.fallbackMappings.set('es6-modules', [
            {
                name: 'CommonJS Modules',
                description: 'Use CommonJS for Node.js environments',
                codeSnippet: `// Instead of: import { func } from './module';\nconst { func } = require('./module');\n\n// Instead of: export default func;\nmodule.exports = func;`,
                supportLevel: 'widely_available'
            },
            {
                name: 'UMD Pattern',
                description: 'Universal Module Definition for broader compatibility',
                supportLevel: 'widely_available',
                moreInfoUrl: 'https://github.com/umdjs/umd'
            }
        ]);
    }

    /**
     * Initialize polyfill mappings for specific features
     */
    private initializePolyfillMappings(): void {
        // Fetch polyfill
        this.polyfillMappings.set('fetch', [
            {
                name: 'whatwg-fetch',
                description: 'A window.fetch JavaScript polyfill',
                installCommand: 'npm install whatwg-fetch',
                codeSnippet: `import 'whatwg-fetch';`,
                url: 'https://github.com/github/fetch'
            }
        ]);

        // Promise polyfill
        this.polyfillMappings.set('promise', [
            {
                name: 'es6-promise',
                description: 'A polyfill for ES6-style Promises',
                installCommand: 'npm install es6-promise',
                codeSnippet: `import 'es6-promise/auto';`,
                url: 'https://github.com/stefanpenner/es6-promise'
            }
        ]);

        // IntersectionObserver polyfill
        this.polyfillMappings.set('intersectionobserver', [
            {
                name: 'intersection-observer',
                description: 'IntersectionObserver polyfill',
                installCommand: 'npm install intersection-observer',
                codeSnippet: `import 'intersection-observer';`,
                url: 'https://github.com/w3c/IntersectionObserver'
            }
        ]);

        // CSS Grid polyfill
        this.polyfillMappings.set('css-grid', [
            {
                name: 'CSS Grid Polyfill',
                description: 'PostCSS plugin for CSS Grid Layout polyfill',
                installCommand: 'npm install postcss-grid-kiss',
                url: 'https://github.com/sylvainpolletvillard/postcss-grid-kiss'
            }
        ]);
    }

    /**
     * Initialize educational hints for specific features
     */
    private initializeEducationalHints(): void {
        this.educationalHints.set('css-grid', [
            'CSS Grid is a powerful layout system that allows you to create complex, responsive layouts with ease.',
            'Grid works well in combination with Flexbox - use Grid for 2D layouts and Flexbox for 1D layouts.',
            'Consider using grid-template-areas for more readable and maintainable grid layouts.'
        ]);

        this.educationalHints.set('css-variables', [
            'CSS Custom Properties (variables) allow you to store values that can be reused throughout your stylesheet.',
            'Unlike preprocessor variables, CSS variables are live and can be changed at runtime with JavaScript.',
            'Use CSS variables for theming and responsive design patterns.'
        ]);

        this.educationalHints.set('fetch', [
            'The Fetch API provides a modern, promise-based approach to making HTTP requests.',
            'Fetch returns promises, making it easier to handle asynchronous operations compared to XMLHttpRequest.',
            'Remember to handle both network errors and HTTP error status codes when using fetch.'
        ]);

        this.educationalHints.set('es6-modules', [
            'ES6 modules provide a standardized way to organize and share code between files.',
            'Modules are automatically in strict mode and have their own scope.',
            'Use named exports for utilities and default exports for main functionality.'
        ]);
    }
}