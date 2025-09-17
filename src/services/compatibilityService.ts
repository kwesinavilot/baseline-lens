import { BaselineStatus, WebFeature, WebFeatureDetails } from '../types';

export class CompatibilityDataService {
    private webFeaturesData: Map<string, WebFeature> = new Map();
    private featureCache: Map<string, BaselineStatus> = new Map();
    private searchCache: Map<string, WebFeature[]> = new Map();
    private isInitialized: boolean = false;

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            console.log('Initializing compatibility data service...');
            
            // Load web-features dataset
            const webFeatures = await import('web-features');
            const features = webFeatures.default || webFeatures;
            
            // Process and cache the features data
            this.processWebFeaturesData(features);
            
            this.isInitialized = true;
            console.log(`Loaded ${this.webFeaturesData.size} web features`);
        } catch (error) {
            console.error('Failed to initialize compatibility data:', error);
            throw new Error(`Failed to load web-features dataset: ${error}`);
        }
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
}