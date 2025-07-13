/**
 * Service Utilities
 * 
 * Common utilities and helpers for service operations.
 * Includes error handling, validation, and simulation helpers.
 */

import type {
  ApplicationError,
  FirestoreError,
  AuthError,
  ValidationError,
  BusinessError,
} from '../../shared/types/firestore-types';

// Custom error class for service operations
export class ServiceError extends Error {
  public code: string;
  public details?: unknown;
  
  constructor(
    code: string,
    message: string,
    details?: unknown
  ) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.details = details;
  }
}

// Network simulation helpers
export const simulateNetworkDelay = (minMs = 200, maxMs = 800): Promise<void> => {
  const delay = Math.random() * (maxMs - minMs) + minMs;
  return new Promise(resolve => setTimeout(resolve, delay));
};

export const simulateRandomError = (errorRate = 0.05): void => {
  if (Math.random() < errorRate) {
    throw new ServiceError(
      'network-error',
      'Simulated network error - please retry'
    );
  }
};

// ID generators
export const generateId = (prefix: string = 'id'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const generateMemberId = (): string => generateId('member');
export const generatePaymentId = (): string => generateId('payment');
export const generateExpenseId = (): string => generateId('expense');

// Validation helpers
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+91\d{10}$/;
  return phoneRegex.test(phone);
};

export const validateBillingMonth = (month: string): boolean => {
  const monthRegex = /^\d{4}-\d{2}$/;
  if (!monthRegex.test(month)) return false;
  
  const [year, monthNum] = month.split('-').map(Number);
  return year >= 2020 && year <= 2030 && monthNum >= 1 && monthNum <= 12;
};

export const validateAmount = (amount: number): boolean => {
  return amount >= 0 && Number.isFinite(amount);
};

// Date/Time utilities
export const getCurrentBillingMonth = (): string => {
  return new Date().toISOString().slice(0, 7);
};

export const getNextBillingMonth = (): string => {
  const current = new Date();
  current.setMonth(current.getMonth() + 1);
  return current.toISOString().slice(0, 7);
};

export const formatBillingMonth = (billingMonth: string): string => {
  const [year, month] = billingMonth.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long' });
};

// Currency formatting
export const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

// Error creation helpers
export const createFirestoreError = (
  code: FirestoreError['code'],
  message: string,
  details?: unknown
): FirestoreError => ({
  code,
  message,
  details,
  timestamp: new Date(),
  firestoreCode: code.split('/')[1],
});

export const createAuthError = (
  code: AuthError['code'],
  message: string,
  details?: unknown
): AuthError => ({
  code,
  message,
  details,
  timestamp: new Date(),
});

export const createValidationError = (
  code: ValidationError['code'],
  message: string,
  field?: string,
  details?: unknown
): ValidationError => ({
  code,
  message,
  field,
  details,
  timestamp: new Date(),
});

export const createBusinessError = (
  code: BusinessError['code'],
  message: string,
  details?: unknown
): BusinessError => ({
  code,
  message,
  details,
  timestamp: new Date(),
});

// Result wrapper helpers
export const success = <T>(data: T) => ({ success: true as const, data });
export const failure = <E extends ApplicationError>(error: E) => ({ success: false as const, error });

// Common service response types
export interface ServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApplicationError;
  message?: string;
}

// Pagination helpers
export interface PaginationOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  nextOffset?: number;
}

export const paginateArray = <T>(
  array: T[],
  options: PaginationOptions = {}
): PaginatedResult<T> => {
  const { limit = 10, offset = 0, sortBy, sortOrder = 'desc' } = options;
  
  let sortedArray = [...array];
  
  if (sortBy) {
    sortedArray = sortedArray.sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortBy];
      const bVal = (b as Record<string, unknown>)[sortBy];
      
      if (sortOrder === 'asc') {
        return String(aVal) > String(bVal) ? 1 : -1;
      } else {
        return String(aVal) < String(bVal) ? 1 : -1;
      }
    });
  }
  
  const startIndex = offset;
  const endIndex = startIndex + limit;
  const items = sortedArray.slice(startIndex, endIndex);
  
  return {
    items,
    total: array.length,
    hasMore: endIndex < array.length,
    nextOffset: endIndex < array.length ? endIndex : undefined,
  };
};

// Search helpers
export const searchInFields = <T extends Record<string, unknown>>(
  items: T[],
  query: string,
  fields: (keyof T)[]
): T[] => {
  const searchTerm = query.toLowerCase().trim();
  if (!searchTerm) return items;
  
  return items.filter(item =>
    fields.some(field => {
      const value = item[field];
      return value && value.toString().toLowerCase().includes(searchTerm);
    })
  );
};

// Statistics helpers
export const calculateSum = <T>(items: T[], getValue: (item: T) => number): number => {
  return items.reduce((sum, item) => sum + getValue(item), 0);
};

export const calculateAverage = <T>(items: T[], getValue: (item: T) => number): number => {
  if (items.length === 0) return 0;
  return calculateSum(items, getValue) / items.length;
};

export const groupBy = <T, K extends string | number | symbol>(
  items: T[],
  getKey: (item: T) => K
): Record<K, T[]> => {
  return items.reduce((groups, item) => {
    const key = getKey(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<K, T[]>);
};

// Deep clone helper for immutability
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (Array.isArray(obj)) return obj.map(deepClone) as unknown as T;
  
  const cloned = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
};

// Retry mechanism for operations
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError!;
};
