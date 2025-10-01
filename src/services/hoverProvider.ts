import * as vscode from 'vscode';
import { DetectedFeature, BaselineStatus, WebFeatureDetails } from '../types';
import { CompatibilityDataService } from './compatibilityService';

interface HoverCacheEntry {
    content: vscode.MarkdownString;
    timestamp: number;
}

export class HoverProvider implements vscode.HoverProvider {
    private compatibilityService: CompatibilityDataService;
    private hoverCache: Map<string, HoverCacheEntry> = new Map();
    private cacheTimeout: number = 5 * 60 * 1000; // 5 minutes
    private featureMap: Map<string, DetectedFeature[]> = new Map();

    constructor(compatibilityService: CompatibilityDataService) {
        this.compatibilityService = compatibilityService;
    }

    /**
     * Update the feature map for a document
     */
    updateFeatures(document: vscode.TextDocument, features: DetectedFeature[]): void {
        this.featureMap.set(document.uri.toString(), features);
    }

    /**
     * Clear features for a document
     */
    clearFeatures(document: vscode.TextDocument): void {
        this.featureMap.delete(document.uri.toString());
    }

    /**
     * Provide hover information for detected features
     */
    provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {
        const features = this.featureMap.get(document.uri.toString());
        if (!features || features.length === 0) {
            return null;
        }

        // Find feature at the current position
        const feature = this.findFeatureAtPosition(features, position);
        if (!feature) {
            return null;
        }

        // Check cache first
        const cacheKey = this.createCacheKey(feature);
        const cachedHover = this.getCachedHover(cacheKey);
        if (cachedHover) {
            return new vscode.Hover(cachedHover, feature.range);
        }

        // Generate hover content
        const hoverContent = this.createHoverContent(feature);

        // Cache the result
        this.cacheHover(cacheKey, hoverContent);

        // Emit command for walkthrough tracking
        Promise.resolve(vscode.commands.executeCommand('baseline-lens.showHover')).catch(() => {
            // Ignore errors - this is just for walkthrough tracking
        });

        return new vscode.Hover(hoverContent, feature.range);
    }

    /**
     * Find feature at the given position
     */
    private findFeatureAtPosition(features: DetectedFeature[], position: vscode.Position): DetectedFeature | null {
        for (const feature of features) {
            if (feature.range.contains(position)) {
                return feature;
            }
        }
        return null;
    }

    /**
     * Create comprehensive hover content for a feature
     */
    private createHoverContent(feature: DetectedFeature): vscode.MarkdownString {
        const markdown = new vscode.MarkdownString();
        markdown.isTrusted = true;
        markdown.supportHtml = true;

        // Header with feature name and status icon
        const statusIcon = this.getStatusIcon(feature.baselineStatus.status);
        const statusColor = this.getStatusColor(feature.baselineStatus.status);
        
        // Extract base feature name (e.g., 'transform' from 'transform:-sin45deg')
        const baseFeatureName = this.extractBaseFeatureName(feature.name);

        markdown.appendMarkdown(`### ${statusIcon} ${baseFeatureName}\n\n`);

        // Status badge
        const statusText = this.getStatusText(feature.baselineStatus.status);
        markdown.appendMarkdown(`<span style="background-color: ${statusColor}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 12px; font-weight: bold;">${statusText}</span>\n\n`);

        // Feature description
        const featureDetails = this.compatibilityService.getFeatureDetails(feature.id);
        if (featureDetails?.description) {
            markdown.appendMarkdown(`*${featureDetails.description}*\n\n`);
        }

        // Baseline information
        this.appendBaselineInfo(markdown, feature.baselineStatus);

        // Browser support breakdown
        this.appendBrowserSupport(markdown, feature.baselineStatus);

        // Context information
        if (feature.context) {
            markdown.appendMarkdown(`**Context:** \`${feature.context}\`\n\n`);
        }

        // Educational content based on status
        this.appendEducationalContent(markdown, feature);

        // Quick links section
        this.appendQuickLinks(markdown, feature, featureDetails);

        // Recommendations and alternatives
        this.appendRecommendations(markdown, feature);

        return markdown;
    }

    /**
     * Append baseline information to hover content
     */
    private appendBaselineInfo(markdown: vscode.MarkdownString, baseline: BaselineStatus): void {
        markdown.appendMarkdown(`#### 📊 Baseline Status\n\n`);

        const statusDescription = this.getDetailedStatusDescription(baseline.status);
        markdown.appendMarkdown(`${statusDescription}\n\n`);

        if (baseline.baseline_date) {
            markdown.appendMarkdown(`**Baseline Date:** ${baseline.baseline_date}\n`);
        }

        if (baseline.low_date) {
            markdown.appendMarkdown(`**Low Support Date:** ${baseline.low_date}\n`);
        }

        if (baseline.high_date) {
            markdown.appendMarkdown(`**High Support Date:** ${baseline.high_date}\n`);
        }

        markdown.appendMarkdown(`\n`);
    }

    /**
     * Append browser support breakdown
     */
    private appendBrowserSupport(markdown: vscode.MarkdownString, baseline: BaselineStatus): void {
        if (!baseline.support || Object.keys(baseline.support).length === 0) {
            return;
        }

        markdown.appendMarkdown(`#### 🌐 Browser Support\n\n`);
        markdown.appendMarkdown(`| Browser | Version | Notes |\n`);
        markdown.appendMarkdown(`|---------|---------|-------|\n`);

        // Sort browsers for consistent display
        const sortedBrowsers = Object.entries(baseline.support).sort(([a], [b]) => {
            const browserOrder = ['chrome', 'firefox', 'safari', 'edge', 'ie', 'opera'];
            const aIndex = browserOrder.indexOf(a.toLowerCase());
            const bIndex = browserOrder.indexOf(b.toLowerCase());
            if (aIndex !== -1 && bIndex !== -1) {
                return aIndex - bIndex;
            }
            return a.localeCompare(b);
        });

        for (const [browser, support] of sortedBrowsers) {
            const browserName = this.formatBrowserName(browser);
            const version = this.formatVersion(support.version_added);
            const notes = support.notes || '';
            const browserIcon = this.getBrowserIcon(browser);

            markdown.appendMarkdown(`| ${browserIcon} ${browserName} | ${version} | ${notes} |\n`);
        }

        markdown.appendMarkdown(`\n`);
    }

    /**
     * Append educational content based on feature status
     */
    private appendEducationalContent(markdown: vscode.MarkdownString, feature: DetectedFeature): void {
        markdown.appendMarkdown(`#### 💡 What This Means\n\n`);

        switch (feature.baselineStatus.status) {
            case 'widely_available':
                markdown.appendMarkdown(`✅ **Safe to use** - This feature has wide browser support and is considered stable for production use.\n\n`);
                break;
            case 'newly_available':
                markdown.appendMarkdown(`⚠️ **Use with caution** - This feature is newly available across browsers. Consider providing fallbacks for older browser versions.\n\n`);
                break;
            case 'limited_availability':
                markdown.appendMarkdown(`🚫 **Limited support** - This feature has limited browser support. Consider alternatives or polyfills for broader compatibility.\n\n`);
                break;
        }
    }

    /**
     * Append quick links section
     */
    private appendQuickLinks(markdown: vscode.MarkdownString, feature: DetectedFeature, details: WebFeatureDetails | null): void {
        markdown.appendMarkdown(`#### 🔗 Quick Links\n\n`);

        const links: string[] = [];
        const baseFeatureName = this.extractBaseFeatureName(feature.name);

        // MDN documentation
        if (details?.mdn_url) {
            links.push(`[📚 MDN Documentation](${details.mdn_url})`);
        }

        // Specification
        if (details?.spec_url) {
            links.push(`[📋 Specification](${details.spec_url})`);
        }

        // Can I Use - use base feature name
        const canIUseUrl = this.generateCanIUseUrl(baseFeatureName);
        if (canIUseUrl) {
            links.push(`[📈 Can I Use](${canIUseUrl})`);
        }

        // Polyfill suggestions
        const polyfillUrl = this.generatePolyfillUrl(feature);
        if (polyfillUrl) {
            links.push(`[🔧 Polyfills](${polyfillUrl})`);
        }

        if (links.length > 0) {
            markdown.appendMarkdown(links.join(' • ') + '\n\n');
        } else {
            markdown.appendMarkdown(`*No additional resources available*\n\n`);
        }
    }

    /**
     * Append recommendations and alternatives
     */
    private appendRecommendations(markdown: vscode.MarkdownString, feature: DetectedFeature): void {
        const recommendations = this.getRecommendations(feature);
        if (recommendations.length === 0) {
            return;
        }

        markdown.appendMarkdown(`#### 💭 Recommendations\n\n`);

        for (const recommendation of recommendations) {
            markdown.appendMarkdown(`• ${recommendation}\n`);
        }

        markdown.appendMarkdown(`\n`);
    }

    /**
     * Get recommendations based on feature status and type
     */
    private getRecommendations(feature: DetectedFeature): string[] {
        const recommendations: string[] = [];

        switch (feature.baselineStatus.status) {
            case 'newly_available':
                recommendations.push('Consider providing fallbacks for older browsers');
                recommendations.push('Test thoroughly across different browser versions');
                if (feature.type === 'css') {
                    recommendations.push('Use feature queries (@supports) to provide fallbacks');
                }
                break;
            case 'limited_availability':
                recommendations.push('Consider using a polyfill or alternative approach');
                recommendations.push('Implement progressive enhancement');
                if (feature.type === 'javascript') {
                    recommendations.push('Check for feature support before using');
                }
                break;
        }

        // Type-specific recommendations
        if (feature.type === 'css') {
            recommendations.push('Validate your CSS with vendor prefixes if needed');
        } else if (feature.type === 'javascript') {
            recommendations.push('Consider using a transpiler like Babel for broader support');
        }

        return recommendations;
    }

    /**
     * Generate Can I Use URL for a feature
     */
    private generateCanIUseUrl(featureName: string): string | null {
        // Convert feature name to Can I Use format
        const searchTerm = featureName.toLowerCase().replace(/\s+/g, '-');
        return `https://caniuse.com/?search=${encodeURIComponent(searchTerm)}`;
    }

    /**
     * Generate polyfill URL based on feature type
     */
    private generatePolyfillUrl(feature: DetectedFeature): string | null {
        switch (feature.type) {
            case 'javascript':
                return 'https://polyfill.io/';
            case 'css':
                return 'https://github.com/postcss/autoprefixer';
            default:
                return null;
        }
    }

    /**
     * Format browser name for display
     */
    private formatBrowserName(browser: string): string {
        const browserNames: { [key: string]: string } = {
            'chrome': 'Chrome',
            'firefox': 'Firefox',
            'safari': 'Safari',
            'edge': 'Edge',
            'ie': 'Internet Explorer',
            'opera': 'Opera',
            'chrome_android': 'Chrome Android',
            'firefox_android': 'Firefox Android',
            'safari_ios': 'Safari iOS',
            'samsung_android': 'Samsung Internet'
        };

        return browserNames[browser.toLowerCase()] || browser;
    }

    /**
     * Format version information
     */
    private formatVersion(version: string | boolean): string {
        if (version === true) {
            return '✅ Yes';
        } else if (version === false) {
            return '❌ No';
        } else if (typeof version === 'string') {
            return version;
        }
        return 'Unknown';
    }

    /**
     * Get browser icon based on browser name
     */
    private getBrowserIcon(browser: string): string {
        const browserIcons: { [key: string]: string } = {
            'chrome': '🟡', // Chrome yellow
            'firefox': '🟠', // Firefox orange
            'safari': '🔵', // Safari blue
            'edge': '🟢', // Edge green
            'ie': '🔷', // IE blue diamond
            'opera': '🔴', // Opera red
            'chrome_android': '🟡',
            'firefox_android': '🟠',
            'safari_ios': '🔵',
            'samsung_android': '🟣'
        };
        return browserIcons[browser.toLowerCase()] || '⚪';
    }

    /**
     * Get status icon for baseline status
     */
    private getStatusIcon(status: string): string {
        switch (status) {
            case 'widely_available':
                return '✅';
            case 'newly_available':
                return '⚠️';
            case 'limited_availability':
                return '⚠️'; // Use warning icon instead of prohibited
            default:
                return '❓';
        }
    }

    /**
     * Get status color for styling
     */
    private getStatusColor(status: string): string {
        switch (status) {
            case 'widely_available':
                return '#22c55e';
            case 'newly_available':
                return '#eab308'; // Yellow for warnings
            case 'limited_availability':
                return '#eab308'; // Yellow for limited support
            default:
                return '#6b7280';
        }
    }

    /**
     * Get status text for display
     */
    private getStatusText(status: string): string {
        switch (status) {
            case 'widely_available':
                return 'WIDELY AVAILABLE';
            case 'newly_available':
                return 'NEWLY AVAILABLE';
            case 'limited_availability':
                return 'LIMITED AVAILABILITY';
            default:
                return 'UNKNOWN STATUS';
        }
    }

    /**
     * Get detailed status description
     */
    private getDetailedStatusDescription(status: string): string {
        switch (status) {
            case 'widely_available':
                return 'This feature is **widely available** across browsers and is safe to use in production.';
            case 'newly_available':
                return 'This feature is **newly available** across browsers. While supported in modern browsers, consider fallbacks for older versions.';
            case 'limited_availability':
                return 'This feature has **limited availability** and may not work in all browsers. Consider alternatives or polyfills.';
            default:
                return 'The availability status of this feature is unknown.';
        }
    }

    /**
     * Create cache key for a feature
     */
    private createCacheKey(feature: DetectedFeature): string {
        return `${feature.id}:${feature.baselineStatus.status}:${feature.baselineStatus.baseline_date || 'no-date'}`;
    }

    /**
     * Get cached hover content if available and not expired
     */
    private getCachedHover(cacheKey: string): vscode.MarkdownString | null {
        const cached = this.hoverCache.get(cacheKey);
        if (!cached) {
            return null;
        }

        // Check if cache entry has expired
        if (Date.now() - cached.timestamp > this.cacheTimeout) {
            this.hoverCache.delete(cacheKey);
            return null;
        }

        return cached.content;
    }

    /**
     * Cache hover content
     */
    private cacheHover(cacheKey: string, content: vscode.MarkdownString): void {
        this.hoverCache.set(cacheKey, {
            content,
            timestamp: Date.now()
        });

        // Clean up expired entries periodically
        if (this.hoverCache.size > 100) {
            this.cleanupExpiredCache();
        }
    }

    /**
     * Clean up expired cache entries
     */
    private cleanupExpiredCache(): void {
        const now = Date.now();
        for (const [key, entry] of this.hoverCache.entries()) {
            if (now - entry.timestamp > this.cacheTimeout) {
                this.hoverCache.delete(key);
            }
        }
    }

    /**
     * Clear all cached hover content
     */
    clearCache(): void {
        this.hoverCache.clear();
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): { size: number; timeout: number } {
        return {
            size: this.hoverCache.size,
            timeout: this.cacheTimeout
        };
    }

    /**
     * Extract base feature name from complex feature names
     */
    private extractBaseFeatureName(featureName: string): string {
        // Remove specific values and keep only the base property/API name
        // Examples: 'transform:-sin45deg' -> 'transform', 'grid-template-columns: subgrid' -> 'grid-template-columns'
        return featureName.split(':')[0].trim();
    }

    /**
     * Dispose of resources
     */
    dispose(): void {
        this.hoverCache.clear();
        this.featureMap.clear();
    }
}