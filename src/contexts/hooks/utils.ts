/**
 * Shared Hook Utilities
 *
 * Common utilities and helper functions for custom hooks.
 * Provides consistent error handling, retry mechanisms, offline detection, and notification patterns.
 */

import { useState, useCallback, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import type { BaseHookState, HookErrorHandler, HookErrorConfig, HookOperationResult, HookRetryConfig } from './types';

/**
 * Network status hook for offline detection
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Exponential backoff retry utility
 */
export async function retryWithBackoff<T>(operation: () => Promise<T>, config: HookRetryConfig = {}): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    shouldRetry = (_error: any) => true,
  } = config;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on last attempt or if shouldn't retry
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt), maxDelay);

      // Add jitter to prevent thundering herd
      const jitteredDelay = delay + Math.random() * 1000;

      console.warn(`Attempt ${attempt + 1} failed, retrying in ${jitteredDelay}ms:`, error);

      await new Promise((resolve) => setTimeout(resolve, jitteredDelay));
    }
  }

  throw lastError!;
}

/**
 * Creates a standardized hook state with loading and error management
 */
export function createHookState(initialLoading = false): [
  BaseHookState,
  {
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
  }
] {
  const [state, setState] = useState<BaseHookState>({
    isLoading: initialLoading,
    error: null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error, isLoading: false }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return [state, { setLoading, setError, clearError }];
}

/**
 * Enhanced error handler with network awareness and user-friendly messages
 */
export function useEnhancedErrorHandler(): HookErrorHandler {
  const isOnline = useNetworkStatus();

  return useCallback(
    (error: unknown, operation: string, config: HookErrorConfig = {}) => {
      const { showNotification = true, notificationTitle = 'Error', logError = true, customMessage } = config;

      // Log error for debugging
      if (logError) {
        console.error(`${operation} failed:`, error);
      }

      // Determine error message with network awareness
      let errorMessage: string;

      if (!isOnline) {
        errorMessage = 'You appear to be offline. Please check your internet connection and try again.';
      } else if (customMessage) {
        errorMessage = customMessage;
      } else if (error instanceof Error) {
        // Provide user-friendly messages for common errors
        if (error.message.includes('permission-denied')) {
          errorMessage = 'You do not have permission to perform this action.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'The operation timed out. Please try again.';
        } else if (error.message.includes('not-found')) {
          errorMessage = 'The requested data was not found.';
        } else {
          errorMessage = error.message;
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        errorMessage = `${operation} failed. Please try again.`;
      }

      // Show user notification
      if (showNotification) {
        notifications.show({
          title: notificationTitle,
          message: errorMessage,
          color: 'red',
          position: 'bottom-center',
          autoClose: isOnline ? 5000 : false, // Don't auto-close offline messages
        });
      }

      return errorMessage;
    },
    [isOnline]
  );
}

/**
 * Legacy error handler for backward compatibility
 */
export function useHookErrorHandler(): HookErrorHandler {
  return useEnhancedErrorHandler();
}

/**
 * Enhanced success notification with timing and context
 */
export function showSuccessNotification(message: string, title = 'Success', duration = 4000): void {
  notifications.show({
    title,
    message,
    color: 'green',
    position: 'bottom-center',
    autoClose: duration,
    icon: '✓',
  });
}

/**
 * Show operation progress notification
 */
export function showProgressNotification(message: string, title = 'Processing...', id?: string): string {
  const notificationId = id || `progress-${Date.now()}`;

  notifications.show({
    id: notificationId,
    title,
    message,
    color: 'blue',
    position: 'bottom-center',
    loading: true,
    autoClose: false,
  });

  return notificationId;
}

/**
 * Update progress notification to success or error
 */
export function updateNotification(id: string, success: boolean, message: string, title?: string): void {
  notifications.update({
    id,
    title: title || (success ? 'Success' : 'Error'),
    message,
    color: success ? 'green' : 'red',
    loading: false,
    autoClose: success ? 4000 : 7000,
    icon: success ? '✓' : '✗',
  });
}

/**
 * Utility for handling async operations with consistent error handling and loading states
 */
export function createAsyncOperation<T extends unknown[], R>(
  operation: (...args: T) => Promise<R>,
  operationName: string,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void,
  errorHandler: HookErrorHandler,
  successMessage?: string
) {
  return useCallback(
    async (...args: T): Promise<R> => {
      setError(null);
      setLoading(true);

      try {
        const result = await operation(...args);

        if (successMessage) {
          showSuccessNotification(successMessage);
        }

        return result;
      } catch (error) {
        const errorMessage = errorHandler(error, operationName);
        setError(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [operation, operationName, setLoading, setError, errorHandler, successMessage]
  );
}

/**
 * Utility for creating operation results with consistent structure
 */
export function createOperationResult<T>(
  success: boolean,
  operation: string,
  data?: T,
  error?: string
): HookOperationResult<T> {
  return {
    success,
    operation,
    data,
    error,
    timestamp: new Date(),
  };
}

/**
 * Utility for implementing exponential backoff retry logic
 */
export function createRetryWithBackoff(operation: () => Promise<void>, config: HookRetryConfig): () => Promise<void> {
  return async () => {
    let attempt = 0;
    const { maxRetries = 3, retryDelay = 1000, exponentialBackoff = true } = config;

    while (attempt < maxRetries) {
      try {
        await operation();
        return; // Success, exit retry loop
      } catch (error) {
        attempt++;

        if (attempt >= maxRetries) {
          throw error; // Max retries reached, throw the error
        }

        // Calculate delay for next attempt
        const delay = exponentialBackoff ? retryDelay * Math.pow(2, attempt - 1) : retryDelay;

        // Wait before next attempt
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  };
}

/**
 * Utility for managing cleanup functions in hooks
 * Note: This creates a cleanup manager instance. The returned functions
 * should be used within a hook context where they can be memoized if needed.
 */
export function createCleanupManager() {
  const cleanupFunctions: (() => void)[] = [];

  const addCleanup = (cleanup: () => void) => {
    cleanupFunctions.push(cleanup);
  };

  const runCleanup = () => {
    cleanupFunctions.forEach((cleanup) => {
      try {
        cleanup();
      } catch (error) {
        console.error('Cleanup function failed:', error);
      }
    });
    cleanupFunctions.length = 0; // Clear the array
  };

  return { addCleanup, runCleanup };
}

/**
 * Utility for validating hook parameters
 */
export function validateHookParams(params: Record<string, unknown>, requiredParams: string[]): void {
  const missingParams = requiredParams.filter((param) => params[param] === undefined || params[param] === null);

  if (missingParams.length > 0) {
    throw new Error(`Missing required parameters: ${missingParams.join(', ')}`);
  }
}

/**
 * Utility for creating stable memoized values in hooks
 * Note: This is a utility function that would typically be used within a hook
 * where useMemo is available. The dependencies parameter is for documentation.
 */
export function createStableValue<T>(value: T, _dependencies: unknown[]): T {
  // This is a placeholder for useMemo logic that would be used in actual hooks
  // The actual implementation would use useMemo with the provided dependencies
  // The underscore prefix indicates this parameter is intentionally unused in this implementation
  return value;
}
