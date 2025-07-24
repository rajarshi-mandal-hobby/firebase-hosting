/**
 * Base Hook Types and Interfaces
 *
 * Common types and interfaces used across all custom hooks in the AppContext refactor.
 * These types ensure consistency and provide proper TypeScript support.
 */

/**
 * Base state interface that all custom hooks should implement
 */
export interface BaseHookState {
  isLoading: boolean;
  error: string | null;
}

/**
 * Extended hook state for operations that need to track specific operation types
 */
export interface ExtendedHookState extends BaseHookState {
  lastOperation?: string;
  operationResult?: unknown;
}

/**
 * Loading state for hooks that manage multiple loading states
 */
export interface HookLoadingState {
  [key: string]: boolean;
}

/**
 * Error handler function type for consistent error handling across hooks
 */
export type HookErrorHandler = (error: unknown, operation: string, config?: HookErrorConfig) => string;

/**
 * Hook cleanup function type for managing subscriptions and cleanup
 */
export type HookCleanupFunction = () => void;

/**
 * Generic hook return type that all custom hooks should extend
 */
export interface BaseHookReturn extends BaseHookState {
  clearError: () => void;
}

/**
 * Configuration options for hook error handling
 */
export interface HookErrorConfig {
  showNotification?: boolean;
  notificationTitle?: string;
  logError?: boolean;
  customMessage?: string;
}

/**
 * Hook operation result for tracking operation outcomes
 */
export interface HookOperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  operation: string;
  timestamp: Date;
}

/**
 * Retry configuration for hook operations with enhanced options
 */
export interface HookRetryConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  shouldRetry?: (error: any) => boolean;
  retryDelay?: number; // For backward compatibility
  exponentialBackoff?: boolean; // For backward compatibility
}

/**
 * Hook subscription configuration for real-time operations
 */
export interface HookSubscriptionConfig {
  autoCleanup: boolean;
  errorRetry: boolean;
  retryConfig?: HookRetryConfig;
}
