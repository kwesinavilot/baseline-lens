import * as vscode from 'vscode';
import { 
    CommandRegistrationUtils, 
    DuplicateCommandError, 
    RegistrationFailedError, 
    InvalidCommandError, 
    ContextNotAvailableError,
    RecoveryResult
} from './commandRegistrationUtils';

/**
 * Comprehensive error handler for command registration operations
 */
export class CommandRegistrationErrorHandler {
    private static readonly MAX_RECOVERY_ATTEMPTS = 3;
    private static readonly RECOVERY_DELAY_MS = 100;

    /**
     * Handle duplicate command registration errors
     * @param commandId The command ID that has a duplicate
     * @param originalCallback The original callback function
     * @param context The extension context
     * @param thisArg Optional 'this' argument for the callback
     * @returns Promise<boolean> True if successfully handled, false otherwise
     */
    static async handleDuplicateCommand(
        commandId: string,
        originalCallback: (...args: any[]) => any,
        context: vscode.ExtensionContext,
        thisArg?: any
    ): Promise<boolean> {
        CommandRegistrationUtils.logCommandOperation('info', commandId, 'Handling duplicate command error');

        try {
            // First, verify the command actually exists
            const exists = await CommandRegistrationUtils.checkCommandExists(commandId);
            
            if (!exists) {
                CommandRegistrationUtils.logCommandOperation('info', commandId, 'Command no longer exists, safe to retry registration');
                return this.retryRegistration(commandId, originalCallback, context, thisArg);
            }

            // Command exists - we cannot safely unregister it without the original disposable
            CommandRegistrationUtils.logCommandOperation('warn', commandId, 'Command exists but cannot be unregistered without disposable reference');
            
            // Check if this is a development scenario where we might want to continue anyway
            if (this.isDevEnvironment()) {
                CommandRegistrationUtils.logCommandOperation('info', commandId, 'Development environment detected, attempting graceful handling');
                return this.handleDevEnvironmentDuplicate(commandId);
            }

            return false;

        } catch (error) {
            CommandRegistrationUtils.logCommandOperation('error', commandId, 'Error handling duplicate command', error);
            return false;
        }
    }

    /**
     * Handle registration failed errors with comprehensive recovery strategies
     * @param commandId The command ID that failed to register
     * @param error The original registration error
     * @param originalCallback The original callback function
     * @param context The extension context
     * @param thisArg Optional 'this' argument for the callback
     * @returns Promise<boolean> True if successfully recovered, false otherwise
     */
    static async handleRegistrationFailed(
        commandId: string,
        error: Error,
        originalCallback: (...args: any[]) => any,
        context: vscode.ExtensionContext,
        thisArg?: any
    ): Promise<boolean> {
        CommandRegistrationUtils.logCommandOperation('error', commandId, 'Handling registration failure', error.message);

        // Attempt recovery using utilities
        const recovery = await CommandRegistrationUtils.attemptRecovery(commandId, error, context);
        
        if (!recovery.success) {
            CommandRegistrationUtils.logCommandOperation('warn', commandId, 'Recovery not possible', recovery.message);
            return false;
        }

        // Wait a brief moment before retry to allow any cleanup to complete
        await this.delay(this.RECOVERY_DELAY_MS);

        // Attempt retry based on recovery strategy
        switch (recovery.strategy) {
            case 'duplicate_handling':
                return this.handleDuplicateCommand(commandId, originalCallback, context, thisArg);
            
            case 'context_retry':
                return this.retryRegistration(commandId, originalCallback, context, thisArg);
            
            case 'generic_retry':
                return this.retryRegistration(commandId, originalCallback, context, thisArg);
            
            default:
                CommandRegistrationUtils.logCommandOperation('warn', commandId, 'Unknown recovery strategy', recovery.strategy);
                return false;
        }
    }

    /**
     * Handle invalid command ID errors
     * @param commandId The invalid command ID
     * @param error The validation error
     * @returns boolean Always returns false as invalid commands cannot be recovered
     */
    static handleInvalidCommand(commandId: string, error: InvalidCommandError): boolean {
        CommandRegistrationUtils.logCommandOperation('error', commandId, 'Invalid command ID cannot be recovered', error.message);
        
        // Log suggestions for fixing the command ID
        const suggestions = this.generateCommandIdSuggestions(commandId);
        if (suggestions.length > 0) {
            CommandRegistrationUtils.logCommandOperation('info', commandId, 'Suggested valid command IDs', suggestions.join(', '));
        }
        
        return false;
    }

    /**
     * Handle context not available errors
     * @param commandId The command ID that failed due to missing context
     * @param originalCallback The original callback function
     * @param context The extension context (may be null/undefined)
     * @param thisArg Optional 'this' argument for the callback
     * @returns Promise<boolean> True if context becomes available and registration succeeds
     */
    static async handleContextNotAvailable(
        commandId: string,
        originalCallback: (...args: any[]) => any,
        context?: vscode.ExtensionContext,
        thisArg?: any
    ): Promise<boolean> {
        CommandRegistrationUtils.logCommandOperation('warn', commandId, 'Extension context not available');

        if (!context) {
            CommandRegistrationUtils.logCommandOperation('error', commandId, 'Context is still not available, cannot retry');
            return false;
        }

        // Context is now available, retry registration
        CommandRegistrationUtils.logCommandOperation('info', commandId, 'Context now available, retrying registration');
        return this.retryRegistration(commandId, originalCallback, context, thisArg);
    }

    /**
     * Enable fallback mode for partial functionality
     * @param failedCommands Array of command IDs that failed to register
     * @param essentialCommands Array of command IDs that are essential for basic functionality
     * @returns FallbackModeResult Information about fallback mode activation
     */
    static enableFallbackMode(
        failedCommands: string[],
        essentialCommands: string[] = []
    ): FallbackModeResult {
        CommandRegistrationUtils.logCommandOperation('warn', 'FallbackMode', 'Enabling fallback mode due to command registration failures');

        const essentialFailures = failedCommands.filter(cmd => essentialCommands.includes(cmd));
        const nonEssentialFailures = failedCommands.filter(cmd => !essentialCommands.includes(cmd));

        const result: FallbackModeResult = {
            isActive: true,
            failedCommands,
            essentialCommandsFailed: essentialFailures,
            nonEssentialCommandsFailed: nonEssentialFailures,
            functionalityLevel: essentialFailures.length > 0 ? 'limited' : 'reduced',
            message: this.generateFallbackMessage(essentialFailures.length, nonEssentialFailures.length)
        };

        CommandRegistrationUtils.logCommandOperation('info', 'FallbackMode', result.message);
        
        return result;
    }

    /**
     * Retry command registration with exponential backoff
     */
    private static async retryRegistration(
        commandId: string,
        callback: (...args: any[]) => any,
        context: vscode.ExtensionContext,
        thisArg?: any,
        attempt: number = 1
    ): Promise<boolean> {
        if (attempt > this.MAX_RECOVERY_ATTEMPTS) {
            CommandRegistrationUtils.logCommandOperation('error', commandId, `Max recovery attempts (${this.MAX_RECOVERY_ATTEMPTS}) exceeded`);
            return false;
        }

        try {
            const disposable = vscode.commands.registerCommand(commandId, callback, thisArg);
            context.subscriptions.push(disposable);
            
            CommandRegistrationUtils.logCommandOperation('info', commandId, `Successfully registered on retry attempt ${attempt}`);
            return true;

        } catch (error) {
            CommandRegistrationUtils.logCommandOperation('warn', commandId, `Retry attempt ${attempt} failed`, error);
            
            // Wait with exponential backoff before next attempt
            const delay = this.RECOVERY_DELAY_MS * Math.pow(2, attempt - 1);
            await this.delay(delay);
            
            return this.retryRegistration(commandId, callback, context, thisArg, attempt + 1);
        }
    }

    /**
     * Check if running in development environment
     */
    private static isDevEnvironment(): boolean {
        // Check for common development environment indicators
        return (
            vscode.env.appName.includes('Dev') ||
            vscode.env.appName.includes('Insiders') ||
            process.env.NODE_ENV === 'development' ||
            process.env.VSCODE_DEV === 'true'
        );
    }

    /**
     * Handle duplicate commands in development environment
     */
    private static handleDevEnvironmentDuplicate(commandId: string): boolean {
        CommandRegistrationUtils.logCommandOperation('info', commandId, 'Handling duplicate in development environment - allowing graceful degradation');
        
        // In development, we can be more lenient about duplicates
        // Log the issue but don't fail completely
        return false; // Still return false to indicate the command wasn't registered
    }

    /**
     * Generate suggestions for fixing invalid command IDs
     */
    private static generateCommandIdSuggestions(invalidCommandId: string): string[] {
        const suggestions: string[] = [];
        
        if (!invalidCommandId) {
            return ['Use format: namespace.commandName'];
        }

        // Remove invalid characters
        const cleaned = invalidCommandId.replace(/[^a-zA-Z0-9.\-_]/g, '');
        if (cleaned !== invalidCommandId) {
            suggestions.push(cleaned);
        }

        // Ensure it has a dot
        if (!cleaned.includes('.')) {
            suggestions.push(`extension.${cleaned}`);
        }

        // Ensure it doesn't start or end with dot
        const trimmed = cleaned.replace(/^\.+|\.+$/g, '');
        if (trimmed !== cleaned && trimmed.includes('.')) {
            suggestions.push(trimmed);
        }

        return suggestions.slice(0, 3); // Limit to 3 suggestions
    }

    /**
     * Generate fallback mode message
     */
    private static generateFallbackMessage(essentialFailures: number, nonEssentialFailures: number): string {
        if (essentialFailures > 0) {
            return `Extension running in limited mode: ${essentialFailures} essential command(s) and ${nonEssentialFailures} optional command(s) failed to register`;
        } else {
            return `Extension running in reduced mode: ${nonEssentialFailures} optional command(s) failed to register, core functionality available`;
        }
    }

    /**
     * Utility method for delays
     */
    private static delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Result of fallback mode activation
 */
export interface FallbackModeResult {
    isActive: boolean;
    failedCommands: string[];
    essentialCommandsFailed: string[];
    nonEssentialCommandsFailed: string[];
    functionalityLevel: 'full' | 'reduced' | 'limited';
    message: string;
}