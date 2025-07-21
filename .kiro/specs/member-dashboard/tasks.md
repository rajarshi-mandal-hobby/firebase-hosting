# Member Dashboard - Implementation Plan

## Phase 1: Refactor Existing Code Structure

- [x] 1. Reorganize file structure to follow feature-based architecture

  - Move `src/pages/MemberDashboard.tsx` to `src/features/member-dashboard/containers/MemberDashboard.tsx`
  - Create proper folder structure: `components/`, `hooks/`, `services/`, `types/`
  - Update import paths throughout the application
  - Ensure alignment with existing admin feature structure
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 2. Create missing custom hook `useMemberDashboardData`

  - Implement the hook referenced in existing MemberDashboard component
  - Add member data fetching, current month history, and friends data management
  - Integrate with AppContext for real-time data synchronization
  - Include proper loading states, error handling, and retry mechanisms
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 3. Extend AppContext for member dashboard functionality

  - Add member dashboard state management to existing AppContext
  - Implement member-specific operations (getMemberDashboard, getRentHistory)
  - Add real-time listeners for member dashboard data
  - Maintain consistency with existing admin functionality patterns
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

## Phase 2: Implement Missing Cloud Functions

- [x] 4. Add member dashboard Cloud Functions to existing member-operations.ts

  - Implement `getMemberDashboard` function for authenticated member data access
  - Add `getMemberCurrentMonth` function for current month rent details
  - Create `getOtherActiveMembers` function for friends directory
  - Ensure proper authentication and data filtering for member access
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [ ] 5. Implement FCM token management Cloud Function
  - Add `updateFCMToken` function for push notification support
  - Integrate with existing member authentication patterns
  - Add proper error handling and validation
  - Prepare foundation for future push notification features
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

## Phase 3: Create Missing Services

- [x] 6. Implement PaymentService for UPI integration

  - Create `src/features/member-dashboard/services/PaymentService.ts`
  - Add UPI URI generation with configurable settings from Firestore
  - Implement UPI app detection and fallback handling
  - Add payment instruction generation with screenshot requirements
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [x] 7. Extend firestoreService for member dashboard operations

  - Add member dashboard specific methods to existing firestoreService
  - Implement real-time listeners for member dashboard data
  - Add proper error handling and retry mechanisms
  - Maintain consistency with existing service architecture
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

## Phase 4: Refactor and Complete UI Components

- [ ] 8. Refactor existing MemberDashboard component

  - Break down monolithic component into smaller, focused components
  - Create separate components for profile, current rent, history, and friends sections
  - Implement proper component composition and data flow
  - Add missing error boundaries and loading states
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 9. Fix UPI payment integration

  - Update UPI URI generation to use PaymentService
  - Fix global settings integration for configurable UPI information
  - Implement proper payment button states and tooltips
  - Add mobile-optimized UPI payment flow
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [x] 10. Implement proper rent history functionality

  - Fix history loading mechanism with proper pagination
  - Add 12-month limit as specified in requirements
  - Implement accordion layout with proper bill breakdown
  - Add loading states and empty state handling
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [ ] 11. Complete friends directory implementation
  - Fix lazy loading implementation using React Suspense
  - Implement proper member filtering to exclude current user
  - Add clickable phone links and proper contact information display
  - Create loading states and empty friends list handling
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

## Phase 5: Authentication and Security

- [ ] 12. Implement authentication flow components

  - Create Google Sign-In component for unified login
  - Implement phone verification modal for account linking
  - Add OTP verification flow with proper error handling
  - Create secure session management and logout functionality
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_

- [ ] 13. Add security and privacy controls
  - Implement member data ownership verification through Firebase UID
  - Add secure authentication token handling for all API calls
  - Create session expiration handling with automatic logout
  - Implement data privacy controls and secure transmission
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

## Phase 6: Mobile Optimization and Polish

- [ ] 14. Implement responsive design and mobile optimization

  - Apply mobile-first responsive design using Mantine breakpoints
  - Optimize UPI payment flow for mobile devices
  - Implement touch-friendly interactions and navigation
  - Add mobile-appropriate loading states and error handling
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

- [ ] 15. Add comprehensive loading states and error handling
  - Implement Mantine Skeleton components for all dashboard sections
  - Add loading indicators for API calls and data operations
  - Create user-friendly error messages with retry functionality
  - Implement empty states with helpful guidance
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

## Phase 7: Testing and Integration

- [ ] 16. Create comprehensive test suite

  - Write unit tests for all custom hooks and services
  - Create component tests for dashboard sections
  - Add integration tests for data flow and user interactions
  - Implement error boundary testing and recovery scenarios
  - _Requirements: All requirements - comprehensive testing coverage_

- [ ] 17. Integration testing and final wiring
  - Test complete dashboard flow from authentication to data display
  - Verify real-time data synchronization across all components
  - Test UPI payment flow end-to-end with mobile integration
  - Validate responsive design across different screen sizes
  - Ensure proper error handling and recovery in all scenarios
  - _Requirements: All requirements - end-to-end integration_
