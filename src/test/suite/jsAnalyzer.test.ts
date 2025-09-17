import * as assert from 'assert';
import * as vscode from 'vscode';
import { JavaScriptAnalyzer } from '../../analyzers/jsAnalyzer';
import { DetectedFeature } from '../../types';

suite('JavaScriptAnalyzer Test Suite', () => {
    let analyzer: JavaScriptAnalyzer;

    setup(() => {
        analyzer = new JavaScriptAnalyzer();
    });

    suite('Initialization', () => {
        test('should support JavaScript file types', () => {
            const supportedLanguages = analyzer.getSupportedLanguages();
            assert.ok(supportedLanguages.includes('javascript'));
            assert.ok(supportedLanguages.includes('typescript'));
            assert.ok(supportedLanguages.includes('javascriptreact'));
            assert.ok(supportedLanguages.includes('typescriptreact'));
        });
    });

    suite('Web API Detection', () => {
        test('should detect Fetch API usage', async () => {
            const jsContent = `
fetch('/api/data')
    .then(response => response.json())
    .then(data => console.log(data));

const request = new Request('/api/users');
const response = new Response('Hello');
const headers = new Headers();
`;
            const document = createMockDocument(jsContent, 'javascript');
            const features = await analyzer.analyze(jsContent, document);

            const fetchFeatures = features.filter(f => f.id === 'fetch');
            assert.ok(fetchFeatures.length >= 3, 'Should detect multiple Fetch API features');
            
            const fetchCall = fetchFeatures.find(f => f.name === 'fetch');
            asse