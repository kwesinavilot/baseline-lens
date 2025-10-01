import * as vscode from 'vscode';
import { 
    CommandRegistrationUtils, 
    DuplicateCommandError, 
    RegistrationFailedError, 
    InvalidCommandError, 
    ContextNotAvailableError,
    ValidationResult,
    DiagnosticInfo,
    RecoveryResult
} from './commandRegistrationUtils';

/**
 * Interface for command registration state tracking
 */
interface CommandRegistrationState {
    commandId: string;
    isRegistered: boolean;
    registrationAttempts: number;
    lastError?: Error;
    disposable?: vscode.Disposable;
}

/**
 * Configuration options for CommandManager
 */
interface CommandManagerConfig {
    maxRegistrationAttempts: number;
    enableFallbackMode: boolean;
    logRegistrationErrors: boolean;
    commandPrefix: string;
}

/**
 * CommandManager provides safe command registration and management for VS Code extensions.
 * It handles duplicate command registration, proper cleanup, and graceful error handling.
 */
export class CommandManager implements vscode.Disposable {
    private registeredCommands: Map<string, CommandRegistrationState> = new Map();
    private context: vscode.ExtensionContext | null = null;
    private config: CommandManagerConfig;
    private isDisposed = false;

    constructor(config?: Partial<CommandManagerConfig>) {
        this.config = {
            maxRegistrationAttempts: 3,
            enableFallbackMode: true,
            logRegistrationErrors: true,
            commandPrefix: 'baseline-lens',
            ...config
        };
    }

    /**
     * Initialize the CommandManager with the extension context
     */
    async initialize(context: vscode.ExtensionContext): Promise<void> {
        if (this.isDisposed) {
            throw new Error('CommandManager has been disposed and cannot be reinitialized');
        }

        this.context = context;
        
        if (this.config.logRegistrationErrors) {
            console.log('CommandManager initialized successfully');
        }
    }

    /**
     * Check if a command is already registered in VS Code
     */
    async isCommandRegistered(commandId: string): Promise<boolean> {
        return CommandRegistrationUtils.checkCommandExists(commandId);
    }

    /**
     * Safely register a command, handling duplicates and errors gracefully
     */
    async registerCommand(
        commandId: string, 
        callback: (...args: any[]) => any,
        thisArg?: any
    ): Promise<boolean> {
        if (this.isDisposed) {
            console.warn('Cannot register command: CommandManager has been disposed');
            return false;
        }

        if (!this.context) {
            const error = new ContextNotAvailableError();
            CommandRegistrationUtils.logCommandOperation('error', commandId, 'Registration failed - no context', error.message);
            return false;
        }

        // Validate command ID format using enhanced validation
        const validation = CommandRegistrationUtils.validateCommandId(commandId);
        if (!validation.isValid) {
            CommandRegistrationUtils.logCommandOperation('error', commandId, 'Registration failed - validation error', validation.error?.message);
            return false;
        }

        // Check if we already have this command registered
        const existingState = this.registeredCommands.get(commandId);
        if (existingState?.isRegistered) {
            if (this.config.logRegistrationErrors) {
                console.warn(`Command ${commandId} is already registered by this manager`);
            }
            return true; // Already registered successfully
        }

        // Initialize or update registration state
        const state: CommandRegistrationState = existingState || {
            commandId,
            isRegistered: false,
            registrationAttempts: 0
        };

        state.registrationAttempts++;

        try {
            // Check if command exists in VS Code registry
            const exists = await this.isCommandRegistered(commandId);
            if (exists) {
                CommandRegistrationUtils.logCommandOperation('warn', commandId, 'Command already exists in VS Code registry, attempting registration anyway');
            }

            // Attempt to register the command
            const disposable = vscode.commands.registerCommand(commandId, callback, thisArg);
            
            // Success - update state and add to subscriptions
            state.isRegistered = true;
            state.disposable = disposable;
            state.lastError = undefined;
            
            this.registeredCommands.set(commandId, state);
            this.context.subscriptions.push(disposable);

            CommandRegistrationUtils.logCommandOperation('info', commandId, 'Successfully registered command');
            return true;

        } catch (error) {
            // Enhanced error handling with utilities
            const registrationError = error instanceof Error ? error : new Error(String(error));
            state.lastError = registrationError;
            state.isRegistered = false;
            
            this.registeredCommands.set(commandId, state);

            CommandRegistrationUtils.logCommandOperation('error', commandId, `Registration failed (attempt ${state.registrationAttempts})`, registrationError.message);

            // Try to recover from the error
            const recovery = await CommandRegistrationUtils.attemptRecovery(commandId, registrationError, this.context);
            
            // Handle duplicate command error specifically
            if (registrationError.message.includes('already exists')) {
                const duplicateError = new DuplicateCommandError(commandId);
                return await this.handleDuplicateCommandWithRecovery(commandId, callback, duplicateError, thisArg);
            }

            // If recovery suggests we can retry and we haven't exceeded max attempts
            if (recovery.success && state.registrationAttempts < this.config.maxRegistrationAttempts) {
                CommandRegistrationUtils.logCommandOperation('info', commandId, 'Recovery suggests retry is possible', recovery.message);
                // Recursive retry (will increment attempt counter)
                return await this.registerCommand(commandId, callback, thisArg);
            }

            // If we've exceeded max attempts, handle based on fallback mode
            if (state.registrationAttempts >= this.config.maxRegistrationAttempts) {
                if (this.config.enableFallbackMode) {
                    CommandRegistrationUtils.logCommandOperation('warn', commandId, `Giving up after ${state.registrationAttempts} attempts, continuing in fallback mode`);
                    return false;
                } else {
                    // Create a more descriptive error for throwing
                    const finalError = new RegistrationFailedError(commandId, registrationError);
                    CommandRegistrationUtils.logCommandOperation('error', commandId, 'Registration failed permanently', finalError.message);
                    throw finalError;
                }
            }

            return false;
        }
    }

    /**
     * Handle duplicate command registration by attempting to unregister first
     */
    private async handleDuplicateCommandWithRecovery(
        commandId: string, 
        callback: (...args: any[]) => any,
        duplicateError: DuplicateCommandError,
        thisArg?: any
    ): Promise<boolean> {
        CommandRegistrationUtils.logCommandOperation('info', commandId, 'Attempting to handle duplicate command');

        try {
            // Try to unregister the existing command first
            const success = await this.safeUnregisterCommand(commandId);
            
            if (success) {
                CommandRegistrationUtils.logCommandOperation('info', commandId, 'Successfully unregistered existing command, retrying registration');
                // Retry registration after successful unregistration
                return await this.registerCommand(commandId, callback, thisArg);
            } else {
                CommandRegistrationUtils.logCommandOperation('warn', commandId, 'Could not unregister existing command, skipping registration');
                return false;
            }
        } catch (error) {
            CommandRegistrationUtils.logCommandOperation('error', commandId, 'Error handling duplicate command', error);
            return false;
        }
    }

    /**
     * Safely unregister a command using enhanced utilities
     */
    async safeUnregisterCommand(commandId: string): Promise<boolean> {
        const state = this.registeredCommands.get(commandId);
        
        if (!state || !state.isRegistered) {
            CommandRegistrationUtils.logCommandOperation('warn', commandId, 'Command is not registered by this manager');
            return false;
        }

        // Use the enhanced safe unregister utility
        const success = await CommandRegistrationUtils.safeUnregister(commandId, state.disposable);
        
        if (success) {
            // Update state
            state.isRegistered = false;
            state.disposable = undefined;
            this.registeredCommands.set(commandId, state);
            
            CommandRegistrationUtils.logCommandOperation('info', commandId, 'Successfully unregistered command');
        } else {
            CommandRegistrationUtils.logCommandOperation('error', commandId, 'Failed to unregister command');
        }

        return success;
    }

    /**
     * Legacy method for backward compatibility
     */
    unregisterCommand(commandId: string): boolean {
        // Convert async call to sync for backward compatibility
        // Note: This is not ideal but maintains the existing interface
        this.safeUnregisterCommand(commandId).catch(error => {
            CommandRegistrationUtils.logCommandOperation('error', commandId, 'Error in legacy unregister method', error);
        });
        
        // Return based on current state
        const state = this.registeredCommands.get(commandId);
        return state?.isRegistered === false;
    }

    /**
     * Enhanced validation using utilities (kept for backward compatibility)
     */
    private validateCommandId(commandId: string): boolean {
        const validation = CommandRegistrationUtils.validateCommandId(commandId);
        
        // Additional check for configured prefix if specified
        if (validation.isValid && this.config.commandPrefix) {
            if (!commandId.startsWith(this.config.commandPrefix)) {
                return false;
            }
        }
        
        return validation.isValid;
    }

    /**
     * Get registration state for a command
     */
    getCommandState(commandId: string): CommandRegistrationState | undefined {
        return this.registeredCommands.get(commandId);
    }

    /**
     * Get all registered commands
     */
    getRegisteredCommands(): string[] {
        return Array.from(this.registeredCommands.keys()).filter(
            commandId => this.registeredCommands.get(commandId)?.isRegistered
        );
    }

    /**
     * Get registration statistics
     */
    getRegistrationStats(): {
        totalCommands: number;
        successfulRegistrations: number;
        failedRegistrations: number;
        averageAttempts: number;
    } {
        const states = Array.from(this.registeredCommands.values());
        const successful = states.filter(s => s.isRegistered).length;
        const failed = states.filter(s => !s.isRegistered && s.registrationAttempts > 0).length;
        const totalAttempts = states.reduce((sum, s) => sum + s.registrationAttempts, 0);
        
        return {
            totalCommands: states.length,
            successfulRegistrations: successful,
            failedRegistrations: failed,
            averageAttempts: states.length > 0 ? totalAttempts / states.length : 0
        };
    }

    /**
     * Get comprehensive diagnostic information for a command
     */
    async getDiagnosticInfo(commandId: string): Promise<DiagnosticInfo> {
        return CommandRegistrationUtils.createDiagnosticInfo(commandId, this.context || undefined);
    }

    /**
     * Get diagnostic information for all registered commands
     */
    async getAllDiagnostics(): Promise<Map<string, DiagnosticInfo>> {
        const diagnostics = new Map<string, DiagnosticInfo>();
        
        for (const commandId of this.registeredCommands.keys()) {
            try {
                const info = await this.getDiagnosticInfo(commandId);
                diagnostics.set(commandId, info);
            } catch (error) {
                CommandRegistrationUtils.logCommandOperation('error', commandId, 'Failed to get diagnostic info', error);
            }
        }
        
        return diagnostics;
    }

    /**
     * Validate all registered commands and return validation results
     */
    validateAllCommands(): Map<string, ValidationResult> {
        const results = new Map<string, ValidationResult>();
        
        for (const commandId of this.registeredCommands.keys()) {
            const validation = CommandRegistrationUtils.validateCommandId(commandId);
            results.set(commandId, validation);
            
            if (!validation.isValid) {
                CommandRegistrationUtils.logCommandOperation('warn', commandId, 'Command validation failed', validation.error?.message);
            }
        }
        
        return results;
    }

    /**
     * Attempt to recover failed command registrations
     */
    async recoverFailedCommands(): Promise<Map<string, boolean>> {
        const recoveryResults = new Map<string, boolean>();
        
        for (const [commandId, state] of this.registeredCommands) {
            if (!state.isRegistered && state.lastError) {
                CommandRegistrationUtils.logCommandOperation('info', commandId, 'Attempting recovery for failed command');
                
                try {
                    const recovery = await CommandRegistrationUtils.attemptRecovery(
                        commandId, 
                        state.lastError, 
                        this.context || undefined
                    );
                    
                    if (recovery.success) {
                        // Note: This method only checks if recovery is possible
                        // Actual re-registration would need the original callback
                        CommandRegistrationUtils.logCommandOperation('info', commandId, 'Recovery assessment completed', recovery.message);
                        recoveryResults.set(commandId, true);
                    } else {
                        CommandRegistrationUtils.logCommandOperation('warn', commandId, 'Recovery not possible', recovery.message);
                        recoveryResults.set(commandId, false);
                    }
                } catch (error) {
                    CommandRegistrationUtils.logCommandOperation('error', commandId, 'Recovery attempt failed', error);
                    recoveryResults.set(commandId, false);
                }
            }
        }
        
        return recoveryResults;
    }

    /**
     * Dispose all registered commands and clean up resources
     */
    dispose(): void {
        if (this.isDisposed) {
            return;
        }

        CommandRegistrationUtils.logCommandOperation('info', 'CommandManager', 'Starting disposal and cleanup of all registered commands');

        // Unregister all commands
        for (const [commandId, state] of this.registeredCommands) {
            if (state.isRegistered && state.disposable) {
                try {
                    state.disposable.dispose();
                    CommandRegistrationUtils.logCommandOperation('info', commandId, 'Successfully disposed command');
                } catch (error) {
                    CommandRegistrationUtils.logCommandOperation('error', commandId, 'Error disposing command', error);
                }
            }
        }

        // Clear all state
        this.registeredCommands.clear();
        this.context = null;
        this.isDisposed = true;

        CommandRegistrationUtils.logCommandOperation('info', 'CommandManager', 'CommandManager disposed successfully');
    }
}