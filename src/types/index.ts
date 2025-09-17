import * as vscode from 'vscode';

export interface DetectedFeature {
    id: string;
    name: string;
    type: 'css' | 'javascript' | 'html';
    range: vscode.Range;
    baselineStatus: BaselineStatus;
    context?: string;
    severity: 'error' | 'warning' | 'info';
    filePath?: string;
}

export interface BaselineStatus {
    status: 'widely_available' | 'newly_available' | 'limited_availability';
    baseline_date?: string;
    high_date?: string;
    low_date?: string;
    support: {
        [browser: string]: {
            version_added: string | boolean;
            version_removed?: string | boolean;
            notes?: string;
        };
    };
}

export interface AnalysisResult {
    features: DetectedFeature[];
    diagnostics: vscode.Diagnostic[];
    decorations: vscode.DecorationOptions[];
}

export interface ExtensionConfig {
    enabledFileTypes: string[];
    supportThreshold: number;
    showInlineIndicators: boolean;
    diagnosticSeverity: 'error' | 'warning' | 'info';
    customBrowserMatrix?: string[];
    excludePatterns: string[];
}

export interface WebFeature {
    id: string;
    name: string;
    description?: string;
    mdn_url?: string;
    spec_url?: string;
    baseline?: BaselineStatus;
    compat_features?: string[];
    status?: {
        baseline_status?: string;
        baseline_low_date?: string;
        baseline_high_date?: string;
        support?: {
            [browser: string]: {
                version_added?: string | boolean;
                version_removed?: string | boolean;
                notes?: string;
            };
        };
    };
}

export interface WebFeatureDetails {
    name: string;
    description: string;
    mdn_url?: string;
    spec_url?: string;
    baseline: BaselineStatus;
}

export interface BaseAnalyzer {
    analyze(content: string, document: vscode.TextDocument): Promise<DetectedFeature[]>;
    getSupportedLanguages(): string[];
}

export interface ProjectAnalysisResult {
    totalFiles: number;
    analyzedFiles: number;
    features: DetectedFeature[];
    errors: AnalysisError[];
    summary: {
        widelyAvailable: number;
        newlyAvailable: number;
        limitedAvailability: number;
    };
}

export interface AnalysisError {
    file: string;
    error: string;
    line?: number;
    column?: number;
}

export interface CompatibilityReport {
    summary: ReportSummary;
    features: FeatureUsage[];
    recommendations: string[];
    generatedAt: Date;
    projectPath: string;
    totalFiles: number;
    analyzedFiles: number;
    errors: AnalysisError[];
}

export interface ReportSummary {
    totalFeatures: number;
    widelyAvailable: number;
    newlyAvailable: number;
    limitedAvailability: number;
    riskDistribution: {
        low: number;
        medium: number;
        high: number;
    };
    fileTypeBreakdown: {
        [fileType: string]: number;
    };
}

export interface FeatureUsage {
    feature: WebFeatureDetails;
    locations: FileLocation[];
    riskLevel: 'low' | 'medium' | 'high';
    usageCount: number;
}

export interface FileLocation {
    filePath: string;
    line: number;
    column: number;
    context?: string;
}