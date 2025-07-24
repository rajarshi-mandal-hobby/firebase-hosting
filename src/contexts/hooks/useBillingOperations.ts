/**
 * useBillingOperations Hook
 *
 * Custom hook for payment and billing functionality with proper error handling and loading states.
 * Extracted from AppContext as part of the refactoring to improve code organization.
 *
 * Requirements: 3.2, 3.7, 5.1, 5.2, 8.1, 8.4
 */

import { useState, useCallback, useMemo } from 'react';
import { BillingService } from '../services';
import { notifications } from '@mantine/notifications';
import type { ElectricBill, RentHistory } from '../../shared/types/firestore-types';
import type { BaseHookReturn } from './types';
import { HOOK_OPERATIONS, SUCCESS_MESSAGES } from './constants';

/**
 * Payment data interface for recording payments
 */
export interface PaymentData {
  memberId: string;
  month: string; // YYYY-MM format
  amount: number;
  note?: string;
}

/**
 * Bulk bill generation parameters
 */
export interface BulkBillsData {
  billingMonth: string; // YYYY-MM format
  floorElectricity: {
    '2nd': number;
    '3rd': number;
  };
  floorMemberCounts: {
    '2nd': number;
    '3rd': number;
  };
  bulkExpenses?: {
    memberIds: string[];
    amount: number;
    description: string;
  }[];
  wifiCharges?: {
    memberIds: string[];
    amount: number;
  };
}

/**
 * Ad-hoc expense data interface
 */
export interface ExpenseData {
  memberIds: string[];
  amount: number;
  description: string;
  month?: string; // YYYY-MM format, defaults to current month
}

/**
 * Billing summary response interface
 */
export interface BillingSummary {
  totalActiveMembers: number;
  totalDue: number;
  totalPaid: number;
  totalOutstanding: number;
  billingStatsByStatus: {
    Due: number;
    Paid: number;
    'Partially Paid': number;
    Overpaid: number;
  };
}

/**
 * Return type for useBillingOperations hook
 */
export interface UseBillingOperationsReturn extends BaseHookReturn {
  // Operations
  recordPayment: (data: PaymentData) => Promise<RentHistory>;
  generateBulkBills: (data: BulkBillsData) => Promise<{
    totalMembersProcessed: number;
    totalChargesGenerated: number;
    electricBillId: string;
  }>;
  recordAdHocExpense: (data: ExpenseData) => Promise<void>;
  getCurrentElectricBill: () => Promise<ElectricBill | null>;
  getBillingSummary: () => Promise<BillingSummary>;

  // State
  isLoading: boolean;
  error: string | null;

  // Utilities
  clearError: () => void;
}

/**
 * Custom hook for billing operations
 *
 * Provides billing and payment operations with proper loading states and error handling.
 * Follows React best practices with memoized callbacks and proper error handling.
 */
export function useBillingOperations(): UseBillingOperationsReturn {
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Error handler with user-friendly messages and notifications
  const handleError = useCallback((error: unknown, operation: string) => {
    console.error(`${operation} failed:`, error);

    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      errorMessage = `${operation} failed. Please try again.`;
    }

    setError(errorMessage);

    // Show user notification
    notifications.show({
      title: 'Error',
      message: errorMessage,
      color: 'red',
      position: 'bottom-center',
    });

    return errorMessage;
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Record payment operation
  const recordPayment = useCallback(
    async (data: PaymentData): Promise<RentHistory> => {
      setError(null);
      setIsLoading(true);

      try {
        // Validate payment data
        if (!data.memberId) {
          throw new Error('Member ID is required');
        }
        if (!data.month) {
          throw new Error('Billing month is required');
        }
        if (data.amount <= 0) {
          throw new Error('Payment amount must be greater than 0');
        }

        const result = await BillingService.recordPayment({
          memberId: data.memberId,
          month: data.month,
          amount: data.amount,
          note: data.note,
        });

        notifications.show({
          title: 'Success',
          message: `${SUCCESS_MESSAGES.PAYMENT_RECORDED} - ₹${data.amount.toLocaleString()}`,
          color: 'green',
          position: 'bottom-center',
        });

        return result;
      } catch (error) {
        handleError(error, HOOK_OPERATIONS.RECORD_PAYMENT);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError]
  );

  // Generate bulk bills operation
  const generateBulkBills = useCallback(
    async (
      data: BulkBillsData
    ): Promise<{
      totalMembersProcessed: number;
      totalChargesGenerated: number;
      electricBillId: string;
    }> => {
      setError(null);
      setIsLoading(true);

      try {
        // Validate bulk bills data
        if (!data.billingMonth) {
          throw new Error('Billing month is required');
        }
        if (data.floorElectricity['2nd'] < 0 || data.floorElectricity['3rd'] < 0) {
          throw new Error('Electricity charges cannot be negative');
        }
        if (data.floorMemberCounts['2nd'] < 0 || data.floorMemberCounts['3rd'] < 0) {
          throw new Error('Member counts cannot be negative');
        }

        const result = await BillingService.generateBulkBills(data);

        notifications.show({
          title: 'Success',
          message: `${SUCCESS_MESSAGES.BILLS_GENERATED} - ${result.totalMembersProcessed} members processed`,
          color: 'green',
          position: 'bottom-center',
        });

        return result;
      } catch (error) {
        handleError(error, HOOK_OPERATIONS.GENERATE_BILLS);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError]
  );

  // Record ad-hoc expense operation
  const recordAdHocExpense = useCallback(
    async (data: ExpenseData): Promise<void> => {
      setError(null);
      setIsLoading(true);

      try {
        // Validate expense data
        if (!data.memberIds || data.memberIds.length === 0) {
          throw new Error('At least one member must be selected');
        }
        if (data.amount <= 0) {
          throw new Error('Expense amount must be greater than 0');
        }
        if (!data.description || data.description.trim() === '') {
          throw new Error('Expense description is required');
        }

        // Use current month if not provided
        const month = data.month || new Date().toISOString().slice(0, 7);

        // For ad-hoc expenses, we'll use the bulk bills generation with only expenses
        await BillingService.generateBulkBills({
          billingMonth: month,
          floorElectricity: { '2nd': 0, '3rd': 0 },
          floorMemberCounts: { '2nd': 0, '3rd': 0 },
          bulkExpenses: [
            {
              memberIds: data.memberIds,
              amount: data.amount,
              description: data.description,
            },
          ],
        });

        notifications.show({
          title: 'Success',
          message: `${SUCCESS_MESSAGES.EXPENSE_RECORDED} - ₹${data.amount.toLocaleString()} for ${
            data.memberIds.length
          } member(s)`,
          color: 'green',
          position: 'bottom-center',
        });
      } catch (error) {
        handleError(error, HOOK_OPERATIONS.RECORD_EXPENSE);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError]
  );

  // Get current electric bill operation
  const getCurrentElectricBill = useCallback(async (): Promise<ElectricBill | null> => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await BillingService.getCurrentElectricBill();
      return result;
    } catch (error) {
      handleError(error, 'Get current electric bill');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  // Get billing summary operation
  const getBillingSummary = useCallback(async (): Promise<BillingSummary> => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await BillingService.getBillingSummary();
      return result;
    } catch (error) {
      handleError(error, 'Get billing summary');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  // Memoize return object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      // Operations
      recordPayment,
      generateBulkBills,
      recordAdHocExpense,
      getCurrentElectricBill,
      getBillingSummary,

      // State
      isLoading,
      error,

      // Utilities
      clearError,
    }),
    [
      recordPayment,
      generateBulkBills,
      recordAdHocExpense,
      getCurrentElectricBill,
      getBillingSummary,
      isLoading,
      error,
      clearError,
    ]
  );
}

// Set displayName for debugging
useBillingOperations.displayName = 'useBillingOperations';
