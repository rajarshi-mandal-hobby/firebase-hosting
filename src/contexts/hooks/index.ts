/**
 * Custom Hooks Index
 *
 * This file exports all custom hooks for the AppContext refactor.
 * Each hook follows React best practices and provides specific business logic.
 */

// Individual hook exports
export { useMemberOperations } from './useMemberOperations';
export type { UseMemberOperationsReturn } from './useMemberOperations';

export { useBillingOperations } from './useBillingOperations';
export type {
  UseBillingOperationsReturn,
  PaymentData,
  BulkBillsData,
  ExpenseData,
  BillingSummary,
} from './useBillingOperations';

export { useAdminOperations } from './useAdminOperations';
export type { UseAdminOperationsReturn } from './useAdminOperations';

export { useMemberDashboard } from './useMemberDashboard.simple';
export type {
  UseMemberDashboardReturn,
  MemberDashboardState,
  MemberDashboardLoadingState,
  MemberDashboardErrorState,
} from './useMemberDashboard.simple';

// Enhanced Member Dashboard Context
export {
  MemberDashboardProvider,
  useMemberDashboardData,
  useMemberDashboardActions,
  useMemberDashboardContext,
  PerformanceMonitor,
  PerformanceDashboard,
} from './MemberDashboardContext';
export type {
  MemberDashboardProviderProps,
  EnhancedMemberDashboardData,
  MemberDashboardActions,
  StabilizationOptions,
  UserType,
  DataScope,
} from './MemberDashboardContext';

export { usePaymentSettings } from './usePaymentSettings';
export type { UsePaymentSettingsReturn, PaymentSettings } from './usePaymentSettings';

export { useAuth } from './useAuth';
export type { UseAuthReturn, AuthResult } from './useAuth';

// Admin Dashboard Context
export {
  AdminDashboardProvider,
  useAdminDashboardData,
  useAdminDashboardActions,
  useAdminDashboardContext,
  AdminPerformanceMonitor,
  AdminPerformanceDashboard,
} from './AdminDashboardContext';
export type {
  AdminDashboardProviderProps,
  EnhancedAdminDashboardData,
  AdminDashboardActions,
  AdminDashboardState,
  AdminTab,
} from './AdminDashboardContext';
