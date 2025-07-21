# Member Management - Requirements Document

## Introduction

The Member Management feature provides comprehensive functionality for managing tenant members throughout their lifecycle in the rent management application. This feature enables administrators to add, edit, deactivate, reactivate, and delete member records with complete financial tracking and settlement processing. The system integrates with Firebase Firestore for real-time data synchronization, maintains rent history with audit trails, and updates global member statistics while ensuring data integrity and business rule compliance across the multi-floor property management system.

## Requirements

### Requirement 1

**User Story:** As an admin, I want to view comprehensive member information and statistics, so that I can understand the current state of occupancy and member details.

#### Acceptance Criteria

1. WHEN viewing the members component THEN the system SHALL display real-time member counts (total active, WiFi opted)
2. WHEN viewing member list THEN the system SHALL show members in accordion format with key information in headers
3. WHEN expanding member details THEN the system SHALL show complete member information including financial status
4. WHEN viewing member status THEN the system SHALL show account linking status and other relevant indicators
5. WHEN member data changes THEN the system SHALL update displays in real-time using Firestore listeners

### Requirement 2

**User Story:** As an admin, I want to add new members to the system, so that I can onboard tenants with complete personal and financial information setup.

#### Acceptance Criteria

1. WHEN an admin clicks "Add Member" THEN the system SHALL display a modal with all required member information fields
2. WHEN entering member information THEN the system SHALL validate name format (minimum 2 words), phone number format (+91XXXXXXXXXX), and required fields
3. WHEN selecting floor and bed type THEN the system SHALL auto-populate rent amount based on current configuration rates
4. WHEN entering financial details THEN the system SHALL auto-populate security deposit and advance deposit from global configuration
5. WHEN financial information is entered THEN the system SHALL calculate and display total agreed deposit in real-time
6. WHEN submitting new member THEN the system SHALL verify phone number uniqueness across ALL members (active and inactive)
7. WHEN submitting new member THEN the system SHALL verify name uniqueness within the same floor to prevent confusion
8. WHEN member is successfully added THEN the system SHALL create initial rent history record for joining month with proper financial calculations using: totalAgreedInitialDue = securityDeposit + rentAtJoining + advanceDeposit, and initialOutstandingBalance = totalAgreedInitialDue - actualAmountPaid
9. WHEN member is added THEN the system SHALL atomically update global member counters (total, by floor, WiFi opted)

### Requirement 3

**User Story:** As an admin, I want member management to integrate seamlessly with rent management, so that member changes automatically update rent calculations and billing processes.

#### Acceptance Criteria

1. WHEN a member is added THEN the system SHALL create initial rent history record for the joining month with proper financial calculations
2. WHEN member rent amount changes THEN the system SHALL update future rent calculations while preserving historical data
3. WHEN member WiFi preference changes THEN the system SHALL update monthly WiFi charges in rent calculations
4. WHEN member floor or bed type changes THEN the system SHALL recalculate rent based on current configuration rates
5. WHEN member is deactivated THEN the system SHALL finalize current month rent calculations and prevent future billing
6. WHEN member outstanding balance changes THEN the system SHALL update rent history and payment tracking accordingly
7. WHEN member is reactivated THEN the system SHALL create fresh rent history starting from reactivation date

### Requirement 4

**User Story:** As an admin, I want member management to sync with global configuration settings, so that rent rates and deposits are always current and consistent.

#### Acceptance Criteria

1. WHEN adding new members THEN the system SHALL auto-populate rent amounts from current floor and bed type configuration
2. WHEN adding new members THEN the system SHALL auto-populate security deposit from global configuration settings
3. WHEN configuration rates change THEN the system SHALL update existing member's current month's rent
4. WHEN WiFi charges change in configuration THEN the system SHALL update member WiFi preferences and future billing
5. WHEN floor or bed type availability changes THEN the system SHALL validate member assignments against current configuration
6. WHEN global member limits are configured THEN the system SHALL enforce maximum occupancy rules during member addition

### Requirement 5

**User Story:** As an admin, I want to edit existing member information, so that I can update member details when circumstances change.

#### Acceptance Criteria

1. WHEN an admin clicks "Edit" for a member THEN the system SHALL display the add/edit modal pre-populated with current member information
2. WHEN editing member information THEN the system SHALL apply the same validation rules as adding new members
3. WHEN changing floor or bed type THEN the system SHALL update current rent based on new configuration rates
4. WHEN changing WiFi preference THEN the system SHALL update the member's optedForWifi status and global WiFi counter
5. WHEN updating financial information THEN the system SHALL recalculate outstanding balance if deposits change
6. WHEN recalculating outstanding balance THEN the system SHALL add the amount to the rent history expenses with note
7. WHEN submitting member updates THEN the system SHALL verify uniqueness constraints (phone across all, name)

### Requirement 6

**User Story:** As an admin, I want to reactivate former members, so that I can re-onboard returning tenants with current terms.

#### Acceptance Criteria

1. WHEN an admin clicks "Reactivate" for an inactive member THEN the system SHALL open the Add Member modal and treat it as new member on-boarding
2. WHEN reactivating a member THEN the system SHALL pre-populate only name and phone fields from previous record
3. WHEN reactivating a member THEN the system SHALL apply current configuration rates for all financial fields
4. WHEN reactivating a member THEN the system SHALL treat the process as fresh onboarding with current rent rates
5. WHEN reactivation is submitted THEN the system SHALL create a new member record with current terms
6. WHEN reactivation is complete THEN the system SHALL not migrate any data from the old inactive record but preserve historical rent data for audit purposes
7. WHEN reactivation is complete THEN the system SHALL atomically update global member counters (increment total, by floor, WiFi if applicable)

### Requirement 7

**User Story:** As an admin, I want to deactivate members when they leave, so that I can process their departure with complete financial settlement.

#### Acceptance Criteria

1. WHEN an admin clicks "Deactivate" for a member THEN the system SHALL display deactivation modal with settlement calculation
2. WHEN selecting leave date THEN the system SHALL calculate final settlement based on current outstanding balance and deposits using: refundAmount = member.totalAgreedDeposit - finalOutstanding
3. WHEN current month is paid THEN the system SHALL calculate refund as totalAgreedDeposit minus outstandingBalance
4. WHEN current month is unpaid THEN the system SHALL deduct advance deposit from outstanding balance for current rent
5. WHEN deactivation is confirmed THEN the system SHALL set isActive to false, set leaveDate, and set ttlExpiry for cleanup
6. WHEN member is deactivated THEN the system SHALL atomically update global member counters (decrement total, by floor, WiFi if applicable)
7. WHEN deactivation is complete THEN the system SHALL display final settlement details for admin review

### Requirement 8

**User Story:** As an admin, I want to permanently delete inactive member records, so that I can manage data retention and remove unnecessary records.

#### Acceptance Criteria

1. WHEN an admin clicks "Delete" for an inactive member THEN the system SHALL display confirmation modal with warning
2. WHEN confirming deletion THEN the system SHALL require typing "DELETE" to prevent accidental removal
3. WHEN deletion is confirmed THEN the system SHALL permanently remove member record and all associated rent history
4. WHEN deletion occurs THEN the system SHALL ensure the action cannot be undone and display appropriate warnings
5. WHEN member is deleted THEN the system SHALL maintain data integrity and not affect other system records

### Requirement 9

**User Story:** As an admin, I want to search and filter members efficiently, so that I can quickly find and manage specific members.

#### Acceptance Criteria

1. WHEN using the search function THEN the system SHALL search active members by name with debounced input
2. WHEN applying filters for active members THEN the system SHALL filter by name and account linking status from current data
3. WHEN applying filters for inactive members THEN the system SHALL fetch inactive member data from database
4. WHEN search or filter is applied THEN the system SHALL update results in real-time without page refresh
5. WHEN clearing search/filters THEN the system SHALL restore the active member list
6. WHEN no results are found THEN the system SHALL display helpful empty state with suggestions

### Requirement 10

**User Story:** As an admin, I want to record payments for individual members, so that I can track rent payments and update outstanding balances accurately.

#### Acceptance Criteria

1. WHEN admin clicks member's record payment button THEN the system SHALL open payment recording modal
2. WHEN payment modal opens THEN the system SHALL pre-populate payment amount with current outstanding balance
3. WHEN full payment toggle is enabled THEN the system SHALL automatically set amount to outstanding balance
4. WHEN entering custom payment amount THEN the system SHALL validate amount is positive
5. WHEN adding payment note THEN the system SHALL save note to member's outstanding note field
6. WHEN recording payment THEN the system SHALL update current month's rent history with payment details
7. WHEN payment is recorded THEN the system SHALL recalculate member's outstanding balance and payment status using: if (Math.abs(amountPaid - totalCharges) <= 1) status = 'Paid' (₹1 tolerance for rounding), else if (amountPaid > totalCharges) status = 'Overpaid', else if (amountPaid > 0) status = 'Partially Paid', else status = 'Due'
8. WHEN payment recording completes THEN the system SHALL send payment confirmation notification to member if account is linked

### Requirement 11

**User Story:** As an admin, I want to add ad-hoc expenses to individual members, so that I can charge for special services or repairs.

#### Acceptance Criteria

1. WHEN admin selects "Add Expense" for a member THEN the system SHALL open expense modal for that specific member
2. WHEN adding expense items THEN the system SHALL allow multiple expense entries with description and amount
3. WHEN expense amount is entered THEN the system SHALL require non-empty description for each expense item
4. WHEN expense amount is removed THEN the system SHALL remove the particular expense
5. WHEN adding more expenses THEN the system SHALL provide "Add Another Expense" functionality with remove option
6. WHEN submitting expenses THEN the system SHALL add all valid expenses to member's current month rent history
7. WHEN expenses are added THEN the system SHALL update member's outstanding balance and total charges
8. WHEN expense addition completes THEN the system SHALL display expense summary with total amount added

### Requirement 12

**User Story:** As an admin, I want to view member rent history, so that I can track payment patterns and billing details over time.

#### Acceptance Criteria

1. WHEN admin clicks "History" for a member THEN the system SHALL navigate to Member Dashboard view with admin context
2. WHEN viewing member dashboard as admin THEN the system SHALL display back button at top to return to admin interface
3. WHEN history data is large THEN the system SHALL implement pagination to load 12 months at a time
4. WHEN admin views member dashboard THEN the system SHALL disable UPI payment buttons

### Requirement 13

**User Story:** As an admin, I want comprehensive financial tracking for all members, so that I can maintain accurate accounting and settlement records.

#### Acceptance Criteria

1. WHEN viewing member financial status THEN the system SHALL display current outstanding balance with appropriate color coding
2. WHEN calculating outstanding balance THEN the system SHALL sum all unpaid charges across all billing months
3. WHEN processing payments THEN the system SHALL maintain detailed payment audit trail with timestamps and amounts
4. WHEN generating settlement previews THEN the system SHALL calculate refunds based on total agreed deposits minus outstanding balance
5. WHEN member financial data changes THEN the system SHALL update displays in real-time across all admin interfaces
6. WHEN viewing financial summaries THEN the system SHALL provide total outstanding amounts across all active members
7. WHEN financial calculations are performed THEN the system SHALL maintain precision to prevent rounding errors in monetary amounts

### Requirement 14

**User Story:** As an admin, I want to generate monthly bills for all active members, so that I can distribute electricity costs and apply bulk expenses efficiently.

#### Acceptance Criteria

1. WHEN admin clicks "Generate Bills" THEN the system SHALL display bill generation modal with next month pre-selected
2. WHEN selecting billing month THEN the system SHALL allow choosing current or next billing month
3. WHEN entering floor electricity costs THEN the system SHALL pre-populate member counts by floor from real-time data
4. WHEN member counts are displayed THEN the system SHALL allow manual editing if needed with toggle option
5. WHEN adding bulk expenses THEN the system SHALL provide multi-select for affected members with expense amount and description
6. WHEN configuring WiFi charges THEN the system SHALL pre-populate members in multi-select who opted for WiFi with configurable amount
7. WHEN generating bills THEN the system SHALL create rent history records for all active members with proper cost distribution using: perMemberElectricityCost = Math.ceil(floorTotalElectricity / membersOnFloorCount), perMemberWifiCost = Math.ceil(wifiMonthlyCharge / wifiOptedInCount), and bulk expenses split using Math.ceil() for equal divisions
8. WHEN bills are generated THEN the system SHALL update member outstanding balances and send notifications to linked accounts
9. WHEN bill generation completes THEN the system SHALL update global billing month timestamps and member counters

### Requirement 15

**User Story:** As an admin, I want member management to integrate with billing workflows, so that member changes automatically reflect in rent calculations and payment tracking.

#### Acceptance Criteria

1. WHEN member floor or bed type changes THEN the system SHALL update future rent calculations while preserving historical billing data
2. WHEN member WiFi preference changes THEN the system SHALL update WiFi eligibility for future bill generation
3. WHEN member is added mid-month THEN the system SHALL include them in this billing cycle with full monthly charges
4. WHEN member is deactivated THEN the system SHALL exclude them from future bill generation while preserving payment history
5. WHEN generating bills THEN the system SHALL use current active member data for accurate cost distribution calculations
6. WHEN recording payments THEN the system SHALL update both rent history and member outstanding balance atomically
7. WHEN adding expenses THEN the system SHALL integrate with current month's billing record and update member totals

### Requirement 16

**User Story:** As an admin, I want member management to integrate with electric bill calculations, so that member changes are reflected in utility cost distribution.

#### Acceptance Criteria

1. WHEN generating monthly bills THEN the system SHALL use current active member counts by floor for electric bill distribution
2. WHEN member changes floor THEN the system SHALL update floor-wise member counts for future electric bill calculations
3. WHEN member is added or deactivated THEN the system SHALL update floor member counts that affect electric cost per member
4. WHEN electric bills are being calculated THEN the system SHALL use real-time member data to pre-populate floor member counts
5. WHEN electric bill generation occurs THEN the system SHALL distribute costs equally among all active members on each floor
6. WHEN member floor assignments change THEN the system SHALL ensure accurate electric cost distribution in next billing cycle

### Requirement 17

**User Story:** As an admin, I want member management to integrate with authentication and authorization, so that only authorized users can perform member operations.

#### Acceptance Criteria

1. WHEN accessing member management THEN the system SHALL verify admin authentication and authorization
2. WHEN performing member operations THEN the system SHALL validate admin permissions for each action
3. WHEN admin session expires THEN the system SHALL redirect to sign-in and prevent unauthorized member operations
4. WHEN non-admin user tries to access member management THEN the system SHALL deny access and redirect appropriately
5. WHEN Firebase account holder accesses system THEN the system SHALL grant primary admin privileges including admin management
6. WHEN secondary admins access system THEN the system SHALL grant standard admin privileges excluding admin management
7. WHEN audit trails are created THEN the system SHALL record admin identity and timestamp for all member operations

### Requirement 18

**User Story:** As a system administrator, I want automatic data cleanup and retention policies, so that the system maintains optimal performance and complies with data retention requirements.

#### Acceptance Criteria

1. WHEN member is deactivated THEN the system SHALL set TTL expiry timestamp for automatic data cleanup
2. WHEN TTL expiry time is reached THEN the system SHALL automatically delete inactive member records and all associated data
3. WHEN electric bill data exceeds retention period THEN the system SHALL automatically remove outdated billing records
4. WHEN data cleanup occurs THEN the system SHALL maintain data integrity and not affect active member records
5. WHEN cleanup operations run THEN the system SHALL log cleanup activities for audit and monitoring purposes
6. WHEN retention policies are configured THEN the system SHALL enforce consistent data lifecycle management
7. WHEN member data is scheduled for deletion THEN the system SHALL ensure complete removal including all subcollections

### Requirement 19

**User Story:** As an admin, I want to manage global system configuration, so that I can maintain current rent rates, deposits, and system settings.

#### Acceptance Criteria

1. WHEN admin accesses configuration management THEN the system SHALL display organized sections for floor rates and general settings
2. WHEN viewing 2nd floor configuration THEN the system SHALL show input fields for Bed Rent, Room Rent, and Special Rent
3. WHEN viewing 3rd floor configuration THEN the system SHALL show input fields for Bed Rent and Room Rent
4. WHEN viewing general settings THEN the system SHALL show Security Deposit, WiFi Monthly Charge, and UPI VPA fields
5. WHEN configuration values are changed THEN the system SHALL validate positive numbers and required fields
6. WHEN saving system settings THEN the system SHALL update global configuration and apply changes to affected members
7. WHEN reset is clicked THEN the system SHALL restore original session values without saving changes
8. WHEN configuration changes are saved THEN the system SHALL provide success feedback and update real-time displays

### Requirement 20

**User Story:** As an admin, I want configuration changes to automatically update member rates, so that all members have current pricing without manual updates.

#### Acceptance Criteria

1. WHEN bed or room rates are updated in configuration THEN the system SHALL identify all active members with matching floor and bed type
2. WHEN rate changes are saved THEN the system SHALL batch update all affected members' currentRent field
3. WHEN member rent rates are updated THEN the system SHALL preserve historical rent data in existing rent history records
4. WHEN WiFi charges are updated THEN the system SHALL apply new rates to future billing cycles for WiFi-opted members
5. WHEN security deposit is updated THEN the system SHALL apply new amount to future member additions only
6. WHEN configuration updates complete THEN the system SHALL send notifications to affected members about rate changes
7. WHEN batch updates occur THEN the system SHALL use atomic operations to ensure all updates complete successfully or rollback entirely

### Requirement 21

**User Story:** As a primary admin, I want to manage secondary administrators, so that I can control system access and maintain proper administrative hierarchy.

#### Acceptance Criteria

1. WHEN primary admin accesses admin management THEN the system SHALL display collapsible admin management section at top of configuration page
2. WHEN viewing current admins THEN the system SHALL show primary admin with "Primary Admin (You)" label and cannot remove indicator
3. WHEN viewing secondary admins THEN the system SHALL display their email, role, and removal option
4. WHEN adding new admin THEN the system SHALL provide email input with validation for Google account requirement
5. WHEN submitting new admin THEN the system SHALL verify email uniqueness and add to admin list with secondary role
6. WHEN removing secondary admin THEN the system SHALL require confirmation and remove from admin list
7. WHEN admin management operations occur THEN the system SHALL maintain audit trail with timestamps and admin identity
8. WHEN secondary admin accesses system THEN the system SHALL hide admin management section and show standard admin access only

### Requirement 22

**User Story:** As a system administrator, I want role-based access control for all administrative functions, so that different admin levels have appropriate permissions.

#### Acceptance Criteria

1. WHEN Firebase account holder signs in THEN the system SHALL grant primary admin privileges with full system access
2. WHEN secondary admin signs in THEN the system SHALL grant standard admin privileges excluding admin management
3. WHEN primary admin accesses admin management THEN the system SHALL allow adding and removing secondary administrators
4. WHEN secondary admin tries to access admin management THEN the system SHALL deny access and hide management interface
5. WHEN admin operations are performed THEN the system SHALL validate admin permissions for each action
6. WHEN admin session expires THEN the system SHALL redirect to sign-in and prevent unauthorized operations
7. WHEN audit trails are created THEN the system SHALL record admin identity, role, and timestamp for all operations

### Requirement 23

**User Story:** As a member, I want to access my personal dashboard with account linking capability, so that I can view my rent information, payment history, and make payments conveniently.

#### Acceptance Criteria

1. WHEN a member account is created THEN the system SHALL support linking with Firebase authentication via phone number verification
2. WHEN member phone number is verified THEN the system SHALL link the Firebase UID to the member record
3. WHEN member logs in THEN the system SHALL display a personalized dashboard with their information
4. WHEN viewing the dashboard THEN the system SHALL show collapsible member details section with personal information
5. WHEN viewing current month's rent THEN the system SHALL display complete breakdown with rent, electricity, WiFi, and expenses
6. WHEN member has outstanding balance THEN the system SHALL provide UPI payment button with proper payment URI
7. WHEN UPI payment button is clicked THEN the system SHALL open device's default UPI app with pre-filled payment details
8. WHEN member completes payment THEN the system SHALL provide instructions to send screenshot to admin for verification
9. WHEN member wants to view history THEN the system SHALL provide "Show History" button to load past 12 months of rent data
10. WHEN history is loaded THEN the system SHALL display accordion with month-wise rent history and payment status
11. WHEN member switches to "Friends" tab THEN the system SHALL display list of other active members with basic contact information
12. WHEN member dashboard loads THEN the system SHALL ensure member can only access their own financial data
13. WHEN member account linking status changes THEN the system SHALL update member record and display status in admin interface
14. WHEN member account is unlinked THEN the system SHALL remove Firebase UID while preserving member data
15. WHEN member tries to link with wrong phone THEN the system SHALL prevent linking and show appropriate error message
16. WHEN member dashboard is accessed THEN the system SHALL verify account linking and show only authorized member data

### Requirement 24

**User Story:** As a member, I want to easily make rent payments through UPI, so that I can pay my bills conveniently using my mobile payment apps.

#### Acceptance Criteria

1. WHEN member views outstanding balance THEN the system SHALL display UPI payment button if balance is greater than zero
2. WHEN member clicks UPI payment button THEN the system SHALL generate UPI payment URI with correct payment details
3. WHEN UPI URI is generated THEN the system SHALL include admin's UPI ID, member name, billing month, and exact amount
4. WHEN member initiates UPI payment THEN the system SHALL open device's default UPI app or show app selection dialog
5. WHEN UPI payment is completed THEN the system SHALL provide instructions for payment confirmation to admin
6. WHEN member has zero or negative balance THEN the system SHALL disable UPI payment options
7. WHEN UPI payment details are generated THEN the system SHALL use current global configuration for admin UPI information

### Requirement 25

**User Story:** As a member, I want to receive comprehensive push notifications about billing and payment events, so that I stay informed about my rent status and payment requirements.

#### Acceptance Criteria

1. WHEN member account is linked THEN the system SHALL store and manage their FCM token for push notifications
2. WHEN member opts in for notifications THEN the system SHALL enable notification preferences and token management
3. WHEN monthly bills are generated THEN the system SHALL send push notifications to all active members with linked accounts
4. WHEN bill notification is sent THEN the system SHALL include billing month, amount due, and direct link to member dashboard
5. WHEN a member's payment is recorded THEN the system SHALL send payment confirmation notification to that specific member
6. WHEN payment notification is sent THEN the system SHALL include payment amount and updated outstanding balance
7. WHEN member changes devices or apps THEN the system SHALL update their FCM token to maintain notification delivery
8. WHEN notification delivery fails THEN the system SHALL handle invalid tokens gracefully and clean up outdated tokens
9. WHEN member is deactivated THEN the system SHALL stop sending notifications and clean up their FCM token

### Requirement 26

**User Story:** As a system administrator, I want automated push notification management, so that members receive timely and relevant billing information.

#### Acceptance Criteria

1. WHEN FCM tokens are stored THEN the system SHALL validate token format and maintain token update history
2. WHEN sending batch notifications THEN the system SHALL use efficient delivery system for multiple members
3. WHEN notification delivery fails THEN the system SHALL implement retry logic for failed deliveries
4. WHEN invalid tokens are detected THEN the system SHALL automatically clean up outdated tokens from member records
5. WHEN members opt out of notifications THEN the system SHALL respect notification preferences and stop sending
6. WHEN notification system encounters errors THEN the system SHALL log errors for monitoring and troubleshooting
7. WHEN notification delivery is successful THEN the system SHALL track delivery status for system monitoring

### Requirement 27

**User Story:** As a system administrator, I want all member management operations to maintain data integrity and business rules, so that the system remains consistent and reliable.

#### Acceptance Criteria

1. WHEN adding members to Firestore THEN the system SHALL use batch operations for creating member record and initial rent history
2. WHEN updating member information THEN the system SHALL validate all business rules before committing changes
3. WHEN performing financial calculations THEN the system SHALL maintain precision and prevent rounding errors
4. WHEN concurrent operations occur THEN the system SHALL use atomic transactions to prevent data corruption
5. WHEN validation fails THEN the system SHALL rollback all related changes and display clear error messages
6. WHEN system errors occur THEN the system SHALL log detailed error information for debugging and monitoring
7. WHEN data integrity checks fail THEN the system SHALL prevent the operation and alert administrators system SHALL use batch operations for member updates and related counter changes
8. WHEN adding or updating members THEN the system SHALL enforce all business validation rules consistently
9. WHEN financial calculations are performed THEN the system SHALL maintain precision and accuracy across all operations
10. WHEN member operations fail THEN the system SHALL let Firestore handle transaction rollbacks automatically
11. WHEN member data is modified THEN the system SHALL maintain proper audit trails for compliance and debugging

### Requirement 28

**User Story:** As a system administrator, I want comprehensive automatic data cleanup, retention policies, and scheduled maintenance, so that the system maintains optimal performance and complies with data retention requirements.

#### Acceptance Criteria

1. WHEN member is deactivated THEN the system SHALL set TTL expiry timestamp for automatic data cleanup after configured retention period
2. WHEN TTL expiry time is reached THEN the system SHALL automatically delete inactive member records and all associated subcollections
3. WHEN electric bill data exceeds 12-month retention period THEN the system SHALL automatically remove outdated billing records
4. WHEN automated cleanup runs THEN the system SHALL execute on monthly schedule on 1st day at 1 AM for consistent maintenance
5. WHEN cleanup schedules are configured THEN the system SHALL use Cloud Scheduler for automated maintenance execution
6. WHEN maintenance operations run THEN the system SHALL use efficient batch operations to remove multiple outdated documents
7. WHEN cleanup results are generated THEN the system SHALL record operation results for system monitoring and compliance
8. WHEN retention cutoff dates are calculated THEN the system SHALL determine data retention based on configured policies
9. WHEN maintenance encounters errors THEN the system SHALL log errors and provide alerting for system administrators
10. WHEN data lifecycle policies change THEN the system SHALL apply new policies to future cleanup operations
11. WHEN compliance reporting is needed THEN the system SHALL provide cleanup activity logs for audit purposes
12. WHEN data cleanup occurs THEN the system SHALL maintain data integrity and not affect active member records
13. WHEN cleanup operations run THEN the system SHALL log cleanup activities for audit and monitoring purposes
14. WHEN retention policies are configured THEN the system SHALL enforce consistent data lifecycle management across all collections

### Requirement 29

**User Story:** As a system administrator, I want comprehensive performance optimization, security controls, and access control, so that the system operates efficiently, securely, and protects sensitive data.

#### Acceptance Criteria

1. WHEN database queries are executed THEN the system SHALL use optimized composite indexes for member filtering and search operations
2. WHEN admin operations are performed THEN the system SHALL implement 1-second cooldown rate limiting between administrative write operations
3. WHEN member operations are performed THEN the system SHALL apply standard rate limits for member data retrieval and updates
4. WHEN Firestore security rules are implemented THEN the system SHALL enforce role-based access control at database level
5. WHEN admin access is verified THEN the system SHALL confirm admin status through config/admins.list with proper role verification
6. WHEN member access is granted THEN the system SHALL verify ownership through Firebase UID matching with member records
7. WHEN rate limiting is applied THEN the system SHALL use time-based request limiting with request.time comparison for efficiency
8. WHEN authentication tokens are validated THEN the system SHALL require valid Firebase tokens for all operations
9. WHEN member data is accessed THEN the system SHALL allow minimal globalSettings read access for UPI payments only
10. WHEN security violations are detected THEN the system SHALL log security events and implement appropriate response measures
11. WHEN security rules are enforced THEN the system SHALL verify admin status through dedicated role checking functions
12. WHEN authentication is required THEN the system SHALL ensure valid Firebase authentication with sign-in provider verification
13. WHEN data access is requested THEN the system SHALL enforce data isolation so members can only access their own information
14. WHEN system performance is monitored THEN the system SHALL track query performance, operation completion times, and error rates

### Requirement 30

**User Story:** As a system administrator, I want transaction integrity and error handling, so that all financial operations maintain data consistency.

#### Acceptance Criteria

1. WHEN member is added THEN the system SHALL use atomic transaction for member creation, initial rentHistory, and counter updates
2. WHEN payment is recorded THEN the system SHALL use atomic transaction for rentHistory update, member balance update, and status calculation
3. WHEN bills are generated THEN the system SHALL use batch operations to create rentHistory records and update balances atomically
4. WHEN member is deactivated THEN the system SHALL use atomic transaction for member update, counter updates, and settlement calculation
5. WHEN operations fail THEN the system SHALL provide automatic reversal of incomplete operations through Firestore transaction rollback
6. WHEN errors occur THEN the system SHALL provide user-friendly error messages with retry mechanisms where appropriate
7. WHEN financial calculations are performed THEN the system SHALL maintain precision and accuracy across all related records
