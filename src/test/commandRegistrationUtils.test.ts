// import * as assert from 'assert';
// import { 
//     CommandRegistrationUtils, 
//     DuplicateCommandError, 
//     RegistrationFailedError, 
//     InvalidCommandError, 
//     ContextNotAvailableError 
// } from '../core/commandRegistrationUtils';

// suite('CommandRegistrationUtils Test Suite', () => {
    
//     suite('validateCommandId', () => {
//         test('should validate correct command IDs', () => {
//             const validIds = [
//                 'baseline-lens.openDocumentation',
//                 'my-extension.command',
//                 'namespace.sub-command',
//                 'ext.command_name',
//                 'test.command-with-hyphens'
//             ];

//             validIds.forEach(commandId => {
//                 const result = CommandRegistrationUtils.validateCommandId(commandId);
//                 assert.strictEqual(result.isValid, true, `${commandId} should be valid`);
//             });
//         });

//         test('should reject invalid command IDs', () => {
//             const invalidIds = [
//                 '', // empty
//                 'no-dot', // no dot
//                 '.starts-with-dot',
//                 'ends-with-dot.',
//                 'has..consecutive.dots',
//                 'has spaces.command',
//                 'has@special.chars',
//                 'vscode.reserved-prefix', // reserved prefix
//                 'workbench.another-reserved'
//             ];

//             invalidIds.forEach(commandId => {
//                 const result = CommandRegistrationUtils.validateCommandId(commandId);
//                 assert.strictEqual(result.isValid, false, `${commandId} should be invalid`);
//                 assert.ok(result.error, `${commandId} should have an error`);
//             });
//         });

//         test('should handle null and undefined inputs', () => {
//             const result1 = CommandRegistrationUtils.validateCommandId(null as any);
//             assert.strictEqual(result1.isValid, false);
            
//             const result2 = CommandRegistrationUtils.validateCommandId(undefined as any);
//             assert.strictEqual(result2.isValid, false);
//         });

//         test('should reject commands that are too long', () => {
//             const longCommandId = 'a'.repeat(101) + '.command';
//             const result = CommandRegistrationUtils.validateCommandId(longCommandId);
//             assert.strictEqual(result.isValid, false);
//             assert.ok(result.error?.message.includes('maximum length'));
//         });
//     });

//     suite('Error Classes', () => {
//         test('DuplicateCommandError should have correct properties', () => {
//             const error = new DuplicateCommandError('test.command');
//             assert.strictEqual(error.name, 'DuplicateCommandError');
//             assert.ok(error.message.includes('test.command'));
//             assert.ok(error.message.includes('already registered'));
//         });

//         test('RegistrationFailedError should wrap original error', () => {
//             const originalError = new Error('Original error message');
//             const error = new RegistrationFailedError('test.command', originalError);
//             assert.strictEqual(error.name, 'RegistrationFailedError');
//             assert.ok(error.message.includes('test.command'));
//             assert.strictEqual(error.originalError, originalError);
//         });

//         test('InvalidCommandError should include reason', () => {
//             const error = new InvalidCommandError('bad.command', 'contains invalid characters');
//             assert.strictEqual(error.name, 'InvalidCommandError');
//             assert.ok(error.message.includes('bad.command'));
//             assert.ok(error.message.includes('contains invalid characters'));
//         });

//         test('ContextNotAvailableError should have correct message', () => {
//             const error = new ContextNotAvailableError();
//             assert.strictEqual(error.name, 'ContextNotAvailableError');
//             assert.ok(error.message.includes('Extension context'));
//         });
//     });

//     suite('logCommandOperation', () => {
//         test('should not throw when logging', () => {
//             // Test that logging methods don't throw errors
//             assert.doesNotThrow(() => {
//                 CommandRegistrationUtils.logCommandOperation('info', 'test.command', 'Test operation');
//                 CommandRegistrationUtils.logCommandOperation('warn', 'test.command', 'Test warning', { detail: 'test' });
//                 CommandRegistrationUtils.logCommandOperation('error', 'test.command', 'Test error', new Error('test error'));
//             });
//         });
//     });

//     suite('createDiagnosticInfo', () => {
//         test('should create diagnostic info for valid command', async () => {
//             const diagnostics = await CommandRegistrationUtils.createDiagnosticInfo('test.command');
            
//             assert.ok(diagnostics.commandId === 'test.command');
//             assert.ok(diagnostics.timestamp);
//             assert.ok(diagnostics.validation);
//             assert.ok(typeof diagnostics.existsInRegistry === 'boolean');
//             assert.ok(diagnostics.vsCodeVersion);
//             assert.ok(diagnostics.systemInfo);
//         });

//         test('should handle invalid command in diagnostics', async () => {
//             const diagnostics = await CommandRegistrationUtils.createDiagnosticInfo('invalid command');
            
//             assert.strictEqual(diagnostics.validation.isValid, false);
//             assert.ok(diagnostics.validation.error);
//         });
//     });

//     suite('attemptRecovery', () => {
//         test('should handle duplicate command errors', async () => {
//             const duplicateError = new DuplicateCommandError('test.command');
//             const recovery = await CommandRegistrationUtils.attemptRecovery('test.command', duplicateError);
            
//             assert.strictEqual(recovery.strategy, 'duplicate_handling');
//             assert.ok(recovery.message);
//         });

//         test('should handle context errors', async () => {
//             const contextError = new ContextNotAvailableError();
//             const recovery = await CommandRegistrationUtils.attemptRecovery('test.command', contextError);
            
//             assert.strictEqual(recovery.strategy, 'context_retry');
//             assert.ok(recovery.message);
//         });

//         test('should handle validation errors', async () => {
//             const validationError = new InvalidCommandError('bad command', 'invalid format');
//             const recovery = await CommandRegistrationUtils.attemptRecovery('bad command', validationError);
            
//             assert.strictEqual(recovery.strategy, 'validation_fix');
//             assert.strictEqual(recovery.success, false);
//         });

//         test('should handle unknown errors with generic retry', async () => {
//             const unknownError = new Error('Unknown error');
//             const recovery = await CommandRegistrationUtils.attemptRecovery('test.command', unknownError);
            
//             assert.strictEqual(recovery.strategy, 'generic_retry');
//             assert.strictEqual(recovery.success, true);
//         });
//     });
// });