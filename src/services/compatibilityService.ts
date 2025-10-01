import { BaselineStatus, WebFeature, WebFeatureDetails } from '../types';
import { ErrorHandler, ErrorContext } from '../core/errorHandler';
import features  from 'web-features';
import bcd from '@mdn/browser-compat-data';
// Remove compute-baseline for now - use direct BCD analysis

export class CompatibilityDataService {
    private webFeaturesData = features;
    private bcdCache: Map<string, BaselineStatus> = new Map();
    private isInitialized: boolean = false;
    private errorHandler: ErrorHandler;

    constructor() {
        this.errorHandler = ErrorHandler.getInstance();
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            console.log('Initializing real web-features data...');
            const featureCount = Object.keys(this.webFeaturesData).length;
            console.log(`Loaded ${featureCount} real web features`);
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize web-features:', error);
            this.errorHandler.handleDataLoadingError(error, {
                operation: 'web_features_initialization'
            });
        }
    }

    /**
     * Get BCD data by key path
     */
    getBCDData(bcdKey: string): any {
        const parts = bcdKey.split('.');
        let current: any = bcd;
        
        for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            } else {
                return null;
            }
        }
        
        return current && current.__compat ? current.__compat : null;
    }

    /**
     * Convert BCD data to our BaselineStatus format
     */
    private convertBCDToBaselineStatus(bcdData: any): BaselineStatus {
        if (!bcdData || !bcdData.support) {
            return {
                status: 'limited_availability',
                support: {}
            };
        }

        const support = bcdData.support;
        const majorBrowsers = ['chrome', 'firefox', 'safari', 'edge'];
        
        let recentVersionCount = 0;
        const supportData: any = {};
        const currentYear = new Date().getFullYear();
        
        for (const browser of majorBrowsers) {
            if (support[browser]) {
                const browserSupport = Array.isArray(support[browser]) ? support[browser][0] : support[browser];
                if (browserSupport.version_added && browserSupport.version_added !== false) {
                    supportData[browser] = { version_added: browserSupport.version_added };
                    
                    // Check if it's a recent version (last 3 years for modern features)
                    const version = parseInt(browserSupport.version_added);
                    if (browser === 'chrome' && version >= 88) recentVersionCount++; // Chrome 88+ (2021+)
                    else if (browser === 'firefox' && version >= 85) recentVersionCount++; // Firefox 85+ (2021+)
                    else if (browser === 'safari' && version >= 14) recentVersionCount++; // Safari 14+ (2020+)
                    else if (browser === 'edge' && version >= 88) recentVersionCount++; // Edge 88+ (2021+)
                }
            }
        }

        let status: 'widely_available' | 'newly_available' | 'limited_availability';
        const totalSupported = Object.keys(supportData).length;
        
        if (totalSupported >= 4 && recentVersionCount === 0) {
            status = 'widely_available'; // Old, stable features
        } else if (totalSupported >= 3 && recentVersionCount <= 2) {
            status = 'newly_available'; // Moderately new features
        } else {
            status = 'limited_availability'; // Very new or limited features
        }

        return {
            status,
            support: supportData
        };
    }

    /**
     * Convert web-features status to our BaselineStatus format
     */
    private convertWebFeatureStatus(status: any): BaselineStatus {
        if (!status) {
            return {
                status: 'limited_availability',
                support: {}
            };
        }

        let baselineStatus: 'widely_available' | 'newly_available' | 'limited_availability';
        
        if (status.baseline === 'high') {
            baselineStatus = 'widely_available';
        } else if (status.baseline === 'low') {
            baselineStatus = 'newly_available';
        } else {
            baselineStatus = 'limited_availability';
        }

        return {
            status: baselineStatus,
            baseline_date: status.baseline_low_date,
            low_date: status.baseline_low_date,
            high_date: status.baseline_high_date,
            support: status.support || {}
        };
    }

    getFeatureStatus(featureId: string): BaselineStatus | null {
        if (!this.isInitialized) {
            console.warn('CompatibilityDataService not initialized');
            return null;
        }

        // Check cache first
        if (this.bcdCache.has(featureId)) {
            return this.bcdCache.get(featureId)!;
        }

        try {
            // Use BCD data directly
            console.log(`Looking up feature ID: ${featureId}`);
            const feature = this.webFeaturesData[featureId];
            console.log(`Feature result for ${featureId}:`, feature);
            if (feature && feature.status) {
                const baselineStatus = this.convertWebFeatureStatus(feature.status);
                this.bcdCache.set(featureId, baselineStatus);
                return baselineStatus;
            }
        } catch (error) {
            console.log(`Feature lookup failed for ${featureId}:`, error);
        }

        return null;
    }

    searchFeatures(query: string): WebFeature[] {
        if (!this.isInitialized) {
            return [];
        }

        const results: WebFeature[] = [];
        const queryLower = query.toLowerCase();

        for (const [id, feature] of Object.entries(this.webFeaturesData)) {
            const featureData = feature as any;
            if (
                id.toLowerCase().includes(queryLower) ||
                featureData.name?.toLowerCase().includes(queryLower) ||
                (featureData.description && featureData.description.toLowerCase().includes(queryLower))
            ) {
                results.push({
                    id,
                    name: featureData.name || id,
                    description: featureData.description,
                    baseline: this.convertWebFeatureStatus(featureData.status)
                });
            }
        }

        return results;
    }

    getFeatureDetails(featureId: string): WebFeatureDetails | null {
        if (!this.isInitialized) {
            return null;
        }

        const feature = this.webFeaturesData[featureId] as any;
        if (!feature) {
            return null;
        }

        return {
            name: feature.name || featureId,
            description: feature.description || 'No description available',
            mdn_url: feature.mdn_url,
            spec_url: feature.spec,
            baseline: this.convertWebFeatureStatus(feature.status)
        };
    }

    /**
     * Map feature name to BCD key for CSS properties
     */
    mapCSSPropertyToBCD(property: string, value?: string): string {
        const baseKey = `css.properties.${property}`;
        
        // Try property with specific value first if provided
        if (value) {
            const valueKey = `${baseKey}.${value.replace(/-/g, '_')}`;
            // Check if this specific value exists in BCD
            if (this.getBCDData(valueKey)) {
                return valueKey;
            }
        }
        
        return baseKey;
    }

    getBCDStatus(bcdKey: string): BaselineStatus | null {
        if (!this.isInitialized) {
            return null;
        }

        if (this.bcdCache.has(bcdKey)) {
            return this.bcdCache.get(bcdKey)!;
        }

        try {
            const bcdData = this.getBCDData(bcdKey);
            if (bcdData) {
                const baselineStatus = this.convertBCDToBaselineStatus(bcdData);
                this.bcdCache.set(bcdKey, baselineStatus);
                return baselineStatus;
            }
        } catch (error) {
            // Silently fail for non-existent features
        }

        return null;
    }

    private convertComputeBaselineStatus(status: any): BaselineStatus {
        let baselineStatus: 'widely_available' | 'newly_available' | 'limited_availability';
        
        if (status.baseline === 'high') {
            baselineStatus = 'widely_available';
        } else if (status.baseline === 'low') {
            baselineStatus = 'newly_available';
        } else {
            baselineStatus = 'limited_availability';
        }

        return {
            status: baselineStatus,
            baseline_date: status.baseline_low_date,
            low_date: status.baseline_low_date,
            high_date: status.baseline_high_date,
            support: status.support || {}
        };
    }

    /**
     * Map feature name to BCD key for JavaScript APIs
     */
    mapJSAPIToBCD(apiName: string): string {
        // Try different possible BCD paths and return the first that exists
        const possibleKeys = [
            `api.${apiName}`,
            `javascript.builtins.${apiName}`,
            `api.Window.${apiName}`,
            `api.${apiName}.${apiName}` // For cases like fetch.fetch
        ];
        
        for (const key of possibleKeys) {
            if (this.getBCDData(key)) {
                return key;
            }
        }
        
        // Default to API namespace
        return `api.${apiName}`;
    }

    /**
     * Map feature name to BCD key for HTML elements
     */
    mapHTMLElementToBCD(element: string, attribute?: string): string {
        const baseKey = `html.elements.${element}`;
        
        if (attribute) {
            // Try different possible paths for the attribute
            const possibleKeys = [
                `${baseKey}.${attribute}`, // Element-specific attribute
                `html.global_attributes.${attribute}`, // Global attribute
                `${baseKey}.${attribute.replace(/-/g, '_')}` // With underscores
            ];
            
            for (const key of possibleKeys) {
                if (this.getBCDData(key)) {
                    return key;
                }
            }
            
            // Default to element-specific
            return `${baseKey}.${attribute}`;
        }
        
        return baseKey;
    }

    // Utility methods for cache management
    clearCache(): void {
        this.bcdCache.clear();
    }

    getCacheStats(): { bcdCache: number; totalFeatures: number } {
        return {
            bcdCache: this.bcdCache.size,
            totalFeatures: Object.keys(this.webFeaturesData).length
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
        
        for (const [id, feature] of Object.entries(this.webFeaturesData)) {
            const featureData = feature as any;
            features.push({
                name: featureData.name || id,
                description: featureData.description || featureData.name || id,
                mdn_url: featureData.mdn_url,
                spec_url: featureData.spec,
                baseline: this.convertWebFeatureStatus(featureData.status)
            });
        }

        return features.sort((a, b) => a.name.localeCompare(b.name));
    }
}