// import * as assert from 'assert';
// import * as vscode from 'vscode';
// import { JavaScriptAnalyzer } from '../../analyzers/jsAnalyzer';
// import { DetectedFeature } from '../../types';

// suite('JavaScriptAnalyzer Test Suite', () => {
//     let analyzer: JavaScriptAnalyzer;

//     setup(() => {
//         analyzer = new JavaScriptAnalyzer();
//     });

//     suite('Initialization', () => {
//         test('should support JavaScript file types', () => {
//             const supportedLanguages = analyzer.getSupportedLanguages();
//             assert.ok(supportedLanguages.includes('javascript'));
//             assert.ok(supportedLanguages.includes('typescript'));
//             assert.ok(supportedLanguages.includes('javascriptreact'));
//             assert.ok(supportedLanguages.includes('typescriptreact'));
//         });
//     });

//     suite('Web API Detection', () => {
//         test('should detect Fetch API usage', async () => {
//             const jsContent = `
// fetch('/api/data')
//     .then(response => response.json())
//     .then(data => console.log(data));

// const request = new Request('/api/users');
// const response = new Response('Hello');
// const headers = new Headers();
// `;
//             const document = createMockDocument(jsContent, 'javascript');
//             const features = await analyzer.analyze(jsContent, document);

//             const fetchFeatures = features.filter(f => f.id === 'fetch');
//             assert.ok(fetchFeatures.length >= 3, 'Should detect multiple Fetch API features');
            
//             const fetchCall = fetchFeatures.find(f => f.name === 'fetch');
//             assert.ok(fetchCall, 'Should detect fetch function call');  
//       });
//     });

//     // Helper function to create mock VS Code document
//     function createMockDocument(content: string, languageId: string): vscode.TextDocument {
//         return {
//             uri: vscode.Uri.file(`/test/file.${languageId}`),
//             fileName: `/test/file.${languageId}`,
//             isUntitled: false,
//             languageId,
//             version: 1,
//             isDirty: false,
//             isClosed: false,
//             save: async () => true,
//             eol: vscode.EndOfLine.LF,
//             lineCount: content.split('\n').length,
//             lineAt: (lineOrPosition: number | vscode.Position) => {
//                 const lineNumber = typeof lineOrPosition === 'number' ? lineOrPosition : lineOrPosition.line;
//                 return {
//                     lineNumber,
//                     text: content.split('\n')[lineNumber] || '',
//                     range: new vscode.Range(lineNumber, 0, lineNumber, (content.split('\n')[lineNumber] || '').length),
//                     rangeIncludingLineBreak: new vscode.Range(lineNumber, 0, lineNumber + 1, 0),
//                     firstNonWhitespaceCharacterIndex: 0,
//                     isEmptyOrWhitespace: (content.split('\n')[lineNumber] || '').trim().length === 0
//                 };
//             },
//             offsetAt: (position: vscode.Position) => {
//                 const lines = content.split('\n');
//                 let offset = 0;
//                 for (let i = 0; i < position.line && i < lines.length; i++) {
//                     offset += lines[i].length + 1; // +1 for newline
//                 }
//                 return offset + position.character;
//             },
//             positionAt: (offset: number) => {
//                 const lines = content.split('\n');
//                 let currentOffset = 0;
//                 for (let line = 0; line < lines.length; line++) {
//                     if (currentOffset + lines[line].length >= offset) {
//                         return new vscode.Position(line, offset - currentOffset);
//                     }
//                     currentOffset += lines[line].length + 1; // +1 for newline
//                 }
//                 return new vscode.Position(lines.length - 1, lines[lines.length - 1].length);
//             },
//             getText: (range?: vscode.Range) => {
//                 if (!range) return content;
//                 const start = content.split('\n').slice(0, range.start.line).join('\n').length + 
//                              (range.start.line > 0 ? 1 : 0) + range.start.character;
//                 const end = content.split('\n').slice(0, range.end.line).join('\n').length + 
//                            (range.end.line > 0 ? 1 : 0) + range.end.character;
//                 return content.substring(start, end);
//             },
//             getWordRangeAtPosition: () => undefined,
//             validateRange: (range: vscode.Range) => range,
//             validatePosition: (position: vscode.Position) => position,
//             encoding: 'utf8'
//         } as vscode.TextDocument;
//     }
// });