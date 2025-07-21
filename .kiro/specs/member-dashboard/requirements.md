# Member Dashboard - Requirements Document

## Introduction

The Member Dashboard feature provides a comprehensive self-service portal for rent management application members. This feature enables members to view their personal rent information, payment history, make UPI payments, and interact with the community through a friends directory. The system integrates with Firebase Firestore for real-time data synchronization, AppContext for state management, and includes a complete service layer architecture with proper folder structure organization.

## Requirements

### Requirement 1

**User Story:** As a member, I want to access my personal dashboard through secure authentication, so that I can view my rent information and manage my account safely.

#### Acceptance Criteria

1. WHEN a member visits the application THEN the system SHALL display a unified login page with Google Sign-In
2. WHEN member completes Google authentication THEN the system SHALL verify their identity through Firebase Auth tokens
3. WHEN member account is not linked THEN the system SHALL display phone verification modal for account linking
4. WHEN member enters registered phone number THEN the system SHALL initiate OTP verification process
5. WHEN OTP verification succeeds THEN the system SHALL link Google account to member record and grant dashboard access
6. WHEN member account is already linked THEN the system SHALL redirect directly to member dashboard
7. WHEN authentication fails THEN the system SHALL display clear error messages and retry options
8. WHEN using Firebase emulator THEN the system SHALL transition from mock user data to actual Firebase functions
9. WHEN authentication is implemented later THEN the system SHALL maintain proper documentation for future Google Auth + account linking integration

### Requirement 2

**User Story:** As a member, I want to view my personal information in a clean, organized dashboard, so that I can easily access my account details and rent status.

#### Acceptance Criteria

1. WHEN member accesses dashboard THEN the system SHALL display header with member avatar, name, email, and sign-out button
2. WHEN viewing collapsible "My Details" section THEN the system SHALL show phone (clickable tel: link), floor and bed type, move-in date, current rent, rent at joining, advance deposit, security deposit, total agreed deposit, and WiFi status
3. WHEN "My Details" section is collapsed by default THEN the system SHALL allow expansion to view complete member information
4. WHEN member data changes THEN the system SHALL update profile information in real-time using Firestore listeners
5. WHEN phone number is displayed THEN the system SHALL format it as clickable tel: link for easy dialing
6. WHEN displaying financial information THEN the system SHALL show current rent, rent at joining, advance deposit, security deposit, and total agreed deposit with proper currency formatting
7. WHEN displaying member data THEN the system SHALL show exactly the same data as shown in existing MemberDashboard.tsx component, nothing more or less

### Requirement 3

**User Story:** As a member, I want to view my current month's rent details with complete breakdown, so that I can understand my charges and payment status.

#### Acceptance Criteria

1. WHEN viewing current month section THEN the system SHALL display "Rent for [Month Year]" title with formatted month name
2. WHEN viewing bill breakdown THEN the system SHALL show rent, electricity, WiFi, expenses (with descriptions), total charges, amount paid, and outstanding balance
3. WHEN member has outstanding balance THEN the system SHALL display UPI payment button with "Pay ₹[amount]" text and UPI/QR code icons
4. WHEN member has paid or overpaid status THEN the system SHALL disable UPI payment button
5. WHEN viewing expenses THEN the system SHALL show individual expense items with descriptions and amounts in nested list format
6. WHEN bill status changes THEN the system SHALL display status alert with appropriate color, icon, title, and message
7. WHEN payment is due THEN the system SHALL show instruction "Send screenshot to Rajarshi for confirmation"
8. WHEN UPI button is hovered THEN the system SHALL display tooltip explaining UPI payment process and screenshot requirement

### Requirement 4

**User Story:** As a member, I want to make rent payments through UPI integration, so that I can pay my bills conveniently using mobile payment apps.

#### Acceptance Criteria

1. WHEN member clicks UPI payment button THEN the system SHALL generate UPI payment URI with correct payment details
2. WHEN UPI URI is generated THEN the system SHALL include admin's UPI ID, member name, billing month, and exact amount
3. WHEN member initiates UPI payment THEN the system SHALL open device's default UPI app or show app selection dialog
4. WHEN UPI payment is completed THEN the system SHALL provide instructions to send screenshot to admin for verification
5. WHEN UPI payment details are generated THEN the system SHALL use configurable global settings for admin UPI information (upiVpa from globalSettings)
6. WHEN UPI URI is generated THEN the system SHALL use configurable payee name from global settings instead of hardcoded "Rajarshi"
7. WHEN member has zero balance THEN the system SHALL hide UPI payment button
8. WHEN UPI app is not available THEN the system SHALL display helpful message with alternative payment instructions

### Requirement 5

**User Story:** As a member, I want to view my complete rent history with pagination, so that I can track my payment patterns and billing details over time.

#### Acceptance Criteria

1. WHEN member clicks "Show History (12 Months)" button THEN the system SHALL load and display historical rent data in accordion format
2. WHEN history is loaded THEN the system SHALL display up to 12 months of rent history excluding current month (slice 1-13 from history array)
3. WHEN viewing history accordion items THEN the system SHALL show formatted month/year, status badge icon, and outstanding balance in headers
4. WHEN expanding history item THEN the system SHALL show complete bill breakdown using RentDetailsList component with rent, electricity, WiFi, expenses, total charges, amount paid, outstanding balance, and notes
5. WHEN history button shows loading THEN the system SHALL display loading spinner on button during data fetch
6. WHEN history data is empty THEN the system SHALL handle empty state appropriately
7. WHEN history is already loaded THEN the system SHALL not reload data on subsequent button clicks unless there are more to show

### Requirement 6

**User Story:** As a member, I want to view other active members in a friends directory, so that I can connect with my community and access contact information.

#### Acceptance Criteria

1. WHEN member switches to "Friends" tab THEN the system SHALL display "Active Friends" title and list of other active members
2. WHEN viewing friends list THEN the system SHALL show member avatar, name, clickable phone number (tel: link), floor, and bed type for each friend
3. WHEN member data is filtered THEN the system SHALL exclude current member from friends list using linkedMemberId
4. WHEN friends data is loading THEN the system SHALL display loading spinner with "Loading friends..." message
5. WHEN friends section is lazy loaded THEN the system SHALL use React Suspense with loading fallback
6. WHEN friends data changes THEN the system SHALL auto-load friends data when tab is accessed and not already loaded
7. WHEN using segmented control THEN the system SHALL limit navigation to only "Me" and "Friends" tabs
8. WHEN no other members exist THEN the system SHALL display empty friends list

### Requirement 7

**User Story:** As a member, I want the dashboard to integrate with AppContext and Firebase Cloud Functions, so that I have consistent data access and proper backend integration.

#### Acceptance Criteria

1. WHEN dashboard loads THEN the system SHALL use AppContext for centralized state management and Firebase Cloud Function calls
2. WHEN member data changes THEN the system SHALL use Firestore onSnapshot listeners through AppContext for real-time updates
3. WHEN making API calls THEN the system SHALL use AppContext methods to call Firebase Cloud Functions for backend operations
4. WHEN caching is needed THEN the system SHALL use React cache mechanisms integrated with AppContext
5. WHEN real-time updates occur THEN the system SHALL propagate changes through AppContext to all dashboard components
6. WHEN using Firebase emulator THEN the system SHALL connect to local Firestore emulator and Cloud Functions emulator for development
7. WHEN network errors occur THEN the system SHALL use AppContext retry mechanisms with exponential backoff
8. WHEN authentication state changes THEN the system SHALL update AppContext and redirect appropriately

### Requirement 8

**User Story:** As a member, I want the dashboard to use a proper service layer architecture, so that data access is organized, maintainable, and follows best practices.

#### Acceptance Criteria

1. WHEN dashboard makes API calls THEN the system SHALL use dedicated service layer functions
2. WHEN accessing member data THEN the system SHALL use MemberDashboardService for all member-related operations
3. WHEN making payment operations THEN the system SHALL use PaymentService for UPI generation
4. WHEN handling authentication THEN the system SHALL use AuthService for login, logout, and account linking
5. WHEN service calls fail THEN the system SHALL provide consistent error handling and retry mechanisms
6. WHEN caching is needed THEN the system SHALL implement appropriate caching strategies in service layer

### Requirement 9

**User Story:** As a member, I want the dashboard to follow proper folder structure organization, so that the codebase is maintainable and follows React best practices.

#### Acceptance Criteria

1. WHEN organizing dashboard components THEN the system SHALL follow feature-based folder structure
2. WHEN creating dashboard components THEN the system SHALL separate containers, components, hooks, and services
3. WHEN implementing shared functionality THEN the system SHALL use shared components and utilities
4. WHEN managing types THEN the system SHALL use centralized type definitions with proper imports
5. WHEN organizing styles THEN the system SHALL use Mantine theme system with consistent styling patterns
6. WHEN creating custom hooks THEN the system SHALL follow React 19 patterns and naming conventions
7. WHEN implementing services THEN the system SHALL organize by domain with clear separation of concerns

### Requirement 10

**User Story:** As a member, I want the dashboard to integrate with Firebase Cloud Functions, so that backend operations are secure, validated, and properly handled.

#### Acceptance Criteria

1. WHEN fetching dashboard data THEN the system SHALL call getMemberDashboard Cloud Function with proper authentication
2. WHEN loading rent history THEN the system SHALL call getMemberRentHistory Cloud Function with pagination support
3. WHEN updating FCM tokens THEN the system SHALL call updateFCMToken Cloud Function for notification management
4. WHEN linking accounts THEN the system SHALL call linkMemberAccount Cloud Function with OTP verification
5. WHEN Cloud Function calls fail THEN the system SHALL handle errors gracefully with user-friendly messages
6. WHEN authentication tokens expire THEN the system SHALL refresh tokens automatically and retry operations
7. WHEN rate limiting occurs THEN the system SHALL implement appropriate backoff strategies

### Requirement 11

**User Story:** As a member, I want responsive design optimized for mobile devices, so that I can access my dashboard conveniently on any device.

#### Acceptance Criteria

1. WHEN accessing dashboard on mobile THEN the system SHALL display mobile-optimized layout with touch-friendly interactions
2. WHEN viewing on different screen sizes THEN the system SHALL use responsive breakpoints for optimal display
3. WHEN using UPI payments THEN the system SHALL provide mobile-first payment experience
4. WHEN navigating between sections THEN the system SHALL use mobile-appropriate navigation patterns
5. WHEN displaying data tables THEN the system SHALL use mobile-friendly accordion or card layouts
6. WHEN loading content THEN the system SHALL show appropriate loading states optimized for mobile
7. WHEN errors occur THEN the system SHALL display mobile-friendly error messages and recovery options

### Requirement 12

**User Story:** As a member, I want proper loading states and error handling, so that I have a smooth user experience even when network issues occur.

#### Acceptance Criteria

1. WHEN dashboard is loading THEN the system SHALL display Mantine Skeleton components for all sections
2. WHEN API calls are in progress THEN the system SHALL show loading indicators with appropriate messaging
3. WHEN network errors occur THEN the system SHALL display clear error messages with retry options
4. WHEN authentication fails THEN the system SHALL provide specific error messages and recovery steps
5. WHEN data is unavailable THEN the system SHALL show appropriate empty states with helpful guidance
6. WHEN operations succeed THEN the system SHALL provide success feedback through notifications
7. WHEN retrying operations THEN the system SHALL implement exponential backoff with connection monitoring

### Requirement 13

**User Story:** As a member, I want secure data access with proper privacy controls, so that I can only access my own information and maintain account security.

#### Acceptance Criteria

1. WHEN accessing member data THEN the system SHALL verify member ownership through Firebase UID matching
2. WHEN making API calls THEN the system SHALL include valid authentication tokens for all requests
3. WHEN viewing financial information THEN the system SHALL ensure member can only access their own data
4. WHEN account linking is required THEN the system SHALL use secure OTP verification process
5. WHEN session expires THEN the system SHALL redirect to login and clear sensitive data
6. WHEN unauthorized access is attempted THEN the system SHALL deny access and log security events
7. WHEN data is transmitted THEN the system SHALL use secure HTTPS connections for all communications

### Requirement 14

**User Story:** As a member, I want push notification support for important updates, so that I stay informed about billing events and payment confirmations.

#### Acceptance Criteria

1. WHEN member logs in THEN the system SHALL request notification permissions and store FCM token
2. WHEN FCM token changes THEN the system SHALL update token through Cloud Function
3. WHEN bills are generated THEN the system SHALL receive push notifications with billing details
4. WHEN payments are recorded THEN the system SHALL receive payment confirmation notifications
5. WHEN notifications are received THEN the system SHALL handle them appropriately based on app state
6. WHEN notification permissions are denied THEN the system SHALL continue functioning without notifications
7. WHEN FCM token becomes invalid THEN the system SHALL handle token refresh gracefully

### Requirement 15

**User Story:** As a member, I want proper logout functionality with session management, so that I can securely end my session and protect my account.

#### Acceptance Criteria

1. WHEN member clicks logout THEN the system SHALL display confirmation dialog before signing out
2. WHEN logout is confirmed THEN the system SHALL clear Firebase Auth session and redirect to login
3. WHEN logout occurs THEN the system SHALL clear all cached member data and AppContext state
4. WHEN session expires automatically THEN the system SHALL handle logout gracefully with appropriate messaging
5. WHEN logout is complete THEN the system SHALL ensure no sensitive data remains in browser storage
6. WHEN member signs back in THEN the system SHALL require fresh authentication without cached credentials
7. WHEN logout fails THEN the system SHALL provide error handling and retry mechanisms
