import * as vscode from 'vscode';

/**
 * Error types for command registration operations
 */
export class DuplicateCommandError extends Error {
    constructor(commandId: string) {
        super(`Command '${commandId}' is already registered`);
        this.name = 'DuplicateCommandError';
    }
}

export class RegistrationFailedError extends Error {
    public readonly originalError: Error;
    
    constructor(commandId: string, originalError: Error) {
        super(`Failed to register command '${commandId}': ${originalError.message}`);
        this.name = 'RegistrationFailedError';
        this.originalError = originalError;
    }
}

export class InvalidCommandError extends Error {
    constructor(commandId: string, reason: string) {
        super(`Invalid command ID '${commandId}': ${reason}`);
        this.name = 'InvalidCommandError';
    }
}

export class ContextNotAvailableError extends Error {
    constructor() {
        super('Extension context is not available for command registration');
        this.name = 'ContextNotAvailableError';
    }
}

/**
 * Utility functions for command registration operations
 */
export class CommandRegistrationUtils {
    private static readonly COMMAND_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9.\-_]*\.[a-zA-Z0-9.\-_]+$/;
    private static readonly MAX_COMMAND_ID_LENGTH = 100;
    private static readonly RESERVED_PREFIXES = ['vscode', 'workbench', 'editor'];

    /**
     * Check if a command exists in the VS Code command registry
     * @param commandId The command ID to check
     * @returns Promise<boolean> True if the command exists, false otherwise
     */
    static async checkCommandExists(commandId: string): Promise<boolean> {
        try {
            const allCommands = await vscode.commands.getCommands(true);
            return allCommands.includes(commandId);
        } catch (error) {
            // Log the error but don't throw - return false as safe default
            console.warn(`Failed to check command existence for '${commandId}':`, error);
            return false;
        }
    }

    /**
     * Safely unregister a command with comprehensive error handling
     * @param commandId The command ID to unregister
     * @param disposable The disposable object for the command (if available)
     * @returns Promise<boolean> True if successfully unregistered, false otherwise
     */
    static async safeUnregister(commandId: string, disposable?: vscode.Disposable): Promise<boolean> {
        try {
            // If we have the disposable, use it directly
            if (disposable) {
                disposable.dispose();
                console.log(`Successfully disposed command '${commandId}' using disposable`);
                return true;
            }

            // Check if command exists before attempting unregistration
            const exists = await this.checkCommandExists(commandId);
            if (!exists) {
                console.log(`Command '${commandId}' does not exist, no unregistration needed`);
                return true;
            }

            // Note: VS Code doesn't provide a direct way to unregister commands by ID
            // The disposable pattern is the recommended approach
            console.warn(`Command '${commandId}' exists but no disposable provided for unregistration`);
            return false;

        } catch (error) {
            console.error(`Error during safe unregistration of command '${commandId}':`, error);
            return false;
        }
    }

    /**
     * Validate command ID format and constraints
     * @param commandId The command ID to validate
     * @returns ValidationResult with success status and error details
     */
    static validateCommandId(commandId: string): ValidationResult {
        // Check for null/undefined/empty
        if (!commandId || typeof commandId !== 'string') {
            return {
                isValid: false,
                error: new InvalidCommandError(commandId || 'undefined', 'Command ID must be a non-empty string')
            };
        }

        // Check length constraints
        if (commandId.length > this.MAX_COMMAND_ID_LENGTH) {
            return {
                isValid: false,
                error: new InvalidCommandError(commandId, `Command ID exceeds maximum length of ${this.MAX_COMMAND_ID_LENGTH} characters`)
            };
        }

        // Check pattern matching
        if (!this.COMMAND_ID_PATTERN.test(commandId)) {
            return {
                isValid: false,
                error: new InvalidCommandError(commandId, 'Command ID must follow pattern: namespace.command (alphanumeric, dots, hyphens, underscores only)')
            };
        }

        // Check for reserved prefixes
        const prefix = commandId.split('.')[0].toLowerCase();
        if (this.RESERVED_PREFIXES.includes(prefix)) {
            return {
                isValid: false,
                error: new InvalidCommandError(commandId, `Command ID cannot start with reserved prefix '${prefix}'`)
            };
        }

        // Check for minimum structure (must have at least one dot)
        if (!commandId.includes('.')) {
            return {
                isValid: false,
                error: new InvalidCommandError(commandId, 'Command ID must contain at least one dot to separate namespace and command')
            };
        }

        // Additional validation: ensure no consecutive dots
        if (commandId.includes('..')) {
            return {
                isValid: false,
                error: new InvalidCommandError(commandId, 'Command ID cannot contain consecutive dots')
            };
        }

        // Additional validation: ensure doesn't start or end with dot
        if (commandId.startsWith('.') || commandId.endsWith('.')) {
            return {
                isValid: false,
                error: new InvalidCommandError(commandId, 'Command ID cannot start or end with a dot')
            };
        }

        return { isValid: true };
    }

    /**
     * Enhanced logging for command registration operations
     * @param level The log level (info, warn, error)
     * @param commandId The command ID being processed
     * @param operation The operation being performed
     * @param details Additional details or error information
     */
    static logCommandOperation(
        level: 'info' | 'warn' | 'error',
        commandId: string,
        operation: string,
        details?: any
    ): void {
        const timestamp = new Date().toISOString();
        const prefix = `[CommandRegistration ${timestamp}]`;
        
        const message = `${prefix} ${operation} for command '${commandId}'`;
        
        switch (level) {
            case 'info':
                console.log(message, details ? details : '');
                break;
            case 'warn':
                console.warn(message, details ? details : '');
                break;
            case 'error':
                console.error(message, details ? details : '');
                break;
        }
    }

    /**
     * Create diagnostic information for debugging command registration issues
     * @param commandId The command ID to diagnose
     * @param context The extension context (if available)
     * @returns Promise<DiagnosticInfo> Comprehensive diagnostic information
     */
    static async createDiagnosticInfo(
        commandId: string,
        context?: vscode.ExtensionContext
    ): Promise<DiagnosticInfo> {
        const diagnostics: DiagnosticInfo = {
            commandId,
            timestamp: new Date().toISOString(),
            validation: this.validateCommandId(commandId),
            existsInRegistry: false,
            vsCodeVersion: vscode.version,
            extensionContext: {
                available: !!context,
                subscriptionCount: context?.subscriptions.length || 0
            },
            systemInfo: {
                platform: process.platform,
                nodeVersion: process.version
            }
        };

        try {
            diagnostics.existsInRegistry = await this.checkCommandExists(commandId);
        } catch (error) {
            diagnostics.registryCheckError = error instanceof Error ? error.message : String(error);
        }

        // Get all commands for context
        try {
            const allCommands = await vscode.commands.getCommands(true);
            diagnostics.totalCommandsInRegistry = allCommands.length;
            
            // Find similar commands (same prefix)
            const prefix = commandId.split('.')[0];
            diagnostics.similarCommands = allCommands.filter(cmd => cmd.startsWith(prefix + '.'));
        } catch (error) {
            diagnostics.commandListError = error instanceof Error ? error.message : String(error);
        }

        return diagnostics;
    }

    /**
     * Attempt to recover from command registration failures
     * @param commandId The command that failed to register
     * @param error The error that occurred
     * @param context The extension context
     * @returns Promise<RecoveryResult> Information about recovery attempt
     */
    static async attemptRecovery(
        commandId: string,
        error: Error,
        context?: vscode.ExtensionContext
    ): Promise<RecoveryResult> {
        this.logCommandOperation('info', commandId, 'Attempting recovery from registration failure', error.message);

        const result: RecoveryResult = {
            success: false,
            strategy: 'none',
            message: ''
        };

        // Strategy 1: Handle duplicate command errors
        if (error.message.includes('already exists') || error instanceof DuplicateCommandError) {
            result.strategy = 'duplicate_handling';
            
            try {
                const exists = await this.checkCommandExists(commandId);
                if (exists) {
                    result.message = `Command '${commandId}' exists in registry. Cannot unregister without disposable reference.`;
                    this.logCommandOperation('warn', commandId, 'Recovery failed - command exists but cannot be unregistered');
                } else {
                    result.success = true;
                    result.message = `Command '${commandId}' no longer exists in registry. Safe to retry registration.`;
                    this.logCommandOperation('info', commandId, 'Recovery successful - command no longer exists');
                }
            } catch (checkError) {
                result.message = `Failed to check command existence during recovery: ${checkError}`;
                this.logCommandOperation('error', commandId, 'Recovery failed during existence check', checkError);
            }
        }
        
        // Strategy 2: Handle context issues
        else if (error instanceof ContextNotAvailableError || error.message.includes('context')) {
            result.strategy = 'context_retry';
            
            if (context) {
                result.success = true;
                result.message = 'Extension context is now available. Safe to retry registration.';
                this.logCommandOperation('info', commandId, 'Recovery successful - context now available');
            } else {
                result.message = 'Extension context is still not available. Cannot retry registration.';
                this.logCommandOperation('warn', commandId, 'Recovery failed - context still unavailable');
            }
        }
        
        // Strategy 3: Handle validation errors
        else if (error instanceof InvalidCommandError) {
            result.strategy = 'validation_fix';
            result.message = `Command ID validation failed: ${error.message}. Cannot recover automatically.`;
            this.logCommandOperation('error', commandId, 'Recovery not possible - validation error', error.message);
        }
        
        // Strategy 4: Generic retry for transient errors
        else {
            result.strategy = 'generic_retry';
            result.success = true; // Allow retry for unknown errors
            result.message = `Unknown error occurred: ${error.message}. Allowing retry attempt.`;
            this.logCommandOperation('warn', commandId, 'Recovery attempt - unknown error, allowing retry', error.message);
        }

        return result;
    }
}

/**
 * Result of command ID validation
 */
export interface ValidationResult {
    isValid: boolean;
    error?: InvalidCommandError;
}

/**
 * Comprehensive diagnostic information for command registration
 */
export interface DiagnosticInfo {
    commandId: string;
    timestamp: string;
    validation: ValidationResult;
    existsInRegistry: boolean;
    registryCheckError?: string;
    totalCommandsInRegistry?: number;
    similarCommands?: string[];
    commandListError?: string;
    vsCodeVersion: string;
    extensionContext: {
        available: boolean;
        subscriptionCount: number;
    };
    systemInfo: {
        platform: string;
        nodeVersion: string;
    };
}

/**
 * Result of recovery attempt
 */
export interface RecoveryResult {
    success: boolean;
    strategy: 'none' | 'duplicate_handling' | 'context_retry' | 'validation_fix' | 'generic_retry';
    message: string;
}