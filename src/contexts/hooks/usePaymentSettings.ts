// /**
//  * usePaymentSettings Hook
//  *
//  * Custom hook for payment settings operations including:
//  * - Fetch-when-needed UPI payment settings
//  * - Update payment settings (UPI VPA)
//  * - Proper caching to avoid unnecessary fetches
//  * - Error handling and loading states
//  *
//  * Extracted from AppContext as part of the refactoring to improve code organization.
//  * Follows React patterns guidelines with proper error handling and loading states.
//  *
//  * Requirements: 3.6, 3.7, 5.1, 5.2, 8.1, 8.4
//  */

// import { useState, useCallback, useMemo } from 'react';
// import { notifications } from '@mantine/notifications';
// import { ConfigService } from '../services';
// import type { GlobalSettings } from '../../shared/types/firestore-types';
// import type { BaseHookReturn } from './types';
// import { HOOK_OPERATIONS, SUCCESS_MESSAGES, ERROR_NOTIFICATION, SUCCESS_NOTIFICATION } from './constants';

// /**
//  * Payment settings interface - subset of GlobalSettings focused on payment
//  */
// export interface PaymentSettings {
//   upiVpa: string;
//   // Future: Add more payment-related settings as needed
// }

// /**
//  * Return type for usePaymentSettings hook
//  */
// export interface UsePaymentSettingsReturn extends BaseHookReturn {
//   // Data
//   paymentSettings: PaymentSettings | null;

//   // Operations
//   fetchPaymentSettings: () => Promise<void>;
//   updatePaymentSettings: (settings: Partial<PaymentSettings>) => Promise<void>;

//   // State
//   isLoading: boolean;
//   error: string | null;

//   // Utilities
//   clearError: () => void;
//   refreshSettings: () => Promise<void>;
// }

// /**
//  * Custom hook for payment settings operations
//  *
//  * Provides fetch-when-needed payment settings functionality with proper caching,
//  * loading states, and error handling. Follows React best practices with memoized
//  * callbacks and proper error handling.
//  */
// export function usePaymentSettings(): UsePaymentSettingsReturn {
//   // Payment settings data state
//   const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);

//   // Loading state
//   const [isLoading, setIsLoading] = useState<boolean>(false);

//   // Error state
//   const [error, setError] = useState<string | null>(null);

//   // Track if settings have been fetched to implement caching
//   const [hasFetched, setHasFetched] = useState<boolean>(false);

//   // Generic error handler with user-friendly messages and notifications
//   const handleError = useCallback((error: unknown, operation: string) => {
//     console.error(`${operation} failed:`, error);

//     let errorMessage: string;
//     if (error instanceof Error) {
//       errorMessage = error.message;
//     } else if (typeof error === 'string') {
//       errorMessage = error;
//     } else {
//       errorMessage = `${operation} failed. Please try again.`;
//     }

//     setError(errorMessage);

//     // Show user notification
//     notifications.show({
//       ...ERROR_NOTIFICATION,
//       message: errorMessage,
//     });

//     return errorMessage;
//   }, []);

//   // Clear error state
//   const clearError = useCallback(() => {
//     setError(null);
//   }, []);

//   // Extract payment settings from global settings
//   const extractPaymentSettings = useCallback((globalSettings: GlobalSettings): PaymentSettings => {
//     return {
//       upiVpa: globalSettings.upiVpa,
//       // Future: Extract other payment-related settings
//     };
//   }, []);

//   // Fetch payment settings from global settings (with caching)
//   const fetchPaymentSettings = useCallback(async (): Promise<void> => {
//     // If already fetched and not loading, return cached data
//     if (hasFetched && paymentSettings && !isLoading) {
//       return;
//     }

//     setError(null);
//     setIsLoading(true);

//     try {
//       const globalSettings = await ConfigService.getGlobalSettings();
//       const extractedSettings = extractPaymentSettings(globalSettings);

//       setPaymentSettings(extractedSettings);
//       setHasFetched(true);

//       // Only show success notification on first fetch or explicit refresh
//       if (!hasFetched) {
//         notifications.show({
//           ...SUCCESS_NOTIFICATION,
//           message: 'Payment settings loaded successfully',
//         });
//       }
//     } catch (error) {
//       handleError(error, HOOK_OPERATIONS.FETCH_PAYMENT_SETTINGS);
//       throw error;
//     } finally {
//       setIsLoading(false);
//     }
//   }, [hasFetched, paymentSettings, isLoading, extractPaymentSettings, handleError]);

//   // Update payment settings
//   const updatePaymentSettings = useCallback(
//     async (settings: Partial<PaymentSettings>): Promise<void> => {
//       setError(null);
//       setIsLoading(true);

//       try {
//         // Validate UPI VPA format if provided
//         if (settings.upiVpa !== undefined) {
//           const upiVpaRegex = /^[a-zA-Z0-9.\-_+]+@[a-zA-Z0-9.\-_]+$/;
//           if (!upiVpaRegex.test(settings.upiVpa)) {
//             throw new Error('Invalid UPI VPA format. Please enter a valid UPI ID (e.g., user@bank)');
//           }
//         }

//         // Update global settings with payment settings changes
//         const globalSettingsUpdates: Partial<GlobalSettings> = {};
//         if (settings.upiVpa !== undefined) {
//           globalSettingsUpdates.upiVpa = settings.upiVpa;
//         }

//         await ConfigService.updateGlobalSettings(globalSettingsUpdates);

//         // Update local state with new settings
//         setPaymentSettings((prev) => ({
//           ...prev!,
//           ...settings,
//         }));

//         notifications.show({
//           ...SUCCESS_NOTIFICATION,
//           message: SUCCESS_MESSAGES.PAYMENT_SETTINGS_UPDATED,
//         });
//       } catch (error) {
//         handleError(error, HOOK_OPERATIONS.UPDATE_PAYMENT_SETTINGS);
//         throw error;
//       } finally {
//         setIsLoading(false);
//       }
//     },
//     [handleError]
//   );

//   // Refresh settings (force fetch from server)
//   const refreshSettings = useCallback(async (): Promise<void> => {
//     setHasFetched(false); // Reset cache flag to force fetch
//     await fetchPaymentSettings();
//   }, [fetchPaymentSettings]);

//   // Memoize return object to prevent unnecessary re-renders
//   return useMemo(
//     () => ({
//       // Data
//       paymentSettings,

//       // Operations
//       fetchPaymentSettings,
//       updatePaymentSettings,

//       // State
//       isLoading,
//       error,

//       // Utilities
//       clearError,
//       refreshSettings,
//     }),
//     [paymentSettings, fetchPaymentSettings, updatePaymentSettings, isLoading, error, clearError, refreshSettings]
//   );
// }

// // Set displayName for debugging
// usePaymentSettings.displayName = 'usePaymentSettings';
