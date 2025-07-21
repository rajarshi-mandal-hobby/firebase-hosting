# Rent Management Application: Firestore Design & Specification

## 1. Introduction

This document outlines the complete Firestore database structure, UI specifications, and backend logic for a rent management application. Designed for practical workflows with emphasis on **batch operations**, **financial accuracy**, and **essential security**.

---

## 2. Technology Stack & Best Practices (Updated 2025)

### Frontend Technologies

- **React 19.x** (Latest stable release)

  - React Actions and Server Actions for form handling
  - useActionState hook for managing form states and errors
  - useOptimistic hook for optimistic UI updates
  - New `use` API for promise handling
  - Enhanced Suspense with better error boundaries
  - ref as prop (forwardRef deprecation path)
  - Built-in support for document metadata and stylesheets

- **TypeScript 5.x+**

  - Strict type checking enabled
  - Interface-based type definitions
  - Generic type constraints for reusable components

- **Vite 7**

  - Fast development server with HMR
  - Optimized production builds
  - Tree-shaking for minimal bundle size
  - Native ES modules support

- **Mantine UI 8.1.x**

  - Modern component library with React 19 compatibility
  - Built-in form validation and state management
  - Consistent design system and theming
  - Accessible components out of the box
  - Notification system for user feedback

- **React Router 7+**
  - Client-side routing with data loading
  - Nested route support
  - Loading states and error boundaries integration

### Backend Technologies

- **Node.js 22**

  - Latest LTS with performance improvements
  - Enhanced module resolution and security

- **Firebase 11.x Web SDK**

  - Modular SDK with tree-shaking support
  - Cloud Firestore for database operations
  - Firebase Authentication with Google OAuth
  - Cloud Functions for backend logic
  - Firebase Storage for file uploads
  - Firebase Hosting for deployment

- **Cloud Functions (Node.js 22+)**
  - TypeScript-based function development
  - Firestore triggers and HTTP callable functions
  - Rate limiting and security enforcement
  - Background task processing

### Development Tools

- **Firebase Emulator Suite**

  - Local development environment
  - Authentication, Firestore, Functions, and Storage emulation
  - Consistent dev/prod parity

- **ESLint + Prettier**

  - Code quality and formatting standards
  - React 19 and TypeScript rules

- **PowerShell Scripts**
  - Windows-compatible development workflow
  - Automated start-dev processes

### State Management

- **React Context API**
  - Authentication state management
  - Configuration state management
  - No external state management library needed

### Real-time Features

- **Firestore onSnapshot**
  - Real-time data synchronization
  - Automatic UI updates on data changes
  - Connection state management

### Security & Performance

- **Firebase Security Rules**

  - Role-based access control (RBAC)
  - Data validation at database level
  - Rate limiting and abuse prevention

- **React 19 Performance Features**
  - Automatic batching improvements
  - Enhanced Suspense for better loading states
  - Optimistic updates with automatic rollback

### Key References

- [React 19 Features](https://react.dev/blog/2024/12/05/react-19)
- [Mantine UI 8.x Components](https://mantine.dev/core/package/)
- [Firebase 11.x Documentation](https://firebase.google.com/docs)
- [Firestore Real-time Listeners](https://firebase.google.com/docs/firestore/query-data/listen)
- [Node.js 22 Features](https://nodejs.org/en/blog/announcements/v22-release-announce)

---

## 3. System Responsibilities

- **Frontend**: UI state management, client-side validation, calling Cloud Functions
- **Backend**: Server-side validation, business logic, security rules, atomic transactions, financial calculations

---

## 4. Firestore Database Schema

### 4.1. `config` (Collection)

Stores global, slowly changing application settings.

#### Document ID: `globalSettings`

- `floors`: `['2nd', '3rd']` (Array of Strings)
- `bedTypes`: (Map of floor-specific bed rates)
  - Structure: Floor name as key, with nested map of bed/room types and their rates
  - Example structure: Each floor contains bed types (Bed, Special Room, Room) with corresponding Number values
  - For implementation details, see [Firestore Maps documentation](https://firebase.google.com/docs/firestore/manage-data/data-types#map_fields)
- `securityDeposit`: Number
- `wifiMonthlyCharge`: Number - Total monthly WiFi cost for the building
- `upiPhoneNumber`: String - Admin's UPI phone number for payment links (e.g., "+918777529394")
- `activememberCounts`: (Map of live counts, updated atomically by Cloud Functions)
  - `total`: Number
  - `byFloor`: Map (e.g., `{"2nd": 5, "3rd": 6}`)
  - `wifiOptedIn`: Number
- `currentBillingMonth`: Timestamp (Hidden, set when generating bills)
- `nextBillingMonth`: Timestamp (Hidden, set when generating bills)

#### Document ID: `admins`

- `list`: Array of Maps containing admin information
  - Structure: `[{ "email": "admin@example.com", "uid": "firebase-uid", "role": "primary|secondary", "addedAt": Timestamp, "addedBy": "primary-admin-uid" }]`
  - **Primary Admin**: Firebase account holder with full system access (role: "primary")
  - **Secondary Admins**: Added by primary admin with standard access (role: "secondary")
- `primaryAdminUid`: String - Firebase UID of the account holder (cannot be changed)
- `maxAdmins`: Number - Maximum number of admins allowed (default: 5)

---

### 4.2. `members` (Collection)

Each document represents a member. The Document ID is Firestore's auto-generated ID.

- `name`: String
- `phone`: String (e.g., `+918777529394`)
- `firebaseUid`: String (Nullable, links to Firebase Auth for member login)
- `fcmToken`: String (Nullable, Firebase Cloud Messaging token for push notifications)
- `floor`: String (e.g., '2nd')
- `bedType`: String (e.g., 'Bed')
- `moveInDate`: Timestamp
- `securityDeposit`: Number
- `rentAtJoining`: Number
- `advanceDeposit`: Number
- `currentRent`: Number (Member's current monthly rent)
- `totalAgreedDeposit`: Number (`rentAtJoining` + `advanceDeposit` + `securityDeposit`)
- `outstandingBalance`: Number (Single source of truth for debt/credit. Positive = member owes, Negative = member has credit)
- `outstandingNote`: Text (Nullable)
- `isActive`: Boolean
- `optedForWifi`: Boolean
- `leaveDate`: Timestamp (Nullable, set on deactivation)
- `ttlExpiry`: Timestamp (Nullable, set when `isActive` becomes `false` to trigger auto-deletion via TTL policy)

#### Subcollection: `members/{memberId}/rentHistory`

Immutable record of each billing event. Document ID is `YYYY-MM` (e.g., "2025-06").

- `generatedAt`: Timestamp
- `rent`: Number
- `electricity`: Number
- `wifi`: Number
- `previousOutstanding`: Number (Balance before this bill's charges)
- `expenses`: Array of Maps `[{ "amount": 100, "description": "Repair" }]`
- `totalCharges`: Number (`rent` + `electricity` + `wifi` + `sum(expenses)`)
- `amountPaid`: Number (Sum of all `payments.amount`)
- `currentOutstanding`: Number (`previousOutstanding` + `totalCharges` - `amountPaid`)
- `note`: String (Previous member.outstandingNote)
- `status`: String ('Due', 'Paid', 'Partially Paid', 'Overpaid')

---

### 4.3. `electricBills` (Collection)

Stores the last 12 months of electricity bills for calculations and statistics.

#### Document ID: `YYYY-MM` (e.g., "2025-06")

- `billingMonth`: Timestamp
- `generatedAt`: Timestamp
- `lastUpdated`: Timestamp
- `floorCosts`: Map
  - `"2nd"`: `{ "bill": Number, "totalMembers": Number }`
  - `"3rd"`: `{ "bill": Number, "totalMembers": Number }`
- `appliedBulkExpenses`: Array of Maps `[{ "members": [String], "amount": Number, "description": String }]` (Auditing field to track bulk expenses applied during this billing event)

---

## 5. Admin UI Specifications

### 5.1. Config Management (`globalSettings`)

- **Overview**: A form with multiple sections for editing the `globalSettings` document.
- **UI Structure**:
  - **2nd Floor Config**: Fields for "Bed Rate", "Special Room Rate", "Room Rate".
  - **3rd Floor Config**: Fields for "Bed Rate", "Room Rate".
  - **General Settings**: Fields for "Security Deposit", "WiFi Monthly Charge".
- **Auto-Calculation**: Room Rate field displays calculated value based on Bed Rate (typically double the bed rate), but administrators can manually override this value as needed.
- **Validation**:
  - **Client-side**: Real-time validation for required fields and positive number formats
  - **Server-side**: Complete data validation through backend functions with duplicate checking
  - **Reference**: [Form Validation Best Practices](https://firebase.google.com/docs/functions/callable#handle_errors)
- **User Experience**: Save button activates when valid changes are detected. Reset functionality restores original session values. Success/error feedback through Mantine notification system.

### 5.2. Members Management

- **Layout**: An accordion-style list with a search/filter bar at the top.
- **Member Count Display**: Real-time display of active member statistics from `activememberCounts`
  - **Total Active Members**: From `activememberCounts.total`
  - **WiFi Opted Members**: From `activememberCounts.wifiOptedIn`
  - **Update Frequency**: Real-time updates via Firestore onSnapshot listeners
- **Top Controls**:
  - Search by name or phone (debounced).
  - Filter by Floor and Status (Active/Inactive) Action button menu.
  - Advanced filters: Account linking status, floor-based filtering
  - "Add Member" Action button to open a modal.
- **Member List (Accordion)**:
  - **Header**: Shows member's name, phone (`tel:` link), Avatar, Menu button.
  - **Content (Expanded)**: Displays all other member details.
  - **Action Buttons**:
  - **Active Members**: Edit, Deactivate, History.
  - **Inactive Members**: Reactivate, Delete (Hard Delete), History.

#### Add/Edit Member Modal

- **Fields**: All member fields are present. On "Add", financial fields like `rentAtJoining`, `advanceDeposit`, and `securityDeposit` are auto-populated from `config` but are editable.
- **Auto-Calculations (Display Only)**:
  - **Total Agreed Deposit**: Automatically calculated sum of security deposit, rent at joining, and advance deposit
  - **Outstanding Balance**: Real-time calculation of member's current financial position based on agreed deposits and actual payments received
  - **Reference**: [Real-time Calculations Guide](https://firebase.google.com/docs/firestore/query-data/listen#listen_to_multiple_documents_in_a_collection)
- **Validation**:
  - Client-side: Required fields, 10-digit phone.
  - Server-side: Full validation via a Cloud Function, duplicate name/phone check.

#### Deactivation & Deletion Modals

- **Deactivation**: Shows a final settlement calculation before confirming. Requires a leave date. Includes confirmation dialog with settlement details.
- **Hard Delete**: For inactive members only. Requires typing "DELETE" to confirm permanent removal. Includes detailed confirmation dialog with member information.

### 5.3. Rent Management UI

#### 5.3.1. Main Dashboard View

- **Layout**: A primary view for monthly rent and billing management.
- **Top Bar**:
  - **Total Outstanding Balance**: A prominently displayed, auto-updating card showing the sum of all positive `outstandingBalance` values from all active members for the current month.
  - **Generate Bills Button**: A primary action button that opens the "Generate/Update Bills Modal".
- **Member List (Accordion)**:
  - **Header**:
    - Contains the member's Avatar, Name, and their current `outstandingBalance` button.
    - When the balance is clicked, it opens the "Record Payment Modal".
    - A "Menu" icon button with the following options:
      - **Add Expense**: Opens a modal to add an ad-hoc expense for that specific member.
      - **History**: (Action to be defined).
  - **Content (Expanded)**: Shows other relevant details like `floor`, `bedType`, `currentRent`, etc.

#### 5.3.2. Enhanced Generate/Update Bills Modal

- **Trigger**: Clicking the "Generate Bills" button.
- **Functionality**: Can either generate bills for the `nextBillingMonth` or update bills for the `currentBillingMonth`.
- **Fields**:
  - **Billing Month Selection**: Month picker component for selecting billing period
    - Shows `currentBillingMonth` and `nextBillingMonth` options
    - Defaults to `nextBillingMonth` for new bill generation
  - **Floor Bills**:
    - **2nd Floor**: Number input with currency symbol (₹) in leftSection for total electricity bill
    - **3rd Floor**: Similar input for 3rd floor electricity costs
    - **Member Count Display**: Shows active member count per floor for reference
  - **Bulk Expenses Section**:
    - **Member Selection**: Multi-select component for choosing affected members
    - **Expense Amount**: Number input with ₹ leftSection for expense amount
    - **Expense Description**: Text input for expense description/notes
    - **Expense Type Toggle**: Radio buttons for "Individual" vs "Split" expense distribution
    - **Multiple Expenses**: Option to add multiple bulk expense items
    - **Validation**: All fields required if any bulk expense field is filled
  - **Bulk WiFi Section**:
    - **WiFi Members**: Multi-select pre-populated with members where `optedForWifi` is true
    - **Cost Display**: Shows total WiFi charge and per-member calculation
    - **Editable Selection**: Admin can modify WiFi member selection
  - **Bill Summary**:
    - **Total Members**: Count of active members affected
    - **Total Charges**: Calculated total charges across all members
    - **Preview**: Summary of changes before bill generation
  - **Floor Bills**:
    - **2nd Floor**: An input for the total electricity bill for the floor. Displays the number of active members on that floor for reference (editable).
    - **3rd Floor**: Same as the 2nd floor.
  - **Bulk Expenses Section**:
    - A multi-select input to choose one or more members.
    - A number input for the expense amount.
    - A text input for the expense description (note).
    - **Expense Type Toggle**:
      - "Individual" (default): Each selected member pays the full expense amount.
      - "Split": Total expense amount is divided equally among selected members.
    - **Validation**: If any field in this section is filled, all fields are required.
  - **Bulk WiFi Section**:
    - A multi-select input for members, pre-populated with those where `optedForWifi` is `true`.
    - The total WiFi charge is automatically fetched from `config.wifiMonthlyCharge` and divided among the selected members.

#### 5.3.3. Record Payment Modal

- **Trigger**: Clicking the `outstandingBalance` of a member in the accordion list.
- **Functionality**: Allows for quick recording of payments.
- **Fields**:
  - **Payment Amount**: A number input field for entering payment amount
    - **Auto-fill**: Pre-populated with the member's current `outstandingBalance` amount
    - **Editable**: Admin can modify the amount (for partial payments or overpayments)
    - **Validation**: Must be positive number, allows decimal values for precise amounts
    - **Logic**: Any amount entered will be applied to member's outstanding balance
  - **Note**: A text area where the admin can add a note. This note is saved to the member's `outstandingNote` field.
  - **Submit Button**: Triggers the backend function to process the payment.

#### 5.3.4. Add Ad-hoc Expense Modal

- **Trigger**: Clicking the "Add Expense" option from a member's accordion menu.
- **Functionality**: Allows an admin to add one or more ad-hoc charges to a single member's bill for the current month.
- **Fields**:
  - A dynamic list of expense items. Each item contains:
    - **Amount**: A number input for the expense amount.
    - **Description**: A text input for the expense description/note.
  - **Add More Button**: A button to add another expense item row to the form.
  - **Submit Button**: Triggers a backend function to add all expense items to the member's `rentHistory` for the current billing month.

### 5.4. Admin Management UI

#### 5.4.1. Admin Management Section

- **Access Control**: Only visible to primary admin (Firebase account holder)
- **Layout**: Clean interface for managing secondary administrators
- **Current Admins Display**:
  - **Primary Admin**: Shows Firebase account holder with "Primary Admin (You)" label
  - **Secondary Admins**: List of added administrators with removal options
  - **Admin Information**: Email, role, date added, and added by information
- **Add Admin Interface**:
  - **Email Input**: Validation for email format and Google account requirement
  - **Access Level**: Clear indication that new admins will have standard access (cannot manage other admins)
  - **Validation**: Check for existing admin accounts and email format validation
  - **Success Feedback**: Confirmation when admin is successfully added

#### 5.4.2. Admin Hierarchy and Permissions

- **Primary Admin Capabilities**:
  - Full system access including all admin functions
  - Can add and remove secondary administrators
  - Cannot be removed or demoted by any user
  - Shown with distinct visual indicators
- **Secondary Admin Capabilities**:
  - Standard admin access to all system functions
  - Cannot access admin management section
  - Cannot add or remove other administrators
  - Can be removed only by primary admin
- **UI Indicators**:
  - Clear visual distinction between primary and secondary admins
  - Admin management section only visible to primary admin
  - Role-based menu options and navigation

---

## 6. Core Workflows & Cloud Functions

### 6.1. Adding a Member

- **Business Purpose**: Onboard new members with complete financial and personal information setup
- **Trigger**: Admin submits the "Add Member" form through the management interface
- **Implementation Strategy**: HTTP Callable Cloud Function ensures secure server-side processing and data consistency
- **Business Process Workflow**:
  1.  **Input Validation**: Validate all member information against business rules and format requirements
  2.  **Uniqueness Verification**: Check for existing members with identical name/phone combinations to prevent duplicates
  3.  **Financial Calculation**: Calculate initial financial setup using precise business formulas
      - `totalAgreedInitialDue = securityDeposit + rentAtJoining + advanceDeposit`
      - `initialOutstandingBalance = totalAgreedInitialDue - actualAmountPaid`
      - Admin can edit `actualAmountPaid` if member paid different amount than agreed
  4.  **Account Creation**: Create new member record in database with all validated information
  5.  **History Initialization**: Create initial rentHistory record with document ID `YYYY-MM` for joining month
      - `previousOutstanding`: 0
      - `rent`: currentRent
      - `electricity`: 0, `wifi`: 0, `expenses`: []
      - `totalCharges`: totalAgreedInitialDue
      - `amountPaid`: actualAmountPaid
      - `currentOutstanding`: initialOutstandingBalance
      - `status`: 'Paid' if initialOutstandingBalance = 0, otherwise 'Partially Paid' or 'Due'
  6.  **System Updates**: Atomically update global member counters
      - Increment `activememberCounts.total` and `activememberCounts.byFloor[member.floor]`
      - If `optedForWifi` is true, increment `activememberCounts.wifiOptedIn`
  7.  **Transaction Integrity**: All operations (member creation + rentHistory + counter updates) execute in single atomic transaction
  8.  **Error Recovery**: Provide retry mechanisms and detailed error reporting for failed operations
- **Business Rules**:
  - Each member must have unique phone number across all active and inactive members
  - Financial calculations must maintain accuracy across all related records
  - All operations must complete atomically to prevent data inconsistency
  - Phone numbers stored as "+91[10digits]" format in database
- **Technical References**:
  - [Firestore Transactions](https://firebase.google.com/docs/firestore/manage-data/transactions)
  - [Callable Cloud Functions](https://firebase.google.com/docs/functions/callable)
  - [Data Validation Patterns](https://firebase.google.com/docs/functions/callable#handle_errors)

### 6.2. Generating Monthly Bills

- **Business Purpose**: Create comprehensive monthly billing for all active members including rent, utilities, and expenses
- **Trigger**: Admin initiates monthly billing process through the rent management interface
- **Implementation Strategy**: HTTP Callable Cloud Function with idempotency to prevent duplicate billing operations
- **Business Process Workflow**:
  1.  **Operation Verification**: Check if billing operation already completed to prevent duplicate charges
  2.  **Data Comparison**: For bill updates, analyze changes in electricity costs and bulk expenses
  3.  **Utility Bill Management**: Record electricity costs by floor with audit trail in `electricBills` collection
  4.  **Member Data Collection**: Gather all active members grouped by floor for cost calculations
  5.  **Cost Distribution Formulas**:
      - **Electricity**: `perMemberElectricityCost = Math.ceil(floorTotalElectricity / membersOnFloorCount)`
      - **WiFi**: `perMemberWifiCost = Math.ceil(wifiMonthlyCharge / wifiOptedInCount)`
      - **Bulk Expenses**: Applied either individually (each member pays full amount) or split equally among selected members using `Math.ceil()` for divisions
  6.  **WiFi Preference Updates**: Atomically update member `optedForWifi` boolean based on admin selections
  7.  **Batch Processing**: Process members efficiently while maintaining transaction integrity
  8.  **Individual Billing**: For each active member, run atomic transaction:
      - Read current `outstandingBalance` as `previousOutstanding`
      - Calculate `totalCharges = currentRent + electricityCost + wifiCost + sum(bulkExpenses)`
      - Create/Update rentHistory document for billing month with:
        - `previousOutstanding`: member's balance before this bill
        - `totalCharges`: calculated monthly charges
        - `amountPaid`: 0 (initially)
        - `currentOutstanding`: previousOutstanding + totalCharges
        - `status`: 'Due'
      - Update member's `outstandingBalance` by adding totalCharges
  9.  **System Counter Updates**: Update `activememberCounts.wifiOptedIn` based on preference changes
  10. **Billing Cycle Advancement**: Update `currentBillingMonth` and `nextBillingMonth` timestamps
- **Business Rules**:
  - **Idempotency**: Each billing operation must be unique and repeatable without side effects
  - **Electricity Distribution**: Costs split equally among all members on the same floor
  - **WiFi Distribution**: Costs split equally among all members who opted for WiFi service
  - **Bulk Processing**: Handle multiple members efficiently without compromising data integrity
  - **Expense Types**: Support both individual charges and split expenses among member groups
  - **Billing Consistency**: All member balances must reflect accurate monthly charges and payments
- **Technical References**:
  - [Firestore Batch Operations](https://firebase.google.com/docs/firestore/manage-data/batched-writes)
  - [Transaction Best Practices](https://firebase.google.com/docs/firestore/manage-data/transactions#best_practices)
  - [Callable Functions Error Handling](https://firebase.google.com/docs/functions/callable#handle_errors)

### 6.3. Recording Payments

- **Business Purpose**: Track and apply member payments to their outstanding balances with full audit trail
- **Trigger**: Admin records payment through the "Record Payment Modal" interface
- **Implementation Strategy**: HTTP Callable Cloud Function ensures financial transaction accuracy and consistency
- **Business Process Workflow**:
  1.  **Payment Validation**: Verify member identity, payment amount, and optional payment notes
  2.  **History Access**: Retrieve current month's billing record for payment application
  3.  **Payment Logging**: Add detailed payment entry to `payments` array with unique identifier, amount, date, and notes
  4.  **Amount Reconciliation**: Recalculate rentHistory amounts:
      - Update `amountPaid` by summing all payment entries in the payments array
      - Recalculate `currentOutstanding = previousOutstanding + totalCharges - amountPaid`
  5.  **Status Calculation**: Determine billing status using precise logic with rounding tolerance:
      - `if (Math.abs(amountPaid - totalCharges) <= 1) status = 'Paid'` (₹1 tolerance for rounding)
      - `else if (amountPaid > totalCharges) status = 'Overpaid'`
      - `else if (amountPaid > 0) status = 'Partially Paid'`
      - `else status = 'Due'`
  6.  **Balance Updates**: Atomically update member's main `outstandingBalance` to reflect payment
  7.  **Note Management**: Update member's `outstandingNote` field for future reference
- **Business Rules**:
  - **Financial Precision**: All monetary calculations maintain accuracy and consistency
  - **Audit Trail**: Every payment must be traceable with complete transaction details using unique paymentId
  - **Status Accuracy**: Billing status must accurately reflect member's payment position
  - **Payment Allocation**: Payments applied to current month's billing record
  - **Transaction Atomicity**: All payment updates (rentHistory + member balance + status) occur in single transaction
- **Technical References**:
  - [Firestore Atomic Operations](https://firebase.google.com/docs/firestore/manage-data/transactions#atomic_operations)
  - [Financial Data Best Practices](https://firebase.google.com/docs/firestore/solutions/store-numbers)

### 6.4. Recording Ad-hoc Expenses

- **Business Purpose**: Apply additional charges to individual members for special expenses or services
- **Trigger**: Admin adds expenses through member-specific expense modal
- **Implementation Strategy**: HTTP Callable Cloud Function for secure expense management and balance updates
- **Business Process Workflow**:
  1.  **Expense Validation**: Verify member identity and validate all expense item details
  2.  **Billing Access**: Access current month's billing record for expense application
  3.  **Expense Addition**: Record expense items with unique identifiers and detailed descriptions
  4.  **Charge Calculation**: Update total monthly charges including all new expenses
  5.  **Balance Adjustment**: Apply expense amounts to member's outstanding balance
- **Business Rules**:
  - **Multi-Expense Support**: Handle multiple expense items in single operation for efficiency
  - **Expense Tracking**: Each expense must have unique identifier for audit purposes
  - **Balance Consistency**: All expense additions must reflect accurately in member's total balance
- **Technical References**:
  - [Array Updates in Firestore](https://firebase.google.com/docs/firestore/manage-data/add-data#update_elements_in_an_array)
  - [Transaction Patterns](https://firebase.google.com/docs/firestore/manage-data/transactions)

### 6.5. Deactivating a Member

- **Business Purpose**: Process member departures with complete financial settlement and account closure
- **Trigger**: Admin confirms member deactivation through the management interface
- **Implementation Strategy**: HTTP Callable Cloud Function with automated settlement calculations and account status updates
- **Business Process Workflow**:
  1.  **Departure Validation**: Verify member identity and validate departure date
  2.  **Settlement Analysis**: Calculate final financial settlement using precise business logic:
      - Get latest rentHistory document for current billing month
      - **Current Month Payment Check**:
        - If current month status is 'Paid': `finalOutstanding = member.outstandingBalance`
        - If current month status is not 'Paid': `finalOutstanding = member.outstandingBalance - member.advanceDeposit`
      - **Refund Calculation**: `refundAmount = member.totalAgreedDeposit - finalOutstanding`
      - **Settlement Explanation Logic**:
        - `totalAgreedDeposit = rentAtJoining + advanceDeposit + securityDeposit`
        - If member paid current month: advance deposit returned (current rent already paid)
        - If member didn't pay current month: advance deposit covers current rent, remainder returned
  3.  **Account Deactivation**: Update member status in atomic transaction:
      - Set `isActive` to false
      - Set `leaveDate` to admin-selected date
      - Set `ttlExpiry` to future date for automatic data cleanup
  4.  **System Updates**: Atomically update global member counters:
      - Decrement `activememberCounts.total` and `activememberCounts.byFloor[member.floor]`
      - If `optedForWifi` was true, decrement `activememberCounts.wifiOptedIn`
  5.  **Settlement Reporting**: Return calculated settlement details to admin interface for review
  6.  **Data Retention**: Configure TTL policy for automatic cleanup of inactive member records
- **Business Rules**:
  - **Settlement Accuracy**: Final settlement must account for security deposits, advance payments, and outstanding charges
  - **Advance Deposit Logic**: Advance deposit covers unpaid current month rent if applicable
  - **Data Retention**: TTL policy automatically removes inactive member data after specified period
  - **Counter Consistency**: System-wide member counts must reflect active status changes
  - **Transaction Atomicity**: All deactivation operations complete atomically or rollback entirely
- **Technical References**:
  - [Firestore TTL](https://firebase.google.com/docs/firestore/ttl)
  - [Transaction Consistency](https://firebase.google.com/docs/firestore/manage-data/transactions#transaction_failures)

### 6.6. Member Login & Account Linking

- **Business Purpose**: Enable secure access to personal rent information for members and administrative access for admins through Google authentication
- **Trigger**: User initiates Google Sign-In through the application interface
- **Implementation Strategy**: Secure authentication workflow with role-based routing and account linking capability

#### 6.6.1. Complete Authentication Workflow

- **Frontend Process**:

  1.  **Google Sign-In Initiation**: User clicks "Sign in with Google" button
  2.  **Firebase Authentication**: Client receives `idToken` from successful Firebase Auth sign-in
  3.  **Backend Verification**: Client sends `idToken` to secure HTTP Callable Function
  4.  **Role-Based Routing**: System determines user role and redirects accordingly

- **Backend Verification Function**:
  1.  **Token Security**: Verify `idToken` using Firebase Admin SDK (mandatory security step)
  2.  **User Identification**: Extract `uid` from decoded authentication token
  3.  **Admin Role Check**: Query `config/admins` collection to check if user is admin
  4.  **Member Account Search**: Query `members` collection where `firebaseUid` matches `uid`
  5.  **Access Determination**: Route user based on role and account status

#### 6.6.2. User Role Routing Logic

- **Admin Access Path**:
  1.  **Admin Verification**: If user `uid` found in `config/admins.list`
  2.  **Dashboard Routing**: Direct user to Admin Dashboard interface
  3.  **Full Access**: Provide complete system access with administrative privileges
- **Member Access Path**:
  1.  **Member Account Search**: Query members where `firebaseUid == uid` and `isActive == true`
  2.  **Existing Account**: If found, route to Member Dashboard with personal data access
  3.  **Account Linking Required**: If not found, initiate account linking process

#### 6.6.3. Account Linking Process (Members Only)

- **Account Not Linked Scenario**:
  1.  **Error Response**: Return specific error code `account-not-linked` to client
  2.  **Phone Verification UI**: Display modal prompting for registered phone number
  3.  **Link Account Function**: Send `idToken` and `phoneNumber` to `linkAccount` function
- **Link Account Function Process**:

  1.  **Token Verification**: Verify `idToken` using Firebase Admin SDK
  2.  **Phone Number Search**: Query members where `phone` matches provided number and `isActive == true` and `firebaseUid == null`
  3.  **OTP Verification Process**:
      - If member found: Initiate OTP verification to the registered phone number
      - Send OTP via SMS using Firebase phone authentication or third-party service
      - User enters OTP in verification modal
      - Backend verifies OTP authenticity and expiration
  4.  **Account Linking**: Only after successful OTP verification:
      - Run transaction to update member record with `firebaseUid`
      - Link Google account to member data permanently
  5.  **Access Grant**: Return member data and route to Member Dashboard
  6.  **Error Handling**:
      - **Phone Not Found**: Return `member-not-found` error
      - **OTP Invalid**: Return `invalid-otp` error
      - **OTP Expired**: Return `otp-expired` error
      - **Account Already Linked**: Return `account-already-linked` error

- **Business Rules**:

  - **Security Priority**: All authentication tokens must be verified server-side
  - **OTP Security**: OTP verification mandatory for account linking to prevent unauthorized access
  - **Role Separation**: Clear separation between admin and member access levels
  - **Account Integrity**: Phone verification with OTP prevents unauthorized account linking
  - **Active Status**: Only active members can link accounts and access dashboards
  - **Single Linking**: Each member account can only be linked to one Google account
  - **Privacy Protection**: Members access only their own data with appropriate filtering

- **Error Handling**:

  - **Invalid Token**: Return authentication failure error
  - **Account Not Found**: Guide user through appropriate linking or access denial
  - **Inactive Member**: Deny access for deactivated member accounts
  - **Phone Mismatch**: Return clear error message for incorrect phone verification

- **Technical References**:
  - [Firebase Auth Admin SDK](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
  - [Authentication Best Practices](https://firebase.google.com/docs/auth/admin/manage-sessions)
  - [Security Rules for User Data](https://firebase.google.com/docs/firestore/security/rules-query)
  - [Token Verification Guide](https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_the_firebase_admin_sdk)

---

## 7. Member UI Specifications

### 7.1. Login Page (Unified Entry Point)

- **Layout**: Clean, simple login interface focused on Google Sign-In for both members and admins.
- **Components**:
  - App logo and welcome message
  - "Sign in with Google" button (large, prominent)
  - Brief description: "Access your dashboard - members view rent information, admins manage the system"
- **Authentication Flow**:
  - **Single Entry Point**: Same login interface for both members and admins
  - **Role Detection**: Backend determines user role after successful Google authentication
  - **Automatic Routing**: Users automatically directed to appropriate dashboard based on role

#### 7.1.1. Post-Authentication Routing

- **Admin Users**:
  - **Detection**: User ID found in `config/admins.list`
  - **Destination**: Redirect to Admin Dashboard with full system access
  - **Access Level**: Complete administrative privileges for all system functions
- **Existing Members**:
  - **Detection**: User has linked account (`firebaseUid` exists and `isActive: true`)
  - **Destination**: Redirect to Member Dashboard with personal data access
  - **Access Level**: Read-only access to personal rent and payment information

#### 7.1.2. Account Linking Flow (New Members Only)

- **Phone Verification Modal**: Appears when member account linking is required
  - **Trigger**: User authenticated but no linked member account found
  - **Title**: "Link Your Account"
  - **Description**: "Enter your registered phone number to access your dashboard"
  - **Input Field**: 10-digit phone number input with validation
  - **Submit Button**: "Link Account" button
  - **Cancel Button**: "Use Different Account" (triggers sign out)
  - **Validation**: Real-time phone number format validation
  - **Error Handling**: Clear error messages for invalid phone numbers or account not found scenarios

### 7.2. Member Dashboard

- **Purpose**: Provides members read-only access to their rent and payment information.
- **Layout**: Single-page dashboard with organized sections, real-time data via onSnapshot.
- **Loading States**: Mantine Skeleton components for all sections during data loading.

#### 7.2.1. Member Profile Section (Collapsible)

- **Default State**: Collapsed
- **Header**:
  - **Mantine Avatar**: Google profile picture (if available) or first letter of name
  - **Name**: Member's full name
  - **Expand/Collapse Icon**: Chevron icon
- **Content (When Expanded)**:
  - **Phone**: Formatted as clickable `tel:` link
  - **Floor & Bed Type**: e.g., "2nd Floor - Bed"
  - **Move-in Date**: Formatted date (e.g., "Joined: Jan 15, 2024")
  - **Current Rent**: Indian currency format (₹1,600/month)
  - **WiFi Status**: "WiFi: Opted In" or "WiFi: Opted Out"

#### 7.2.2. Current Month's Rent Section

- **Data Source**: Latest `rentHistory` document for `config.currentBillingMonth`
- **Layout**: Prominent card with detailed breakdown
- **Header**:
  - **Month**: e.g., "June 2025 Bill"
  - **Status Badge**: Color-coded status (Due/Paid/Partially Paid/Overpaid)
- **Content**:
  - **Outstanding Balance**: Large, prominent amount with UPI payment button
    - **Color Coding**: Red (owes), Green (credit), Neutral (zero)
    - **UPI Button**: "Pay ₹1,500" button (only if balance > 0)
  - **Bill Breakdown**:
    - Rent: ₹1,600
    - Electricity: ₹245
    - WiFi: ₹30 (if applicable)
    - Expenses: ₹150 (if any, with descriptions)
    - **Total Charges**: ₹2,025
  - **Payment History**: List of payments made for this month (if any)
    - Date, Amount, Payment method/note

#### 7.2.3. Rent History Section

- **Initial State**: Hidden behind "Show Rent History" button
- **Button**: "Show Rent History" - loads and displays historical data
- **Layout**: Accordion-style list (Mantine Accordion, `variant="separated"`)
- **Data Loading**: Fetches 12 months of history (excluding current month)
- **Load More**: Button at bottom to load next 12 months (chronologically newer to older)

##### Rent History Accordion Items

- **Header**:
  - **Month**: e.g., "May 2025"
  - **Status Badge**: Color-coded status
  - **Amount**: Outstanding balance for that month
- **Content (Expanded)**:
  - Same breakdown as current month section
  - **Bill Details**: Rent, electricity, WiFi, expenses
  - **Payment History**: All payments made for that month
  - **Final Status**: Clear indication of payment status

#### 7.2.4. UPI Payment Integration (Simplified)

- **Trigger**: Clicking "Pay ₹[amount]" button on outstanding balance
- **UPI URI Format**: `upi://pay?pa=[upiPhoneNumber]@paytm&pn=Rent Payment&am=[amount]&cu=INR&tn=Rent for [memberName] - [billingMonth]`
- **Parameters**:
  - `pa`: Admin's UPI ID from `config.upiPhoneNumber`
  - `pn`: "Rent Payment"
  - `am`: Outstanding balance amount
  - `tn`: Transaction note with member name and billing month
- **Behavior**: Opens device's default UPI app or shows app selection dialog
- **Post-Payment Flow**:
  - **Simple Instruction**: "After payment, send screenshot to admin at +91XXXXXXXXX"
  - **Manual Verification**: Admin records payment manually using screenshot verification
  - **No Gateway Integration**: Keeps system simple and cost-effective

#### 7.2.5. Member Actions

- **Logout**: Secure logout button in header/navigation
  - Clears Firebase Auth session
  - Redirects to login page
  - Shows confirmation dialog: "Are you sure you want to sign out?"

### 7.3. Admin History View (Member Dashboard for Admins)

- **Trigger**: Admin clicks "History" for a member in the rent management section
- **Layout**: Identical to member dashboard but with admin context
- **Header**:
  - **Back Button**: "← Back to Members" (returns to admin rent management)
  - **Member Name**: "Viewing: [Member Name]'s Dashboard"
- **Content**: Same sections as member dashboard (profile, current month, history)
- **Permissions**: Read-only view, no payment buttons shown
- **Real-time Data**: Uses onSnapshot for live updates

### 7.4. Member Data Access & Security

- **Data Filtering**: Members receive only their own data via Firestore Security Rules
- **Firestore Security Rules** (Member Access):
  - Implement rules to allow members to read only their own data where `firebaseUid` matches authenticated user
  - Allow member access only to their own `rentHistory` subcollection
  - Allow minimal `config/globalSettings` read access for UPI payment information
  - Follow official guide: [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- **Data Response Structure** (Backend filtering):
  - Return only member-relevant fields: `id`, `name`, `phone`, `floor`, `bedType`, `moveInDate`, `currentRent`, `outstandingBalance`, `optedForWifi`
  - Include `profilePicture` from Google Auth token
  - Exclude admin-only fields: `securityDeposit`, `totalAgreedDeposit`, `rentAtJoining`, `advanceDeposit`

### 7.5. Push Notifications (FCM)

- **New Bill Generated**:
  - **Trigger**: When admin generates monthly bills
  - **Target**: All active members with linked accounts
  - **Message**: "Your [Month Year] rent bill is ready. Amount due: ₹[amount]"
  - **Action**: Opens member dashboard when tapped
- **Payment Recorded**:
  - **Trigger**: When admin records a payment for a member
  - **Target**: Specific member whose payment was recorded
  - **Message**: "Payment of ₹[amount] received. Outstanding balance: ₹[balance]"
- **Implementation**:
  - Store FCM tokens when members log in
  - Send notifications via Cloud Functions
  - Handle notification permissions in the frontend

---

## 8. Member Workflows & Cloud Functions

### 8.1. Member Dashboard Data Fetching

- **Business Purpose**: Provide members with secure, personalized access to their rent and payment information
- **Implementation Strategy**: HTTP Callable Cloud Function `getMemberDashboard` with comprehensive authentication and data filtering
- **Authentication Requirements**:
  - **Identity Verification**: Confirm member identity through Firebase authentication token validation
  - **Access Control**: Ensure authenticated users can only access their own data
  - **Security Reference**: [Firebase Auth Admin SDK](https://firebase.google.com/docs/auth/admin)
- **Data Retrieval Process**:
  1.  **Member Identification**: Locate member record using authenticated user's Firebase UID
  2.  **Status Verification**: Confirm member account is active and in good standing
  3.  **Configuration Access**: Retrieve current billing period and payment information from system settings
  4.  **History Retrieval**: Fetch current month's billing details if available
  5.  **Data Filtering**: Return member-appropriate information excluding administrative sensitive data
- **Error Management**: Provide clear error messages for authentication failures and account access issues
- **Technical Reference**: [Cloud Functions for Firebase](https://firebase.google.com/docs/functions)

### 8.2. Member Rent History Fetching

- **Business Purpose**: Enable members to view their complete payment and billing history with efficient loading
- **Implementation Strategy**: HTTP Callable Cloud Function `getMemberRentHistory` with pagination support for optimal performance
- **Pagination Design**:
  - **Efficient Loading**: Load 12 months of history per request with cursor-based pagination
  - **User Experience**: Display newest records first with option to load more historical data
  - **Performance**: Use database cursors for efficient large dataset navigation
  - **Navigation**: Provide clear indicators for additional history availability
- **Data Security Workflow**:
  - **Ownership Verification**: Confirm member can only access their own rent history
  - **Current Month Exclusion**: Separate current month data from historical records for clarity
  - **Filtered Results**: Return only member-appropriate information without administrative details
- **Business Rules**:
  - **Historical Access**: Members can view complete payment history for transparency
  - **Performance Optimization**: Limit data transfer per request for responsive user experience
- **Technical References**:
  - [Paginate Data with Query Cursors](https://firebase.google.com/docs/firestore/query-data/query-cursors)
  - [Real-time Updates](https://firebase.google.com/docs/firestore/query-data/listen)

### 8.3. FCM Token Management

- **Business Purpose**: Enable push notifications for important billing and payment updates to members
- **Implementation Strategy**: HTTP Callable Cloud Function `updateFCMToken` for secure notification token management
- **Token Management Workflow**:
  1.  **Identity Verification**: Confirm member authentication before token updates
  2.  **Token Validation**: Verify FCM token format and validity
  3.  **Record Updates**: Store new notification token with timestamp for maintenance
  4.  **Maintenance Tracking**: Record token update history for troubleshooting notification issues
- **Business Rules**:
  - **Privacy Control**: Only authenticated members can update their own notification preferences
  - **Token Security**: Validate token format to prevent malicious or invalid tokens
  - **Update Tracking**: Maintain token update history for system maintenance
- **Technical Reference**: [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)

### 8.4. Push Notification System

- **Business Purpose**: Keep members informed about important billing events and payment confirmations
- **New Bill Generated Notifications**:
  - **Business Trigger**: Automatic notification when monthly bills are published
  - **Target Audience**: All active members with notification preferences enabled
  - **Message Content**: Personalized billing amount and due date information
  - **User Action**: Direct link to member dashboard for bill review and payment
  - **Implementation Approach**: Batch notification system for efficient delivery to multiple members
- **Payment Received Notifications**:
  - **Business Trigger**: Confirmation when admin records member payment
  - **Detection Method**: Monitor payment updates in member billing records
  - **Target Recipient**: Specific member whose payment was processed
  - **Message Content**: Payment amount confirmation and updated account balance
  - **Business Value**: Immediate payment confirmation builds trust and transparency
- **Notification Best Practices**:
  - **Delivery Reliability**: Graceful handling of invalid tokens with automatic cleanup
  - **Retry Mechanism**: Implement retry logic for failed notification deliveries
  - **Member Control**: Respect member notification preferences and opt-out requests
- **Technical References**:
  - [Send Messages to Multiple Devices](https://firebase.google.com/docs/cloud-messaging/send-message#send-messages-to-multiple-devices)
  - [FCM Error Handling](https://firebase.google.com/docs/cloud-messaging/manage-tokens#detect_invalid_token_responses_from_the_fcm_backend)

---

## 9. Performance & Security Enhancements

### 9.1. Required Database Indexes

For optimal query performance in the Members Management UI (Section 5.2):

- **Composite Index**: `members` collection on `[isActive, floor]` (for filtering by status and floor)
- **Composite Index**: `members` collection on `[isActive, name]` (for search with status filter)
- **Single Field Index**: `members` collection on `phone` (for phone number search)

### 9.2. Rate Limiting & Security

- **Firestore Security Rules Implementation**:
  - **Business Purpose**: Protect system from abuse while ensuring legitimate access for admins and members
  - **Rate Limiting Strategy**: Implement time-based request limiting to prevent system overload
    - **Admin Operations**: 1-second cooldown between administrative write operations
    - **Member Access**: Standard rate limits for member data retrieval
    - **Implementation**: Use `request.time` comparison for efficient rate limiting
  - **Admin Access Control**:
    - **Role Verification**: Confirm admin status through dedicated role checking function
    - **Authentication Requirements**: Ensure valid Firebase authentication with sign-in provider verification
    - **Operation Scope**: Apply rate limiting to all administrative write operations on member and configuration data
  - **Member Access Control**:
    - **Data Isolation**: Members can only read their own personal and billing information
    - **Ownership Verification**: Match authenticated user's Firebase UID with member records
    - **Limited Configuration Access**: Allow minimal configuration data access for payment functionality
- **Security Implementation References**:
  - [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/rules-conditions)
  - [Authentication in Security Rules](https://firebase.google.com/docs/firestore/security/rules-auth)
  - [Rate Limiting Patterns](https://firebase.google.com/docs/firestore/security/rules-conditions#time-based_security_rules)

### 9.3. Automated Data Cleanup

- **ElectricBills Cleanup**: Implement scheduled maintenance for optimal system performance
  - **Business Purpose**: Maintain system performance by managing historical data retention
  - **Retention Policy**: Preserve 12 months of electricity billing data for reporting and analysis
  - **Automation Schedule**: Monthly execution on the 1st day at 1 AM for consistent maintenance
  - **Cleanup Workflow**:
    1.  **Date Calculation**: Determine data retention cutoff based on 12-month policy
    2.  **Data Identification**: Query electricity bills collection for outdated records
    3.  **Batch Removal**: Use efficient batch operations to remove multiple outdated documents
    4.  **Operation Logging**: Record cleanup results for system monitoring and compliance
  - **Technical Implementation**: [Schedule Functions with Cloud Scheduler](https://firebase.google.com/docs/functions/schedule-functions)
- **Member Data Retention**:
  - **Business Purpose**: Automatically manage inactive member data while preserving necessary records
  - **TTL Configuration**: Set Firestore Time-To-Live policy on member collection using `ttlExpiry` field
  - **Retention Period**: Configurable retention period for compliance with legal and business requirements
  - **Data Lifecycle**: Inactive member records automatically removed after specified retention period
  - **Implementation Guide**: [Firestore TTL](https://firebase.google.com/docs/firestore/ttl)

---

## 10. Essential Data Management & Security

### 10.1. Financial Calculations & Business Logic

- **Member Balance Management**: Real-time financial tracking with atomic updates
  - **Trigger Events**: Balance updates occur whenever billing records change
  - **Calculation Logic**:
    - `totalAgreedDeposit = rentAtJoining + advanceDeposit + securityDeposit`
    - `initialOutstandingBalance = totalAgreedDeposit - actualAmountPaid`
    - `currentOutstanding = previousOutstanding + totalCharges - amountPaid`
  - **Data Consistency**: Maintain accurate member financial position across all transactions
- **System Counter Management**: Accurate occupancy and service statistics
  - **Member Counts**: Track total active members and floor-wise distribution
  - **Service Tracking**: Monitor WiFi service subscriptions for billing accuracy
  - **Update Events**: Counter adjustments during member lifecycle and billing cycles
- **Payment Status Automation**: Automatic status determination with ₹1 tolerance
  - **Status Logic**:
    - `if (Math.abs(amountPaid - totalCharges) <= 1) status = 'Paid'`
    - `else if (amountPaid > totalCharges) status = 'Overpaid'`
    - `else if (amountPaid > 0) status = 'Partially Paid'`
    - `else status = 'Due'`

### 10.2. Essential Security & Access Control

- **Admin Access Control**:
  - **Role Verification**: Confirm admin status through `config/admins.list`
  - **Rate Limiting**: 1-second cooldown between administrative write operations
  - **Full System Access**: Complete administrative privileges for all operations
- **Member Access Control**:
  - **Data Isolation**: Members access only their own data (`firebaseUid` match)
  - **Ownership Verification**: Strict Firebase UID verification for all member operations
  - **Limited Config Access**: Minimal `globalSettings` read access for UPI payments only
- **Security Implementation**:
  - **Authentication**: All operations require valid Firebase tokens
  - **Rate Limiting**: Time-based request limiting using `request.time` comparison
  - **References**: [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

### 10.3. Transaction Integrity & Error Handling

- **Atomic Operations**: All financial operations use Firestore transactions
  - **Member Addition**: Create member + initial rentHistory + update counters (single transaction)
  - **Payment Recording**: Update rentHistory + member balance + status (single transaction)
  - **Bill Generation**: Batch create rentHistory + update balances atomically
  - **Member Deactivation**: Update member + counters + calculate settlement (single transaction)
- **Rollback Protection**: Automatic reversal of incomplete operations
- **Error Recovery**: User-friendly error messages with retry mechanisms
- **Technical References**:
  - [Firestore Transactions](https://firebase.google.com/docs/firestore/manage-data/transactions)
  - [Batch Write Operations](https://firebase.google.com/docs/firestore/manage-data/batched-writes)

### 10.4. Batch Operations (Essential for Efficiency)

- **Rent Rate Updates**: When config rates change, batch update all affected members
  - **Process**: Query members by floor/bedType → Batch update `currentRent` → Notify affected members
  - **Atomicity**: All updates complete successfully or rollback entirely
- **Bill Generation**: Batch process for all active members
  - **WiFi Preference Updates**: Batch update `optedForWifi` boolean
  - **Individual Billing**: Atomic transaction for each member's rentHistory + balance update
  - **Notification Batch**: Send billing notifications to all affected members
- **Cost Distribution Formulas** (Precise Calculations):
  - **Electricity**: `perMemberCost = Math.ceil(floorTotalElectricity / membersOnFloorCount)`
  - **WiFi**: `perMemberCost = Math.ceil(wifiMonthlyCharge / wifiOptedInCount)`
  - **Bulk Expenses**: Individual or split equally using `Math.ceil()` for divisions

---

## 11. Business Rules & Operational Policies

### 11.1. Data Retention and TTL Policies

- **Member Data Retention**:
  - **Inactive Members**: Permanently deleted via TTL policy when `ttlExpiry` timestamp is reached
  - **No Archiving**: Complete data removal including all subcollections (rentHistory)
  - **TTL Period**: Configurable via admin settings, typically 1 year for compliance
- **Electric Bills Cleanup**:
  - **Automatic Deletion**: Electric bills older than 12 months permanently removed
  - **Scheduled Cleanup**: Monthly automated process removes outdated records
  - **No Archiving**: Complete permanent deletion for storage optimization

### 11.2. Payment Allocation and Balance Management

- **Outstanding Balance Calculation**:
  - **Monthly Recalculation**: `outstandingBalance` recalculated each billing cycle based on cumulative charges and payments
  - **Single Source of Truth**: Member's `outstandingBalance` reflects total amount owed across all months
  - **No Monthly Allocation**: Payments reduce overall outstanding balance, not allocated to specific months
  - **Balance Formula**: `Sum of all (previousOutstanding + totalCharges - amountPaid)` across all rentHistory records

### 11.3. Member Reactivation Process

- **Process Flow**: Reactivation uses the existing Add Member workflow for simplicity and consistency
- **UI Implementation**:
  - Open the Add Member modal for reactivation
  - Pre-populate only the `name` and `phone` fields from previous member record
  - All other fields (deposits, rates, bed assignment) follow standard new member logic
- **Business Logic**:
  - Treats reactivation as fresh onboarding with current market rates
  - Allows admin full control over all terms at time of reactivation
  - Applies current configuration rates and deposit requirements
  - No special handling for previous outstanding balances (fresh start approach)
- **Technical Benefits**:
  - Reuses existing, tested Add Member workflow
  - No complex business logic for handling legacy data
  - Maintains data consistency and audit trail clarity
  - Reduces code complexity and potential for errors

### 11.4. Billing Month Transitions and Edge Cases

- **No Pro-rating**: All charges applied on monthly basis regardless of join/leave date within month
- **Full Month Charges**: Members joining mid-month pay full monthly rent, electricity, and WiFi charges
- **Full Month Settlement**: Members leaving mid-month are charged for entire month in settlement calculation
- **Monthly Billing Cycle**: Bills generated on 1st of each month for the current month period
- **WiFi Changes**: Members opting in/out of WiFi mid-month pay/save full monthly WiFi charges from next billing cycle

### 11.6. Expense Management

- **No Categories**: Expenses not categorized, simple amount and description format
- **No Restrictions**: No spending limits or approval workflows for bulk or individual expenses
- **Admin Authority**: Any admin can add expenses without additional authorization

### 11.7. Bill Generation and Updates

- **Manual Process**: All bill generation and updates initiated manually by admin
- **No Change Tracking**: Bill updates replace previous data without audit trail of changes
- **Notification Strategy**: Updated bills trigger "Bills regenerated" notification to affected members
- **Idempotency**: Multiple bill generations for same month replace previous data safely

### 11.8. Floor and Rent Rate Management

- **Fixed Floor Structure**: System supports exactly 2 floors ('2nd', '3rd') as configured
- **Dynamic Rent Updates**: Admins can modify bed/room rates in global configuration
- **Member Rent Impact**: When bed rates are updated in configuration, existing members' `currentRent` automatically updates via batch operation
  - **Implementation**: Batch update all members with matching floor/bedType to apply new rates
  - **Scope**: All active members with the same floor and bed type receive the updated rate
  - **Timing**: Rate changes apply immediately to all affected members
  - **Notification**: Members receive notification of rate changes through the system
  - **Fairness**: Ensures uniform pricing across identical accommodations

### 11.9. Member Reactivation Process

- **Process Flow**: Reactivation uses the existing Add Member workflow for simplicity and consistency
- **UI Implementation**:
  - Open the Add Member modal for reactivation
  - Pre-populate only the `name` and `phone` fields from previous member record
  - All other fields (deposits, rates, bed assignment) follow standard new member logic
- **Business Logic**:
  - Treats reactivation as fresh onboarding with current market rates
  - Allows admin full control over all terms at time of reactivation
  - Applies current configuration rates and deposit requirements
  - No special handling for previous outstanding balances (fresh start approach)

## 12. Implementation Notes

### 12.1. Batch Rent Updates

When configuration bed rates change, implement the following process:

1. **Identify Affected Members**: Query all active members with matching floor/bedType combination
2. **Batch Update**: Use Firestore batch operations to update all affected members' `currentRent` field
3. **Atomic Operation**: Ensure all updates complete successfully or rollback entirely
4. **Audit Trail**: Log all rate changes and affected members for administrative review
5. **Notification**: Send automated notifications to affected members about rate changes

### 12.2. Member Reactivation Implementation

When reactivating an inactive member:

1. **UI Flow**: Admin selects "Reactivate" for inactive member → Opens Add Member modal
2. **Pre-population**: Only populate `name` and `phone` fields from previous record
3. **Current Rates**: All financial fields auto-populate with current configuration values
4. **Standard Validation**: Apply same validation rules as new member addition
5. **Fresh Record**: Create new member record with current terms (no data migration from old record)

---

## 3. Backend Validation Framework

### 3.1. Input Validation Schema (Zod 4)

- **Library Choice**: Zod 4.x for TypeScript-first schema validation with enhanced performance
- **Schema Definition**: Define comprehensive validation schemas for all data structures
  - Member data validation (name with 2+ words requirement, phone format, financial fields, dates)
  - Configuration data validation (rates, settings, admin lists)
  - Payment data validation (amounts, dates, notes)
  - Billing data validation (charges, expenses, member selections)
- **Enhanced Validation Rules**:
  - **Name Validation**: Must contain at least 2 words (validated using `.refine()` method)
  - **Phone Format**: Standard Indian mobile format validation (+91XXXXXXXXXX)
  - **Financial Fields**: Positive number validation with decimal precision
- **Type Safety**: Automatic TypeScript type inference from Zod schemas
- **Error Messages**: Custom error messages for user-friendly validation feedback
- **Reference**: [Zod 4 Documentation](https://zod.dev/)

### 3.2. Function-Level Validation Middleware

- **HTTP Callable Functions**: Implement validation middleware for all Cloud Functions
- **Token Verification**: Mandatory Firebase Auth token validation for all authenticated endpoints
- **Request Validation**: Validate all incoming request data against defined schemas
- **Response Sanitization**: Ensure consistent response format and data filtering
- **Error Throwing Pattern**: Functions throw detailed validation errors, UI handles all error presentation

### 3.3. Business Logic Validation

- **Uniqueness Constraints**:
  - **Phone Number Uniqueness**: Across ALL members (active and inactive) to prevent any duplicates
  - **Name Uniqueness**: Across ALL members (active and inactive) within same floor to prevent confusion
  - **Admin Email Uniqueness**: Prevent duplicate admin accounts in admin list
- **Name Format Validation**:
  - **Minimum Words**: Name must contain at least 2 words (firstName lastName minimum)
  - **Word Separation**: Validated using trim and split operations on whitespace
  - **Character Validation**: Allow alphabetic characters and common name symbols
- **Payment Amount Validation**:
  - **Positive Numbers**: All financial inputs must be positive values
  - **Maximum Limits**: Prevent accidental large payments (configurable upper bounds)
  - **Decimal Precision**: Support precise monetary amounts with decimal validation
- **Phone Number Format**:
  - **Indian Mobile Standard**: +91XXXXXXXXXX format enforcement
  - **10-Digit Validation**: Verify exactly 10 digits after country code
  - **Format Normalization**: Consistent storage format across all records

### 3.4. Rate Limiting (rate-limiter-flexible)

- **Library Choice**: rate-limiter-flexible for robust rate limiting
- **Admin Operations**:
  - 1 request per second for write operations
  - 10 requests per minute for bulk operations (bill generation)
  - Higher limits for read operations
- **Member Operations**:
  - Standard rate limits for dashboard access
  - Stricter limits for sensitive operations (account linking)
- **IP-based Limiting**: Additional protection against abuse from specific IPs
- **Exponential Backoff**: Progressive penalty for repeated violations
- **Reference**: [rate-limiter-flexible Documentation](https://github.com/animir/node-rate-limiter-flexible)

### 3.5. Firestore Security Rules Validation

- **Role-Based Access Control (RBAC)**:
  - Admin-only access to member management and configuration
  - Member access restricted to own data only
  - Guest access denied to all sensitive collections
- **Field-Level Validation**:
  - Required field validation at database level
  - Data type validation (strings, numbers, booleans)
  - Value range validation (positive numbers, valid dates)
- **Time-Based Security**:
  - Rate limiting using request.time comparison
  - Operation cooldown periods for sensitive operations
- **Custom Validation Functions**:
  - Phone number format validation
  - Admin role verification function
  - Member ownership verification
- **Reference**: [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/rules-conditions)

### 3.6. Error Handling and Logging

- **Firebase Functions Logging**:
  - **Built-in Logging**: Use Firebase Functions built-in logging capabilities
  - **Log Levels**: functions.logger.error(), .warn(), .info(), .debug()
  - **Request Correlation**: Automatic request tracking through Firebase infrastructure
- **Error Categories**:
  - **Validation Errors**: Specific field validation failures with detailed messages
  - **Uniqueness Violations**: Phone/name duplicate detection with clear identification
  - **Authentication Errors**: Token validation and authorization failures
  - **Business Logic Errors**: Insufficient balance, invalid operations
  - **System Errors**: Database connection, external service failures
- **Error Throwing Pattern**:
  ```typescript
  // Functions throw errors with specific codes
  throw new functions.https.HttpsError('invalid-argument', 'Phone number already exists', {
    field: 'phone',
    conflictingMemberId: 'existing-member-id',
  });
  ```
- **Client Error Handling**: UI components catch and present errors using Mantine notifications

### 3.7. Frontend Validation Integration (React 19)

- **useActionState Hook**:
  - Manage form states with built-in error handling
  - Server action integration for seamless validation
  - Optimistic updates with automatic rollback on errors
- **Real-time Validation**:
  - Client-side validation using same Zod 4 schemas
  - Immediate feedback for user input validation
  - Server validation as final authority
- **Form State Management**:
  - Loading states during validation
  - Error state display with specific field errors
  - Success state with user feedback
- **Validation Timing**:
  - onChange validation for immediate feedback (name word count, phone format)
  - onBlur validation for field completion
  - onSubmit validation as final check before server submission
- **Error Display**: Mantine notification system for consistent error presentation

### 3.8. Key Benefits and Best Practices

- **Type Safety**: End-to-end type safety from frontend to database using Zod 4
- **Performance**: Client-side validation reduces server load
- **User Experience**: Immediate feedback with clear error messages
- **Security**: Multiple layers of validation prevent malicious input
- **Maintainability**: Centralized validation logic reduces code duplication
- **Scalability**: Consistent validation patterns across all operations
- **Testing**: Validation schemas enable comprehensive unit testing
- **Documentation**: Self-documenting validation rules through schema definitions
- **Data Integrity**: Name and phone uniqueness across all members prevents conflicts

### 3.9. Implementation Priority

1. **Phase 1**: Core validation schemas (member with 2+ word names, phone/name uniqueness, admin email uniqueness)
2. **Phase 2**: Rate limiting and security rules implementation
3. **Phase 3**: Frontend integration with React 19 features and error handling
4. **Phase 4**: Advanced Firebase logging and monitoring
5. **Phase 5**: Performance optimization and comprehensive testing

This validation framework ensures robust data integrity, security, and user experience while maintaining simplicity. The framework leverages Zod 4's enhanced performance, enforces business-critical uniqueness constraints, and provides clear error handling patterns that integrate seamlessly with the modern React 19 technology stack.

---

## 6.7. Admin Management Functions

#### 6.7.1. Adding Secondary Admins

- **Business Purpose**: Allow primary admin to add secondary administrators with standard access privileges
- **Trigger**: Primary admin submits "Add Admin" form through the admin management interface
- **Implementation Strategy**: HTTP Callable Cloud Function `addSecondaryAdmin` with strict access control
- **Access Control**: Only primary admin (Firebase account holder) can add secondary admins
- **Business Process Workflow**:
  1.  **Permission Verification**: Confirm requesting user is primary admin using `primaryAdminUid`
  2.  **Email Validation**: Validate email format and Google account existence
  3.  **Duplicate Check**: Ensure email is not already in admin list
  4.  **Limit Verification**: Check against `maxAdmins` limit to prevent excessive admin accounts
  5.  **Admin Addition**: Add new admin to `admins.list` array with secondary role
  6.  **Audit Trail**: Record who added the admin and when for security tracking
  7.  **Notification**: Send email notification to new admin about their access
- **Business Rules**:
  - **Hierarchy Control**: Only primary admin can manage secondary admins
  - **Google Account Requirement**: All admins must have valid Google accounts for authentication
  - **Role Restrictions**: Secondary admins cannot add or remove other admins
  - **Audit Requirements**: All admin management actions must be logged with timestamps
- **Technical References**:
  - [Admin SDK User Management](https://firebase.google.com/docs/auth/admin/manage-users)
  - [Array Operations in Firestore](https://firebase.google.com/docs/firestore/manage-data/add-data#update_elements_in_an_array)

#### 6.7.2. Removing Secondary Admins

- **Business Purpose**: Allow primary admin to revoke secondary administrator access
- **Trigger**: Primary admin confirms admin removal through the admin management interface
- **Implementation Strategy**: HTTP Callable Cloud Function `removeSecondaryAdmin` with access verification
- **Access Control**: Only primary admin can remove secondary admins, cannot remove themselves
- **Business Process Workflow**:
  1.  **Permission Verification**: Confirm requesting user is primary admin
  2.  **Target Validation**: Ensure target admin exists and is not primary admin
  3.  **Role Verification**: Confirm target admin has secondary role (cannot remove primary)
  4.  **Admin Removal**: Remove admin from `admins.list` array
  5.  **Session Invalidation**: Optionally invalidate existing sessions for removed admin
  6.  **Audit Logging**: Record removal action with timestamp and reason
  7.  **Notification**: Inform removed admin of access revocation
- **Business Rules**:

  - **Primary Protection**: Primary admin cannot be removed or demoted
  - **Self-Protection**: Admins cannot remove themselves (prevents lockout)

  - **Clean Removal**: Ensure all admin privileges are revoked immediately
  - **Audit Trail**: Maintain complete record of admin additions and removals

- **Technical References**:
  - [Firestore Array Updates](https://firebase.google.com/docs/firestore/manage-data/add-data#update_elements_in_an_array)
  - [Security Rules for Admin Operations](https://firebase.google.com/docs/firestore/security/rules-auth)

#### 6.7.3. Admin Authentication and Role Verification

- **Business Purpose**: Verify admin status and role level for system access control
- **Implementation Strategy**: Enhanced authentication function with role-based access control
- **Role Hierarchy**:
  - **Primary Admin**: Full system access including admin management capabilities
  - **Secondary Admin**: Standard admin access excluding admin management functions
- **Authentication Process**:
  1.  **Token Verification**: Validate Firebase authentication token
  2.  **Admin List Query**: Check if user UID exists in `admins.list` array
  3.  **Role Identification**: Determine if user is primary or secondary admin
  4.  **Permission Mapping**: Return appropriate permission set based on role
  5.  **Session Management**: Establish admin session with role-based access
- **Business Rules**:
  - **Role-Based Access**: Different UI and functionality based on admin level
  - **Dynamic Permissions**: Admin capabilities can be adjusted based on role
  - **Security Priority**: All admin operations require token verification
  - **Session Security**: Admin sessions include role information for frontend access control
- **Technical References**:
  - [Custom Claims for Role-Based Access](https://firebase.google.com/docs/auth/admin/custom-claims)
  - [Security Rules with Custom Claims](https://firebase.google.com/docs/firestore/security/rules-auth#custom_claims)
