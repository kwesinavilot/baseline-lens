import * as vscode from 'vscode';
import * as path from 'path';
import { 
    CompatibilityReport, 
    ReportSummary, 
    FeatureUsage, 
    FileLocation, 
    DetectedFeature, 
    WebFeatureDetails,
    ProjectAnalysisResult 
} from '../types';
import { AnalysisEngine } from '../core/analysisEngine';
import { CompatibilityDataService } from './compatibilityService';

export class ReportGenerator {
    private analysisEngine: AnalysisEngine;
    private compatibilityService: CompatibilityDataService;

    constructor(analysisEngine: AnalysisEngine, compatibilityService: CompatibilityDataService) {
        this.analysisEngine = analysisEngine;
        this.compatibilityService = compatibilityService;
    }

    /**
     * Generate a comprehensive compatibility report for the entire project
     */
    async generateProjectReport(progressCallback?: (progress: number, message: string) => void): Promise<CompatibilityReport> {
        try {
            progressCallback?.(0, 'Starting project analysis...');
            
            // Perform project-wide analysis
            const projectResult = await this.analysisEngine.analyzeProject();
            
            progressCallback?.(50, 'Processing analysis results...');
            
            // Process features and create detailed usage information
            const featureUsageMap = this.processFeatures(projectResult.features);
            const features = Array.from(featureUsageMap.values());
            
            progressCallback?.(75, 'Generating summary and recommendations...');
            
            // Generate summary statistics
            const summary = this.generateReportSummary(projectResult, features);
            
            // Generate recommendations based on analysis
            const recommendations = this.generateRecommendations(features, summary);
            
            progressCallback?.(90, 'Finalizing report...');
            
            const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
            
            const report: CompatibilityReport = {
                summary,
                features,
                recommendations,
                generatedAt: new Date(),
                projectPath: workspacePath,
                totalFiles: projectResult.totalFiles,
                analyzedFiles: projectResult.analyzedFiles,
                errors: projectResult.errors
            };
            
            progressCallback?.(100, 'Report generation complete!');
            
            return report;
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to generate project report: ${errorMessage}`);
        }
    }

    /**
     * Export report in the specified format
     */
    exportReport(report: CompatibilityReport, format: 'json' | 'markdown'): string {
        switch (format) {
            case 'json':
                return this.exportAsJSON(report);
            case 'markdown':
                return this.exportAsMarkdown(report);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    /**
     * Process detected features into usage information
     */
    private processFeatures(detectedFeatures: DetectedFeature[]): Map<string, FeatureUsage> {
        const featureUsageMap = new Map<string, FeatureUsage>();

        for (const feature of detectedFeatures) {
            const featureId = feature.id;
            
            if (!featureUsageMap.has(featureId)) {
                let featureDetails = this.compatibilityService.getFeatureDetails(featureId);
                
                // If no details found, create basic details from the feature itself
                if (!featureDetails) {
                    featureDetails = {
                        name: feature.name,
                        description: feature.context || `${feature.type} feature (compatibility data may be incomplete)`,
                        mdn_url: undefined,
                        spec_url: undefined,
                        baseline: feature.baselineStatus
                    };
                }

                featureUsageMap.set(featureId, {
                    feature: featureDetails,
                    locations: [],
                    riskLevel: this.calculateRiskLevel(feature.baselineStatus.status),
                    usageCount: 0
                });
            }

            const usage = featureUsageMap.get(featureId)!;
            usage.locations.push({
                filePath: feature.filePath || 'unknown',
                line: feature.range.start.line + 1, // Convert to 1-based
                column: feature.range.start.character + 1, // Convert to 1-based
                context: feature.context
            });
            usage.usageCount++;
        }

        return featureUsageMap;
    }

    /**
     * Calculate risk level based on baseline status
     */
    private calculateRiskLevel(status: string): 'low' | 'medium' | 'high' {
        switch (status) {
            case 'widely_available':
                return 'low';
            case 'newly_available':
                return 'medium';
            case 'limited_availability':
                return 'high';
            default:
                return 'medium';
        }
    }

    /**
     * Generate comprehensive report summary
     */
    private generateReportSummary(projectResult: ProjectAnalysisResult, features: FeatureUsage[]): ReportSummary {
        const riskDistribution = {
            low: 0,
            medium: 0,
            high: 0
        };

        const fileTypeBreakdown: { [fileType: string]: number } = {};
        
        // Calculate status counts from actual detected features
        let widelyAvailable = 0;
        let newlyAvailable = 0;
        let limitedAvailability = 0;

        // Calculate risk distribution and status counts
        for (const feature of features) {
            riskDistribution[feature.riskLevel]++;
            
            // Count by baseline status
            switch (feature.riskLevel) {
                case 'low':
                    widelyAvailable++;
                    break;
                case 'medium':
                    newlyAvailable++;
                    break;
                case 'high':
                    limitedAvailability++;
                    break;
            }
        }

        // Calculate file type breakdown
        for (const feature of projectResult.features) {
            const fileType = feature.type;
            fileTypeBreakdown[fileType] = (fileTypeBreakdown[fileType] || 0) + 1;
        }

        return {
            totalFeatures: features.length,
            widelyAvailable,
            newlyAvailable,
            limitedAvailability,
            riskDistribution,
            fileTypeBreakdown
        };
    }

    /**
     * Generate recommendations based on analysis results
     */
    private generateRecommendations(features: FeatureUsage[], summary: ReportSummary): string[] {
        const recommendations: string[] = [];

        // High-risk features recommendations
        const highRiskFeatures = features.filter(f => f.riskLevel === 'high');
        if (highRiskFeatures.length > 0) {
            recommendations.push(
                `⚠️ Found ${highRiskFeatures.length} high-risk features with limited browser support. Consider providing fallbacks or polyfills.`
            );
            
            // List top 3 most used high-risk features
            const topHighRisk = highRiskFeatures
                .sort((a, b) => b.usageCount - a.usageCount)
                .slice(0, 3);
            
            for (const feature of topHighRisk) {
                recommendations.push(
                    `   • ${feature.feature.name} (used ${feature.usageCount} times) - Consider alternatives or polyfills`
                );
            }
        }

        // Medium-risk features recommendations
        const mediumRiskFeatures = features.filter(f => f.riskLevel === 'medium');
        if (mediumRiskFeatures.length > 0) {
            recommendations.push(
                `📋 Found ${mediumRiskFeatures.length} newly available features. Monitor browser support and consider progressive enhancement.`
            );
        }

        // Overall project health
        const riskScore = (summary.riskDistribution.high * 3 + summary.riskDistribution.medium * 1) / summary.totalFeatures;
        if (riskScore > 0.3) {
            recommendations.push(
                '🔍 High overall risk score detected. Consider implementing a comprehensive browser testing strategy.'
            );
        } else if (riskScore > 0.1) {
            recommendations.push(
                '✅ Moderate risk level. Continue monitoring newly available features for broader support.'
            );
        } else {
            recommendations.push(
                '🎉 Low risk profile! Your project uses mostly well-supported web features.'
            );
        }

        // File type specific recommendations
        if (summary.fileTypeBreakdown.css && summary.fileTypeBreakdown.css > summary.totalFeatures * 0.5) {
            recommendations.push(
                '🎨 CSS-heavy project detected. Consider using PostCSS with autoprefixer for better browser compatibility.'
            );
        }

        if (summary.fileTypeBreakdown.javascript && summary.fileTypeBreakdown.javascript > summary.totalFeatures * 0.5) {
            recommendations.push(
                '⚡ JavaScript-heavy project detected. Consider using Babel for transpilation and polyfills.'
            );
        }

        return recommendations;
    }

    /**
     * Export report as JSON
     */
    private exportAsJSON(report: CompatibilityReport): string {
        return JSON.stringify(report, null, 2);
    }

    /**
     * Export report as Markdown
     */
    private exportAsMarkdown(report: CompatibilityReport): string {
        const lines: string[] = [];
        
        // Header
        lines.push('# Baseline Lens Compatibility Report');
        lines.push('');
        lines.push(`**Generated:** ${report.generatedAt.toLocaleString()}`);
        lines.push(`**Project:** ${path.basename(report.projectPath)}`);
        lines.push(`**Files Analyzed:** ${report.analyzedFiles} of ${report.totalFiles}`);
        lines.push('');

        // Summary
        lines.push('## Summary');
        lines.push('');
        lines.push(`- **Total Features:** ${report.summary.totalFeatures}`);
        lines.push(`- **Widely Available:** ${report.summary.widelyAvailable} (${this.percentage(report.summary.widelyAvailable, report.summary.totalFeatures)}%)`);
        lines.push(`- **Newly Available:** ${report.summary.newlyAvailable} (${this.percentage(report.summary.newlyAvailable, report.summary.totalFeatures)}%)`);
        lines.push(`- **Limited Availability:** ${report.summary.limitedAvailability} (${this.percentage(report.summary.limitedAvailability, report.summary.totalFeatures)}%)`);
        lines.push('');

        // Risk Distribution
        lines.push('### Risk Distribution');
        lines.push('');
        lines.push(`- **Low Risk:** ${report.summary.riskDistribution.low} features`);
        lines.push(`- **Medium Risk:** ${report.summary.riskDistribution.medium} features`);
        lines.push(`- **High Risk:** ${report.summary.riskDistribution.high} features`);
        lines.push('');

        // File Type Breakdown
        lines.push('### File Type Breakdown');
        lines.push('');
        for (const [fileType, count] of Object.entries(report.summary.fileTypeBreakdown)) {
            lines.push(`- **${fileType.toUpperCase()}:** ${count} features`);
        }
        lines.push('');

        // Recommendations
        if (report.recommendations.length > 0) {
            lines.push('## Recommendations');
            lines.push('');
            for (const recommendation of report.recommendations) {
                lines.push(`- ${recommendation}`);
            }
            lines.push('');
        }

        // High-Risk Features
        const highRiskFeatures = report.features.filter(f => f.riskLevel === 'high');
        if (highRiskFeatures.length > 0) {
            lines.push('## High-Risk Features');
            lines.push('');
            lines.push('| Feature | Usage Count | Status | Description |');
            lines.push('|---------|-------------|--------|-------------|');
            
            for (const feature of highRiskFeatures.sort((a, b) => b.usageCount - a.usageCount)) {
                const description = feature.feature.description || 'No description available';
                const truncatedDesc = description.length > 50 ? description.substring(0, 47) + '...' : description;
                lines.push(`| ${feature.feature.name} | ${feature.usageCount} | Limited | ${truncatedDesc} |`);
            }
            lines.push('');
        }

        // Medium-Risk Features (top 10)
        const mediumRiskFeatures = report.features.filter(f => f.riskLevel === 'medium');
        if (mediumRiskFeatures.length > 0) {
            lines.push('## Newly Available Features (Top 10)');
            lines.push('');
            lines.push('| Feature | Usage Count | Description |');
            lines.push('|---------|-------------|-------------|');
            
            const topMediumRisk = mediumRiskFeatures
                .sort((a, b) => b.usageCount - a.usageCount)
                .slice(0, 10);
            
            for (const feature of topMediumRisk) {
                const description = feature.feature.description || 'No description available';
                const truncatedDesc = description.length > 50 ? description.substring(0, 47) + '...' : description;
                lines.push(`| ${feature.feature.name} | ${feature.usageCount} | ${truncatedDesc} |`);
            }
            lines.push('');
        }

        // Errors
        if (report.errors.length > 0) {
            lines.push('## Analysis Errors');
            lines.push('');
            lines.push('The following files could not be analyzed:');
            lines.push('');
            for (const error of report.errors) {
                lines.push(`- **${path.basename(error.file)}:** ${error.error}`);
            }
            lines.push('');
        }

        // Footer
        lines.push('---');
        lines.push('*Generated by Baseline Lens - Web Feature Compatibility Analysis*');
        lines.push('');
        lines.push('**Note:** Some features may not have complete compatibility data available in the browser compatibility database. Features without baseline data are analyzed based on detected usage patterns.');

        return lines.join('\n');
    }

    /**
     * Calculate percentage with 1 decimal place
     */
    private percentage(value: number, total: number): string {
        if (total === 0) return '0.0';
        return ((value / total) * 100).toFixed(1);
    }
}