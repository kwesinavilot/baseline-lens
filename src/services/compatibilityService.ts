import { BaselineStatus, WebFeature, WebFeatureDetails } from '../types';
import { ErrorHandler, ErrorContext } from '../core/errorHandler';

export class CompatibilityDataService {
    private webFeaturesData: Map<string, WebFeature> = new Map();
    private featureCache: Map<string, BaselineStatus> = new Map();
    private searchCache: Map<string, WebFeature[]> = new Map();
    private isInitialized: boolean = false;
    private fallbackMode: boolean = false;
    private errorHandler: ErrorHandler;
    private initializationAttempts: number = 0;
    private maxInitializationAttempts: number = 3;

    constructor() {
        this.errorHandler = ErrorHandler.getInstance();
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        this.initializationAttempts++;
        const context: ErrorContext = {
            operation: 'data_initialization',
            additionalInfo: { attempt: this.initializationAttempts }
        };

        try {
            console.log(`Initializing compatibility data service (attempt ${this.initializationAttempts})...`);
            
            // Load web-features dataset with timeout protection
            const webFeatures = await this.loadWebFeaturesWithTimeout();
            const features = webFeatures.default || webFeatures;
            
            // Process and cache the features data
            this.processWebFeaturesData(features);
            
            this.isInitialized = true;
            this.fallbackMode = false;
            console.log(`Loaded ${this.webFeaturesData.size} web features`);
            
        } catch (error) {
            console.error('Failed to initialize compatibility data:', error);
            this.errorHandler.handleDataLoadingError(error, context);
            
            // Try fallback initialization
            await this.initializeFallbackMode();
        }
    }

    /**
     * Load web-features with timeout protection
     */
    private async loadWebFeaturesWithTimeout(): Promise<any> {
        return new Promise(async (resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Web-features loading timeout'));
            }, 10000); // 10 second timeout

            try {
                const webFeatures = await import('web-features');
                clearTimeout(timeout);
                resolve(webFeatures);
            } catch (error) {
                clearTimeout(timeout);
                reject(error);
            }
        });
    }

    /**
     * Initialize fallback mode with minimal feature set
     */
    private async initializeFallbackMode(): Promise<void> {
        console.log('Initializing fallback compatibility data...');
        
        try {
            // Load minimal fallback dataset
            this.loadFallbackFeatures();
            this.isInitialized = true;
            this.fallbackMode = true;
            
            console.log(`Fallback mode initialized with ${this.webFeaturesData.size} basic features`);
            
            // Schedule retry if we haven't exceeded max attempts
            if (this.initializationAttempts < this.maxInitializationAttempts) {
                setTimeout(() => {
                    this.retryInitialization();
                }, 30000); // Retry after 30 seconds
            }
            
        } catch (fallbackError) {
            const context: ErrorContext = {
                operation: 'fallback_initialization',
                additionalInfo: { originalAttempts: this.initializationAttempts }
            };
            this.errorHandler.handleDataLoadingError(fallbackError, context);
            
            // Even fallback failed, but we'll still mark as initialized with empty data
            this.isInitialized = true;
            this.fallbackMode = true;
        }
    }

    /**
     * Retry full initialization in background
     */
    private async retryInitialization(): Promise<void> {
        if (!this.fallbackMode) {
            return; // Already successfully initialized
        }

        console.log('Retrying full compatibility data initialization...');
        this.isInitialized = false;
        
        try {
            await this.initialize();
            if (!this.fallbackMode) {
                console.log('Successfully upgraded from fallback to full compatibility data');
            }
        } catch (error) {
            console.log('Retry initialization failed, continuing with fallback mode');
        }
    }

    /**
     * Load minimal fallback feature set
     */
    private loadFallbackFeatures(): void {
        const fallbackFeatures: Array<{ id: string; name: string; status: 'widely_available' | 'newly_available' | 'limited_availability' }> = [
            // CSS Features
            { id: 'flexbox', name: 'Flexbox', status: 'widely_available' },
            { id: 'css-grid', name: 'CSS Grid', status: 'newly_available' },
            { id: 'css-variables', name: 'CSS Custom Properties', status: 'widely_available' },
            { id: 'css-calc', name: 'CSS calc()', status: 'widely_available' },
            { id: 'css-transitions', name: 'CSS Transitions', status: 'widely_available' },
            { id: 'css-transforms', name: 'CSS Transforms', status: 'widely_available' },
            { id: 'css-animation', name: 'CSS Animations', status: 'widely_available' },
            { id: 'css-gradients', name: 'CSS Gradients', status: 'widely_available' },
            { id: 'css-container-queries', name: 'Container Queries', status: 'limited_availability' },
            { id: 'css-has', name: ':has() selector', status: 'limited_availability' },
            { id: 'css-aspect-ratio', name: 'aspect-ratio', status: 'newly_available' },
            
            // JavaScript Features
            { id: 'es6-const-let', name: 'const/let', status: 'widely_available' },
            { id: 'arrow-functions', name: 'Arrow Functions', status: 'widely_available' },
            { id: 'es6-class', name: 'ES6 Classes', status: 'widely_available' },
            { id: 'promises', name: 'Promises', status: 'widely_available' },
            { id: 'async-await', name: 'Async/Await', status: 'widely_available' },
            { id: 'fetch', name: 'Fetch API', status: 'widely_available' },
            { id: 'service-workers', name: 'Service Workers', status: 'newly_available' },
            { id: 'intersection-observer', name: 'Intersection Observer', status: 'newly_available' },
            { id: 'resize-observer', name: 'Resize Observer', status: 'newly_available' },
            { id: 'websockets', name: 'WebSockets', status: 'widely_available' },
            
            // HTML Features
            { id: 'html5-semantic-elements', name: 'HTML5 Semantic Elements', status: 'widely_available' },
            { id: 'html5-media', name: 'HTML5 Media Elements', status: 'widely_available' },
            { id: 'canvas', name: 'Canvas', status: 'widely_available' },
            { id: 'svg', name: 'SVG', status: 'widely_available' },
            { id: 'dialog-element', name: 'Dialog Element', status: 'limited_availability' },
            { id: 'html5-input-types', name: 'HTML5 Input Types', status: 'widely_available' },
            { id: 'contenteditable', name: 'contenteditable', status: 'widely_available' },
            { id: 'drag-and-drop', name: 'Drag and Drop', status: 'widely_available' },
        ];

        this.webFeaturesData.clear();
        this.featureCache.clear();
        this.searchCache.clear();

        for (const { id, name, status } of fallbackFeatures) {
            const webFeature: WebFeature = {
                id,
                name,
                description: `Fallback data for ${name}`,
                baseline: this.createFallbackBaselineStatus(status)
            };

            this.webFeaturesData.set(id, webFeature);
        }
    }

    /**
     * Create fallback baseline status
     */
    private createFallbackBaselineStatus(status: 'widely_available' | 'newly_available' | 'limited_availability'): BaselineStatus {
        const support: { [browser: string]: { version_added: string | boolean } } = {};
        
        switch (status) {
            case 'widely_available':
                support.chrome = { version_added: '60' };
                support.firefox = { version_added: '55' };
                support.safari = { version_added: '12' };
                support.edge = { version_added: '79' };
                break;
            case 'newly_available':
                support.chrome = { version_added: '80' };
                support.firefox = { version_added: '75' };
                support.safari = { version_added: '13.1' };
                support.edge = { version_added: '80' };
                break;
            case 'limited_availability':
                support.chrome = { version_added: '90' };
                support.firefox = { version_added: false };
                support.safari = { version_added: false };
                support.edge = { version_added: '90' };
                break;
        }

        return {
            status,
            baseline_date: status === 'widely_available' ? '2020-01-01' : undefined,
            support
        };
    }

    private processWebFeaturesData(features: any): void {
        // Clear existing data
        this.webFeaturesData.clear();
        this.featureCache.clear();
        this.searchCache.clear();

        // Process each feature in the dataset
        for (const [featureId, featureData] of Object.entries(features)) {
            if (typeof featureData === 'object' && featureData !== null) {
                const webFeature: WebFeature = {
                    id: featureId,
                    name: (featureData as any).name || featureId,
                    description: (featureData as any).description,
                    mdn_url: (featureData as any).mdn_url,
                    spec_url: (featureData as any).spec_url,
                    status: (featureData as any).status,
                    compat_features: (featureData as any).compat_features
                };

                // Convert status to BaselineStatus format
                if (webFeature.status) {
                    webFeature.baseline = this.convertToBaselineStatus(webFeature.status);
                }

                this.webFeaturesData.set(featureId, webFeature);
            }
        }
    }

    private convertToBaselineStatus(status: any): BaselineStatus {
        const baselineStatus: BaselineStatus = {
            status: 'limited_availability', // default
            support: {}
        };

        if (status.baseline_status) {
            switch (status.baseline_status) {
                case 'high':
                    baselineStatus.status = 'widely_available';
                    break;
                case 'low':
                    baselineStatus.status = 'newly_available';
                    break;
                default:
                    baselineStatus.status = 'limited_availability';
            }
        }

        if (status.baseline_low_date) {
            baselineStatus.baseline_date = status.baseline_low_date;
            baselineStatus.low_date = status.baseline_low_date;
        }

        if (status.baseline_high_date) {
            baselineStatus.high_date = status.baseline_high_date;
        }

        if (status.support) {
            baselineStatus.support = status.support;
        }

        return baselineStatus;
    }

    getFeatureStatus(featureId: string): BaselineStatus | null {
        if (!this.isInitialized) {
            console.warn('CompatibilityDataService not initialized');
            return null;
        }

        // Check cache first
        if (this.featureCache.has(featureId)) {
            return this.featureCache.get(featureId)!;
        }

        // Look up feature
        const feature = this.webFeaturesData.get(featureId);
        if (feature && feature.baseline) {
            this.featureCache.set(featureId, feature.baseline);
            return feature.baseline;
        }

        // Try fuzzy matching for similar feature names
        const similarFeature = this.findSimilarFeature(featureId);
        if (similarFeature && similarFeature.baseline) {
            this.featureCache.set(featureId, similarFeature.baseline);
            return similarFeature.baseline;
        }

        return null;
    }

    searchFeatures(query: string): WebFeature[] {
        if (!this.isInitialized) {
            console.warn('CompatibilityDataService not initialized');
            return [];
        }

        // Check cache first
        const cacheKey = query.toLowerCase();
        if (this.searchCache.has(cacheKey)) {
            return this.searchCache.get(cacheKey)!;
        }

        const results: WebFeature[] = [];
        const queryLower = query.toLowerCase();

        for (const feature of this.webFeaturesData.values()) {
            // Match by ID, name, or description
            if (
                feature.id.toLowerCase().includes(queryLower) ||
                feature.name.toLowerCase().includes(queryLower) ||
                (feature.description && feature.description.toLowerCase().includes(queryLower))
            ) {
                results.push(feature);
            }
        }

        // Cache results
        this.searchCache.set(cacheKey, results);
        return results;
    }

    getFeatureDetails(featureId: string): WebFeatureDetails | null {
        if (!this.isInitialized) {
            console.warn('CompatibilityDataService not initialized');
            return null;
        }

        const feature = this.webFeaturesData.get(featureId);
        if (!feature) {
            return null;
        }

        return {
            name: feature.name,
            description: feature.description || 'No description available',
            mdn_url: feature.mdn_url,
            spec_url: feature.spec_url,
            baseline: feature.baseline || {
                status: 'limited_availability',
                support: {}
            }
        };
    }

    private findSimilarFeature(featureId: string): WebFeature | null {
        const queryLower = featureId.toLowerCase();
        
        // Try exact match first
        for (const [id, feature] of this.webFeaturesData.entries()) {
            if (id.toLowerCase() === queryLower) {
                return feature;
            }
        }

        // Try partial matches
        for (const [id, feature] of this.webFeaturesData.entries()) {
            if (id.toLowerCase().includes(queryLower) || queryLower.includes(id.toLowerCase())) {
                return feature;
            }
        }

        return null;
    }

    // Utility methods for cache management
    clearCache(): void {
        this.featureCache.clear();
        this.searchCache.clear();
    }

    getCacheStats(): { featureCache: number; searchCache: number; totalFeatures: number } {
        return {
            featureCache: this.featureCache.size,
            searchCache: this.searchCache.size,
            totalFeatures: this.webFeaturesData.size
        };
    }

    isReady(): boolean {
        return this.isInitialized;
    }

    /**
     * Get all available web features
     */
    async getAllFeatures(): Promise<WebFeatureDetails[]> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const features: WebFeatureDetails[] = [];
        
        for (const [id, webFeature] of this.webFeaturesData) {
            if (webFeature.baseline) {
                features.push({
                    name: webFeature.name,
                    description: webFeature.description || webFeature.name,
                    mdn_url: webFeature.mdn_url,
                    spec_url: webFeature.spec_url,
                    baseline: webFeature.baseline
                });
            }
        }

        return features.sort((a, b) => a.name.localeCompare(b.name));
    }
}