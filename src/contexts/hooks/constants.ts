/**
 * Hook Constants and Configuration
 *
 * Shared constants and configuration values used across custom hooks.
 * Provides consistent behavior and easy configuration management.
 */

/**
 * Default retry configuration for hook operations
 */
export const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  exponentialBackoff: true,
} as const;

/**
 * Default error handling configuration
 */
export const DEFAULT_ERROR_CONFIG = {
  showNotification: true,
  notificationTitle: 'Error',
  logError: true,
  customMessage: undefined,
} as const;

/**
 * Notification configuration following project standards
 */
export const NOTIFICATION_CONFIG = {
  position: 'bottom-center' as const,
  autoClose: 5000,
  withCloseButton: true,
} as const;

/**
 * Success notification colors and styling
 */
export const SUCCESS_NOTIFICATION = {
  color: 'green',
  title: 'Success',
  ...NOTIFICATION_CONFIG,
} as const;

/**
 * Error notification colors and styling
 */
export const ERROR_NOTIFICATION = {
  color: 'red',
  title: 'Error',
  ...NOTIFICATION_CONFIG,
} as const;

/**
 * Loading state timeouts (in milliseconds)
 */
export const LOADING_TIMEOUTS = {
  DEFAULT_OPERATION: 30000, // 30 seconds
  QUICK_OPERATION: 10000, // 10 seconds
  LONG_OPERATION: 60000, // 1 minute
} as const;

/**
 * Hook operation types for consistent naming
 */
export const HOOK_OPERATIONS = {
  // Member operations
  ADD_MEMBER: 'Add member',
  UPDATE_MEMBER: 'Update member',
  DEACTIVATE_MEMBER: 'Deactivate member',
  DELETE_MEMBER: 'Delete member',
  FETCH_INACTIVE_MEMBERS: 'Fetch inactive members',

  // Billing operations
  RECORD_PAYMENT: 'Record payment',
  GENERATE_BILLS: 'Generate bills',
  RECORD_EXPENSE: 'Record expense',

  // Admin operations
  UPDATE_SETTINGS: 'Update settings',
  MANAGE_ADMINS: 'Manage admins',
  GENERATE_REPORTS: 'Generate reports',

  // Member dashboard operations
  GET_MEMBER_DASHBOARD: 'Get member dashboard',
  GET_RENT_HISTORY: 'Get rent history',
  GET_OTHER_MEMBERS: 'Get other members',
  UPDATE_FCM_TOKEN: 'Update FCM token',

  // Auth operations
  LINK_ACCOUNT: 'Link member account',
  VERIFY_AUTH: 'Verify authentication',

  // Payment settings operations
  FETCH_PAYMENT_SETTINGS: 'Fetch payment settings',
  UPDATE_PAYMENT_SETTINGS: 'Update payment settings',

  // General operations
  REFRESH_DATA: 'Refresh data',
  RETRY_CONNECTION: 'Retry connection',
  SETUP_LISTENERS: 'Setup listeners',
} as const;

/**
 * Hook state keys for consistent state management
 */
export const HOOK_STATE_KEYS = {
  IS_LOADING: 'isLoading',
  ERROR: 'error',
  DATA: 'data',
  LAST_OPERATION: 'lastOperation',
  OPERATION_RESULT: 'operationResult',
} as const;

/**
 * Validation error messages
 */
export const VALIDATION_ERRORS = {
  REQUIRED_PARAM: 'Required parameter is missing',
  INVALID_PARAM: 'Parameter value is invalid',
  INVALID_FORMAT: 'Parameter format is invalid',
  OPERATION_FAILED: 'Operation failed to complete',
  NETWORK_ERROR: 'Network connection error',
  PERMISSION_DENIED: 'Permission denied',
  NOT_FOUND: 'Resource not found',
  TIMEOUT: 'Operation timed out',
} as const;

/**
 * Success messages for common operations
 */
export const SUCCESS_MESSAGES = {
  // Member operations
  MEMBER_ADDED: 'Member added successfully',
  MEMBER_UPDATED: 'Member updated successfully',
  MEMBER_DEACTIVATED: 'Member deactivated successfully',
  MEMBER_DELETED: 'Member deleted successfully',

  // Billing operations
  PAYMENT_RECORDED: 'Payment recorded successfully',
  BILLS_GENERATED: 'Bills generated successfully',
  EXPENSE_RECORDED: 'Expense recorded successfully',

  // Admin operations
  SETTINGS_UPDATED: 'Settings updated successfully',
  ADMIN_UPDATED: 'Admin settings updated successfully',
  REPORT_GENERATED: 'Report generated successfully',

  // Auth operations
  ACCOUNT_LINKED: 'Account linked successfully',
  AUTH_VERIFIED: 'Authentication verified successfully',

  // Payment settings operations
  PAYMENT_SETTINGS_UPDATED: 'Payment settings updated successfully',

  // General operations
  DATA_REFRESHED: 'Data refreshed successfully',
  CONNECTION_RESTORED: 'Connection restored successfully',
} as const;

/**
 * Hook cleanup timeouts
 */
export const CLEANUP_TIMEOUTS = {
  SUBSCRIPTION_CLEANUP: 100, // 100ms delay for subscription cleanup
  STATE_RESET: 50, // 50ms delay for state reset
  EFFECT_CLEANUP: 0, // Immediate cleanup for effects
} as const;

/**
 * Performance monitoring thresholds
 */
export const PERFORMANCE_THRESHOLDS = {
  SLOW_OPERATION: 2000, // 2 seconds
  VERY_SLOW_OPERATION: 5000, // 5 seconds
  TIMEOUT_WARNING: 10000, // 10 seconds
} as const;
