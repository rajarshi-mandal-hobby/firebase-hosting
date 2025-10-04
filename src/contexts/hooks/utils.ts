/**
 * Shared Hook Utilities
 *
 * Common utilities and helper functions for custom hooks.
 * Provides consistent error handling, retry mechanisms, offline detection, and notification patterns.
 */

import type { HookErrorHandler, HookErrorConfig } from './types';
import { notify } from '../../utils/notifications';

/**
 * Enhanced error handler with network awareness and user-friendly messages
 */
const useEnhancedErrorHandler = (): HookErrorHandler => {
  return (error: unknown, operation: string, config: HookErrorConfig = {}) => {
    const { showNotification = true, notificationTitle = 'Oops!', logError = true, customMessage } = config;

    // Log error for debugging
    if (logError) {
      console.error(`${operation} failed:`, error);
    }

    // Determine error message with network awareness
    let errorMessage: string;

    if (error instanceof Error) {
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
    } else if (customMessage) {
      errorMessage = customMessage;
    } else {
      errorMessage = `${operation} failed. Please try again.`;
    }

    // Show user notification
    if (showNotification) {
      notify(errorMessage, { title: notificationTitle, type: 'error' });
    }

    return errorMessage;
  };
};

/**
 * Legacy error handler for backward compatibility
 */
export default useEnhancedErrorHandler;
