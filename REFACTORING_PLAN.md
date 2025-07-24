# Context-Centric Refactoring Plan

## Overview

This document outlines the complete refactoring strategy to consolidate `AppContext.tsx` and `firestoreService.ts` into
a clean, maintainable architecture without adding layers.

## Current Problem

### File Sizes & Issues

- **AppContext.tsx**: ~770 lines (too large, mixed responsibilities)
- **firestoreService.ts**: ~700+ lines (duplicated real-time logic, over-aggregation)
- **Total**: ~1470 lines with significant duplication

### Key Issues

- Duplicate onSnapshot subscription logic in both files
- Mixed responsibilities in AppContext (state + operations + utilities)
- Over-aggregation in firestoreService with minimal value
- Complex interdependencies between the two files

## Solution: Context-Centric with Real-time Integration

### Core Architecture Principle

```
AppContext (Real-time State) ← onSnapshot ← Firestore
    ↓ (provides state)
Components ← Custom Hooks (Operations) → Services (CRUD) → Firestore
    ↑ (automatic updates via real-time subscriptions)
```

### Key Concepts

1. **AppContext**: Single source of truth for ALL real-time state
2. **Custom Hooks**: Handle operations that trigger real-time updates
3. **Simple Services**: Pure CRUD functions only
4. **Real-time Magic**: Operations automatically update UI through subscriptions

## How Real-time Integration Works

### The Flow

```typescript
// 1. Custom hook performs operation
const addMember = async (memberData) => {
  await MembersService.addMember(memberData); // Database operation
  // No manual UI updates needed!
};

// 2. AppContext detects changes automatically
useEffect(() => {
  const unsubscribe = onSnapshot(membersQuery, (snapshot) => {
    setActiveMembers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    // This triggers re-render of ALL components using activeMembers
  });
}, []);

// 3. All UI updates happen automatically across the entire app
```

### Real-time Update Chain

```
Custom Hook Operation → Database Change → onSnapshot Detects → AppContext Updates → All Components Re-render
```

## Step-by-Step Implementation

### Step 1: Simplify Service Layer

**Target**: `firestoreService.ts` (~700 lines) → `firebaseService.ts` (~20 lines)

#### Remove

- ❌ `RealtimeService` class (move ALL onSnapshot logic to AppContext)
- ❌ `MemberDashboardService` class (move to custom hooks)
- ❌ `AuthService` class (move to custom hooks)
- ❌ `UtilityService` class (move to custom hooks)
- ❌ Large `FirestoreService` aggregation object

#### Keep

- ✅ Direct exports of individual services only

#### Result

```typescript
// src/data/firebaseService.ts (~20 lines)
export { ConfigService } from './services/configService';
export { MembersService } from './services/membersService';
export { BillingService } from './services/billingService';
export { formatCurrency, ServiceError } from './utils/serviceUtils';
export type * from '../shared/types/firestore-types';
```

### Step 2: Centralize Real-time Subscriptions in AppContext (Simplified)

**Target**: AppContext becomes the SINGLE source of real-time state without over-engineering

#### AppContext Responsibilities

- ✅ **Essential real-time subscriptions** (activeMembers, memberDashboard when member logged in)
- ✅ **State management** (activeMembers, basic globalSettings, conditional memberDashboard)
- ✅ **Derived state calculations** (memberStats calculated from activeMembers)
- ✅ **Loading/error states** for real-time data only
- ✅ **Simple utility functions** (searchMembers, filterMembers)
- ❌ **Not real-time**: UPI settings, admin config (fetched on component first render)

#### Real-time Subscriptions in AppContext (Practical Approach)

```typescript
// Core real-time subscriptions in AppContext
- subscribeToActiveMembers() → updates Admin Members Section + Rent Section
- subscribeToGlobalSettings() → updates basic configuration (not UPI)
- subscribeToMemberDashboard() → conditional subscription when member is logged in

// Fetch-on-first-render (not real-time subscriptions)
- UPI settings → fetched when payment component first renders
- Admin config → fetched when admin management component first renders
- Component-specific data → fetched when component mounts, not globally
```

#### AppContext Structure (Simplified & Practical)

```typescript
interface AppContextType {
  // Real-time data for Admin operations
  activeMembers: Member[];
  globalSettings: GlobalSettings; // Basic config only (not UPI - fetched when needed)

  // Real-time data for Member Dashboard (conditional subscription)
  memberDashboard: {
    member: Member | null;
    currentMonth: RentHistory | null;
    rentHistory: RentHistory[];
    otherMembers: Array<{ id: string; name: string; phone: string; floor: string; bedType: string }>;
  };

  // Derived state (calculated from real-time data, not subscribed)
  memberStats: {
    totalActive: number;
    wifiOptedIn: number;
    byFloor: Record<string, number>;
    totalOutstanding: number; // Sum of positive balances
  };

  // Loading/Error states for real-time data only
  loading: { members: boolean; settings: boolean; memberDashboard: boolean };
  errors: { members: string | null; settings: string | null; memberDashboard: string | null };

  // Connection retry for network issues
  retryConnection: () => void;

  // Member operations
  addMember: (memberData: AddMemberFormData) => Promise<void>;
  updateMember: (memberId: string, updates: EditMemberFormData) => Promise<void>;
  deactivateMember: (memberId: string, leaveDate: Date) => Promise<SettlementPreview>;
  deleteMember: (memberId: string) => Promise<void>;

  // Billing/Rent operations
  generateBills: (billData: GenerateBillsData) => Promise<void>;
  recordPayment: (memberId: string, paymentData: PaymentData) => Promise<void>;
  addExpense: (memberId: string, expenses: ExpenseData[]) => Promise<void>;

  // Member Dashboard operations
  getMemberDashboard: () => Promise<void>;
  getMemberRentHistory: (limit?: number, startAfter?: string) => Promise<void>;
  getOtherActiveMembers: () => Promise<void>;
  updateFCMToken: (fcmToken: string) => Promise<void>;
  linkMemberAccount: (phoneNumber: string) => Promise<Member>;
  setupMemberDashboardListeners: (memberId: string) => () => void;

  // Utility functions for real-time data
  searchMembers: (query: string) => Member[];
  filterMembers: (filters: FilterOptions) => Member[];
  getMemberStats: () => { totalActive: number; wifiOptedIn: number; byFloor: Record<string, number> };
  fetchInactiveMembers: () => Promise<Member[]>;
}
```

### Step 3: Extract Operations to Custom Hooks

**Target**: Remove operation logic from AppContext, keep real-time state

#### Custom Hooks Handle Operations That Trigger Real-time Updates

##### `useMemberOperations.ts` (~150 lines)

**Purpose**: Handle member CRUD operations with proper error handling and user feedback

**Key Features**:

- Form submission with loading states and success notifications
- Field-level error highlighting for validation errors
- Network error handling with retry functionality
- Firestore-specific error handling with user-friendly messages
- Real-time UI updates through AppContext subscriptions

**Error Handling Strategy**:

- **Form Validation Errors**: Highlight specific fields, show single notification
- **Business Logic Errors**: User-friendly messages (duplicate phone, invalid data)
- **Network Errors**: Show retry button with exponential backoff
- **Firestore Errors**: Handle permission denied, quota exceeded, offline scenarios
- **Success**: Clear success notifications with specific action confirmation

##### `useBillingOperations.ts` (~100 lines)

**Purpose**: Handle billing operations with comprehensive error handling

**Key Features**:

- Bulk bill generation with progress feedback
- Payment recording with immediate UI updates
- Expense management with validation
- Network resilience with retry mechanisms
- Real-time synchronization across all affected components

**Error Handling Strategy**:

- **Bulk Operations**: Progress indicators with partial failure handling
- **Payment Errors**: Clear feedback on payment processing issues
- **Network Issues**: Automatic retry with user notification
- **Firestore Limits**: Handle quota exceeded, concurrent modification errors

##### `useAdminOperations.ts` (~80 lines)

```typescript
export function useAdminOperations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addAdmin = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      await ConfigService.addAdmin(email, currentAdminUid);
      // Admin config fetched when component first renders
      notifications.show({
        title: 'Success',
        message: 'Admin added successfully',
        color: 'green',
      });
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to add admin';
      setError(errorMessage);

      if (error?.code === 'business/duplicate-admin') {
        notifications.show({
          title: 'Admin Already Exists',
          message: 'This email is already an admin',
          color: 'red',
        });
      } else if (error?.code === 'business/max-admins-reached') {
        notifications.show({
          title: 'Maximum Admins Reached',
          message: 'Cannot add more administrators',
          color: 'red',
        });
      } else {
        notifications.show({
          title: 'Error',
          message: errorMessage,
          color: 'red',
        });
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeAdmin = useCallback(async (adminUid: string) => {
    setLoading(true);
    setError(null);
    try {
      await ConfigService.removeAdmin(adminUid, currentAdminUid);
      notifications.show({
        title: 'Success',
        message: 'Admin removed successfully',
        color: 'green',
      });
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to remove admin';
      setError(errorMessage);
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { addAdmin, removeAdmin, loading, error };
}
```

##### `useMemberDashboard.ts` (~120 lines)

```typescript
export function useMemberDashboard() {
  const getMemberDashboard = useCallback(async () => {
    // Works with real-time member data from AppContext
    // Real-time subscriptions handle automatic updates
  }, []);

  const updateFCMToken = useCallback(async (fcmToken: string) => {
    await MembersService.updateMemberFCMToken(memberId, fcmToken);
    // Real-time subscription automatically updates member profile
  }, []);

  return { getMemberDashboard, updateFCMToken, loading };
}
```

##### `useAuth.ts` (~60 lines)

```typescript
export function useAuth() {
  const linkMemberAccount = useCallback(async (phoneNumber: string) => {
    const member = await AuthService.linkMemberAccount(idToken, phoneNumber);
    // Real-time subscription automatically updates member account status
    return member;
  }, []);

  return { linkMemberAccount, loading };
}
```

##### `usePaymentSettings.ts` (~40 lines)

```typescript
export function usePaymentSettings() {
  const getUPISettings = useCallback(async () => {
    // Fetch UPI settings when needed (not real-time)
    const settings = await ConfigService.getGlobalSettings();
    return {
      upiVpa: settings.upiVpa,
      payeeName: settings.payeeName,
    };
  }, []);

  return { getUPISettings, loading };
}
```

### Step 4: Component Usage Pattern (Simplified & Practical)

#### Members Management Component

**How it works**:

- Gets real-time member data and statistics from AppContext
- Uses member operations from AppContext for CRUD operations
- Automatically updates UI when operations complete via real-time subscriptions
- Displays loading states during data fetching and member statistics

**Real-time Updates**:

- New members appear in accordion immediately after addition
- Member statistics recalculate automatically from real-time data
- Rent section shows new members without manual refresh
- Total outstanding balance updates across all components

#### Rent Management Component

**How it works**:

- Accesses real-time member data and calculated statistics from AppContext
- Uses billing operations from AppContext for payment and bill generation
- Shows total outstanding balance calculated from real-time member data
- Provides payment recording and bill generation functionality

**Real-time Updates**:

- Member balance buttons update immediately after payment recording
- Total outstanding recalculates automatically when any member balance changes
- Payment status changes reflect across all components instantly
- Member dashboards update in real-time when admin performs operations
- Bill generation updates ALL member balances simultaneously

## What Triggers Real-time Updates

### Operations That Trigger Multiple UI Updates

#### 1. Add Member

**Operation**: `addMember(memberData)` **Database Changes**:

- Creates member record
- Creates initial rentHistory
- Updates system counters

**Real-time UI Updates**:

- ✅ Members Section (new member in accordion)
- ✅ Rent Section (new member with balance)
- ✅ Dashboard (member count statistics)
- ✅ Total Outstanding (includes new member's balance)

#### 2. Record Payment

**Operation**: `recordPayment(memberId, amount)` **Database Changes**:

- Updates member's outstandingBalance
- Updates rentHistory with payment
- Changes payment status

**Real-time UI Updates**:

- ✅ Rent Section (balance button changes)
- ✅ Total Outstanding (recalculates)
- ✅ Member Details (payment status updates)
- ✅ Payment History (new payment appears)

#### 3. Generate Bills

**Operation**: `generateBills(billData)` **Database Changes**:

- Updates ALL active members' outstandingBalance
- Creates rentHistory for current month for ALL members
- Updates billing period timestamps

**Real-time UI Updates**:

- ✅ ALL member balances update
- ✅ Total Outstanding major recalculation
- ✅ Current month data for all members
- ✅ Billing period updates

#### 4. Add Expense

**Operation**: `addExpense(memberId, expenses)` **Database Changes**:

- Updates member's outstandingBalance
- Adds expense to current month's rentHistory

**Real-time UI Updates**:

- ✅ Specific member's balance
- ✅ Total Outstanding
- ✅ Member's current month details

#### 5. Deactivate Member

**Operation**: `deactivateMember(memberId, leaveDate)` **Database Changes**:

- Sets isActive to false
- Updates system counters

**Real-time UI Updates**:

- ✅ Member disappears from active lists
- ✅ Member counts update
- ✅ Total Outstanding recalculates

## File Structure

```
src/
├── contexts/
│   ├── AppContext.tsx (~350 lines)           # Essential real-time state + subscriptions
│   └── hooks/                                # Operations that trigger updates
│       ├── useMemberOperations.ts (~150 lines)
│       ├── useBillingOperations.ts (~100 lines)
│       ├── useAdminOperations.ts (~80 lines)
│       ├── useMemberDashboard.ts (~120 lines)
│       ├── useAuth.ts (~60 lines)
│       └── usePaymentSettings.ts (~40 lines)  # Fetch-when-needed UPI settings
├── data/
│   ├── firebaseService.ts (~20 lines)        # Simple exports only
│   └── services/                             # Pure CRUD functions (unchanged)
│       ├── configService.ts
│       ├── membersService.ts
│       └── billingService.ts
```

## Size Reduction Summary

### Before

- **AppContext.tsx**: ~770 lines
- **firestoreService.ts**: ~700 lines
- **Total**: ~1470 lines

### After

- **AppContext.tsx**: ~350 lines (includes ALL real-time subscriptions)
- **firebaseService.ts**: ~20 lines
- **Custom hooks**: ~550 lines (6 files)
- **Total**: ~920 lines (**37% reduction**)

## Key Benefits

### 1. Single Source of Real-time Truth (Practical Approach)

- AppContext manages essential real-time state (activeMembers, memberDashboard)
- No duplicate onSnapshot subscriptions
- Consistent state across entire application
- Fetch-when-needed for rarely changing data (UPI settings, admin config)

### 2. Automatic UI Synchronization

- Operations trigger automatic updates across entire UI
- No manual state management in components
- Real-time updates happen seamlessly

### 3. Clean Separation of Concerns

- **AppContext**: Essential real-time state management (no over-engineering)
- **Custom Hooks**: Operation logic and error handling
- **Services**: Pure CRUD functions
- **Components**: UI rendering and user interactions
- **Fetch-when-needed**: UPI settings, admin config (not real-time)

### 4. React Idiomatic Patterns

- Follows React best practices from steering rules
- Uses proper hook patterns and state management
- Leverages React's built-in optimization features

### 5. Maintainable Architecture

- Clear file organization and responsibilities
- Smaller, focused files are easier to maintain
- Testable components and hooks

### 6. No Manual UI Updates

- Custom hooks just perform operations
- Real-time subscriptions handle all UI updates
- Eliminates complex state synchronization logic

## Migration Steps

### Phase 1: Create Custom Hooks

1. Create `src/contexts/hooks/` directory
2. Extract operation logic from AppContext to custom hooks
3. Implement proper error handling and loading states
4. Test each hook independently

### Phase 2: Simplify Service Layer

1. Create simplified `firebaseService.ts`
2. Remove aggregation and real-time logic from `firestoreService.ts`
3. Update imports across the application
4. Test service layer functionality

### Phase 3: Refactor AppContext

1. Remove operation methods from AppContext
2. Keep only real-time subscriptions and state
3. Add derived state calculations
4. Implement proper error handling for subscriptions

### Phase 4: Update Components

1. Update components to use custom hooks for operations
2. Ensure components still get real-time state from AppContext
3. Test all user interactions and real-time updates
4. Verify UI updates work across all sections

### Phase 5: Testing & Cleanup

1. Comprehensive testing of all operations
2. Verify real-time updates work correctly
3. Remove old `firestoreService.ts` file
4. Update documentation and type definitions

## Success Criteria

- [ ] File sizes reduced by ~40%
- [ ] No duplicate real-time subscription logic
- [ ] All operations trigger automatic UI updates
- [ ] Components use clean hook patterns
- [ ] Real-time state works across entire application
- [ ] No breaking changes to existing functionality
- [ ] Improved maintainability and testability

## The Magic: Operations → Real-time → UI Updates

```
Custom Hook Operation → Database Change → onSnapshot Detects → AppContext Updates → All Components Re-render
```

### Real-world Example Flow:

1. **Admin generates bills** → `useBillingOperations.generateBills()`
2. **Database updates** → All member `outstandingBalance` fields change
3. **Real-time detection** → `onSnapshot` detects member changes
4. **AppContext updates** → `activeMembers` state updates automatically
5. **UI updates everywhere**:
   - Admin rent section shows new balances
   - Member dashboards update instantly
   - Total outstanding recalculates
   - Member gets notification

### Key Benefits of This Simplified Approach:

- ✅ **No over-engineering**: Only essential real-time subscriptions
- ✅ **Practical UX**: Members see updates when admin performs operations
- ✅ **Efficient**: Component data fetched on first render only
- ✅ **Maintainable**: Clear separation between real-time and fetch-on-render data
- ✅ **Scalable**: Easy to add new operations without complex state management
- ✅ **React Patterns Compliant**: Follows react-patterns.md guidelines
- ✅ **Comprehensive Error Handling**: Multi-layered error management strategy

## Comprehensive Error Handling Strategy

### Form Submission Errors

- **Success**: Show success notification with specific action confirmation
- **Validation Errors**: Highlight specific form fields, show single error notification
- **Field-Level Feedback**: Real-time validation with clear error messages

### Network & Connection Errors

**How to handle network issues**:

- **Network Failures**: Display error notification with prominent "Retry" button that implements exponential backoff
  (1s, 2s, 4s delays)
- **Connection Issues**: Show connection status indicator with manual retry option that users can trigger
- **Timeout Errors**: Present clear timeout messages with immediate retry functionality
- **Offline Detection**: Detect offline state and show cached data with "You're offline" indicator and auto-retry when
  connection returns

**Implementation approach**:

- Use browser's `navigator.onLine` API for offline detection
- Implement retry mechanism with increasing delays between attempts
- Show visual feedback during retry attempts with progress indicators
- Provide manual override for users who want to retry immediately

### Firestore-Specific Error Handling

**How to handle Firestore errors**:

#### Permission Errors

- **permission-denied**: Show user-friendly message "You don't have permission to perform this action" with option to
  contact admin
- **unauthenticated**: Automatically redirect to login page with clear message about session expiry

#### Resource Errors

- **not-found**: Display "The requested data was not found" with refresh button to reload current data
- **already-exists**: Show "This item already exists" with option to view existing item or modify current input
- **resource-exhausted**: Present "Service temporarily unavailable" with automatic retry after 30 seconds

#### Quota & Limit Errors

- **quota-exceeded**: Show retry button with 5-minute delay, inform user about temporary limits with countdown timer
- **deadline-exceeded**: Display "Operation timed out" with immediate retry button and suggestion to try again
- **unavailable**: Show "Service temporarily unavailable" with automatic retry every 10 seconds (max 3 attempts)

#### Data Consistency Errors

- **failed-precondition**: Alert "Data was modified by another user" with refresh button to reload latest data
- **aborted**: Show "Operation was cancelled" with retry button and explanation that it's safe to try again
- **out-of-range**: Display "Invalid data range provided" with guidance on correct input format

**Implementation strategy**:

- Catch Firestore errors by error code and provide specific user-friendly messages
- Use Mantine notifications for error display with appropriate colors and icons
- Implement automatic retry for transient errors (unavailable, deadline-exceeded)
- Provide manual retry buttons for user-initiated retry actions
- Show progress indicators during retry attempts
- Log technical error details for debugging while showing simple messages to users

### Error Recovery Patterns

- **Exponential Backoff**: For network and temporary errors
- **Manual Retry**: For user-initiated retry actions
- **Automatic Refresh**: For data consistency issues
- **Graceful Degradation**: Show cached data when possible

### User Experience Guidelines

- **Single Error Notification**: One notification per operation, not per field
- **Clear Action Items**: Tell users exactly what to do next
- **Progress Feedback**: Show progress for long-running operations
- **Contextual Help**: Provide relevant help based on error type

This approach gives you **organized operation logic AND seamless real-time UI updates** with robust error handling
following React best practices!
