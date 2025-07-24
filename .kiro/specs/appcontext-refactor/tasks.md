# Implementation Plan

- [x] 1. Create custom hooks infrastructure and base implementations

  - Set up hooks directory structure in src/contexts/hooks/
  - Create base hook interfaces and common patterns
  - Implement shared error handling utilities for hooks
  - _Requirements: 3.1, 3.7, 6.1, 6.2_

- [x] 2. Implement useMemberOperations hook

  - Create useMemberOperations hook with member CRUD operations
  - Extract addMember, updateMember, deactivateMember, deleteMember logic from AppContext
  - Implement proper loading states and error handling with notifications
  - Add unit tests for all member operations and error scenarios
  - _Requirements: 3.1, 3.7, 5.1, 5.2, 5.3, 8.1, 8.4_

- [x] 3. Implement useBillingOperations hook

  - Create useBillingOperations hook for payment and billing functionality
  - Extract billing-related operations from current implementation
  - Implement proper error handling and user feedback for billing operations
  - Add unit tests for billing operations and edge cases
  - _Requirements: 3.2, 3.7, 5.1, 5.2, 8.1, 8.4_

- [x] 4. Implement useAdminOperations hook

  - Create useAdminOperations hook for admin management functionality
  - Extract admin-specific operations and settings management
  - Implement proper error handling for admin operations
  - Add unit tests for admin operations
  - _Requirements: 3.3, 3.7, 5.1, 5.2, 8.1, 8.4_

- [x] 5. Implement useMemberDashboard hook

  - Create useMemberDashboard hook for member dashboard operations
  - Extract getMemberDashboard, getMemberRentHistory, getOtherActiveMembers logic
  - Implement setupMemberDashboardListeners functionality
  - Add unit tests for member dashboard operations
  - _Requirements: 3.4, 3.7, 5.1, 5.2, 8.1, 8.4_

- [x] 6. Implement useAuth hook

  - Create useAuth hook for authentication and account linking
  - Extract linkMemberAccount and authentication logic
  - Implement proper error handling for auth operations
  - Add unit tests for authentication operations
  - _Requirements: 3.5, 3.7, 5.1, 5.2, 8.1, 8.4_

- [x] 7. Implement usePaymentSettings hook

  - Create usePaymentSettings hook for fetch-when-needed UPI settings
  - Implement fetchPaymentSettings and updatePaymentSettings operations
  - Add proper caching and error handling for payment settings
  - Add unit tests for payment settings operations
  - _Requirements: 3.6, 3.7, 5.1, 5.2, 8.1, 8.4_

- [x] 8. Refactor AppContext to integrate custom hooks

  - Integrate all custom hooks into AppContext while preserving public interface
  - Remove extracted logic from AppContext, keeping only real-time subscriptions
  - Ensure AppContext file size is reduced to ~350 lines
  - Maintain all existing real-time functionality and error handling
  - _Requirements: 1.1, 1.2, 1.3, 2.1-2.11, 6.5, 9.1, 9.2, 9.3_

- [x] 9. Simplify service layer exports

  - Create new simplified src/contexts/services/index.ts with direct exports
  - Remove large FirestoreService aggregator object
  - Export individual service modules directly
  - Ensure service file is ~20 lines with simple exports only
  - _Requirements: 1.4, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 10. Update service imports in custom hooks

  - Update all custom hooks to use new simplified service imports
  - Remove any references to old FirestoreService aggregator
  - Ensure all service functionality remains unchanged
  - Verify no breaking changes in service usage
  - _Requirements: 4.1, 4.2, 4.3, 6.5, 9.1, 9.4_

- [x] 11. Implement comprehensive error handling improvements

  - Enhance error handling in all custom hooks with user-friendly messages
  - Implement exponential backoff retry mechanisms where appropriate
  - Add proper success notifications for all operations
  - Ensure offline state handling and auto-retry functionality
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 12. Add performance optimizations

  - Implement proper memoization with useCallback and useMemo in all hooks
  - Optimize AppContext value memoization to prevent unnecessary re-renders
  - Ensure proper cleanup functions for all real-time subscriptions
  - Add performance monitoring for hook operations
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 13. Create comprehensive test suite for hooks

  - Write unit tests for all custom hooks with proper mocking
  - Test error scenarios and edge cases for each hook
  - Create integration tests for hook interactions with AppContext
  - Ensure all existing functionality is covered by tests
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 14. Validate real-time functionality preservation

  - Test all real-time member data updates work correctly
  - Verify payment and billing real-time updates function properly
  - Ensure member dashboard real-time subscriptions work as expected
  - Test connection error handling and retry mechanisms
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11_

- [x] 15. Verify migration safety and backward compatibility

  - Ensure all existing component interfaces remain unchanged
  - Test that all current functionality works exactly as before
  - Verify no breaking changes in public APIs
  - Run full regression test suite to confirm no functionality loss
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [x] 16. Final code cleanup and optimization
  - Remove any unused imports and dead code
  - Ensure proper TypeScript types for all hook interfaces
  - Add displayName properties to all hooks for debugging
  - Verify total codebase reduction meets 37% target (~1470 to ~920 lines)
  - _Requirements: 1.1, 1.5, 6.1, 6.2, 6.3, 6.4, 6.6_
