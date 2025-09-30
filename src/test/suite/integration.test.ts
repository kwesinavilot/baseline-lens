import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { AnalysisEngine } from '../../core/analysisEngine';
import { CompatibilityDataService } from '../../services/compatibilityService';
import { UIService } from '../../services/uiService';
import { FileWatcherService } from '../../services/fileWatcherService';
import { ReportGenerator } from '../../services/reportGenerator';

suite('Integration Test Suite', () => {
    let analysisEngine: AnalysisEngine;
    let compatibilityService: Compatibi