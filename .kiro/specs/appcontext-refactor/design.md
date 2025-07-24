# Design Document

## Overview

This document outlines the design for refactoring the AppContext architecture to achieve a 37% reduction in codebase
size while maintaining all existing real-time functionality. The refactoring will transform the current monolithic
AppContext (~770 lines) and firestoreService (~700+ lines) into a modular, hook-based architecture with clear separation
of concerns.

The design follows React best practices from the project's react-patterns.md guidelines, implementing custom hooks for
business logic extraction, maintaining real-time Firestore subscriptions, and ensuring seamless migration without
breaking changes.

## Architecture

### Current State Analysis

**Current Issues:**

- AppContext.tsx: 770+ lines with mixed responsibilities
- firestoreService.ts: 700+ lines with duplicate real-time logic
- Duplicate onSnapshot subscription patterns across files
- Mixed concerns: UI state, business logic, and data access
- Large files difficult to maintain and test

**Current Strengths to Preserve:**

- Real-time Firestore subscriptions working correctly
- Comprehensive error handling with retry mechanisms
- Member dashboard functionality with proper state management
- Consistent notification patterns
- Proper TypeScript interfaces

### Target Architecture

**New Structure:**

```
src/contexts/
├── AppContext.tsx (~350 lines) - Core real-time state management only
├── hooks/
│   ├── useMemberOperations.ts - Member CRUD operations
│   ├── useBillingOperations.ts - Payment and billing logic
│   ├── useAdminOperations.ts - Admin management functionality
│   ├── useMemberDashboard.ts - Member dashboard operations
│   ├── useAuth.ts - Authentication and account linking
│   └── usePaymentSettings.ts - Fetch-when-needed UPI settings
└── services/
    └── index.ts (~20 lines) - Simple service exports
```

**Design Principles:**

1. **Single Responsibility**: Each file has one clear purpose
2. **Real-time First**: AppContext manages only real-time subscriptions
3. **Hook-based Logic**: Business operations extracted to custom hooks
4. **Service Simplification**: Direct exports without over-aggregation
5. **Zero Breaking Changes**: Existing component interfaces preserved

## Components and Interfaces

### Core AppContext (Reduced Scope)

**Responsibilities:**

- Real-time Firestore subscriptions only
- Global state management (activeMembers, globalSettings)
- Connection error handling and retry logic
- Member dashboard real-time state

**Interface (Preserved):**

```typescript
interface AppContextType {
  // Real-time Data State
  activeMembers: Member[];
  globalSettings: GlobalSettings | null;
  memberDashboard: MemberDashboardState;

  // Loading/Error States
  loading: LoadingStates;
  errors: ErrorStates;

  // Connection Management
  retryConnection: () => void;

  // Hook Integration Points
  memberOperations: ReturnType<typeof useMemberOperations>;
  billingOperations: ReturnType<typeof useBillingOperations>;
  adminOperations: ReturnType<typeof useAdminOperations>;
  memberDashboardOps: ReturnType<typeof useMemberDashboard>;
  auth: ReturnType<typeof useAuth>;
  paymentSettings: ReturnType<typeof usePaymentSettings>;

  // Utility Functions (Preserved)
  getMemberStats: () => MemberStats;
  searchMembers: (query: string) => Member[];
  filterMembers: (members: Member[], filters: FilterOptions) => Member[];
}
```

### Custom Hooks Architecture

#### useMemberOperations Hook

**Purpose:** Member CRUD operations with proper error handling and loading states

**Interface:**

```typescript
interface UseMemberOperationsReturn {
  // Operations
  addMember: (data: AddMemberFormData) => Promise<void>;
  updateMember: (id: string, updates: EditMemberFormData) => Promise<void>;
  deactivateMember: (id: string, leaveDate: Date) => Promise<SettlementPreview>;
  deleteMember: (id: string) => Promise<void>;
  fetchInactiveMembers: () => Promise<Member[]>;

  // State
  isLoading: boolean;
  error: string | null;

  // Utilities
  clearError: () => void;
}
```

**Implementation Strategy:**

- Use `useState` for simple loading/error states
- Use `useCallback` for memoized operation functions
- Integrate with notifications for user feedback
- Call Cloud Functions for complex operations (deactivation)
- Proper error handling with user-friendly messages

#### useBillingOperations Hook

**Purpose:** Payment recording and bill generation operations

**Interface:**

```typescript
interface UseBillingOperationsReturn {
  // Operations
  recordPayment: (data: PaymentData) => Promise<void>;
  generateBulkBills: (month: string) => Promise<void>;
  recordAdHocExpense: (data: ExpenseData) => Promise<void>;

  // State
  isLoading: boolean;
  error: string | null;

  // Utilities
  clearError: () => void;
}
```

#### useAdminOperations Hook

**Purpose:** Admin-specific functionality and system management

**Interface:**

```typescript
interface UseAdminOperationsReturn {
  // Operations
  updateGlobalSettings: (settings: Partial<GlobalSettings>) => Promise<void>;
  manageAdmins: (action: AdminAction) => Promise<void>;
  generateReports: (type: ReportType) => Promise<void>;

  // State
  isLoading: boolean;
  error: string | null;

  // Utilities
  clearError: () => void;
}
```

#### useMemberDashboard Hook

**Purpose:** Member dashboard specific operations and data management

**Interface:**

```typescript
interface UseMemberDashboardReturn {
  // Operations
  getMemberDashboard: () => Promise<void>;
  getMemberRentHistory: (limit?: number, startAfter?: string) => Promise<void>;
  getOtherActiveMembers: () => Promise<void>;
  updateFCMToken: (token: string) => Promise<void>;

  // Real-time Setup
  setupMemberDashboardListeners: (memberId: string) => () => void;

  // State
  isLoading: boolean;
  error: string | null;

  // Utilities
  clearError: () => void;
}
```

#### useAuth Hook

**Purpose:** Authentication and account linking operations

**Interface:**

```typescript
interface UseAuthReturn {
  // Operations
  linkMemberAccount: (phoneNumber: string) => Promise<Member>;
  verifyAuth: (token: string) => Promise<AuthResult>;

  // State
  isLoading: boolean;
  error: string | null;

  // Utilities
  clearError: () => void;
}
```

#### usePaymentSettings Hook

**Purpose:** Fetch-when-needed UPI payment settings

**Interface:**

```typescript
interface UsePaymentSettingsReturn {
  // Data
  paymentSettings: PaymentSettings | null;

  // Operations
  fetchPaymentSettings: () => Promise<void>;
  updatePaymentSettings: (settings: PaymentSettings) => Promise<void>;

  // State
  isLoading: boolean;
  error: string | null;

  // Utilities
  clearError: () => void;
}
```

### Simplified Service Layer

**New Structure:**

```typescript
// src/contexts/services/index.ts (~20 lines)
export { ConfigService } from './configService';
export { MembersService } from './membersService';
export { BillingService } from './billingService';
export { AuthService } from './authService';
export { RealtimeService } from './realtimeService';

// Utility exports
export { formatCurrency, formatBillingMonth, getCurrentBillingMonth, validatePhoneNumber } from './utils/serviceUtils';

// Error handling
export { ServiceError } from './utils/serviceUtils';
```

**Key Changes:**

- Remove large FirestoreService aggregator object
- Direct exports of individual service modules
- No real-time logic in services (moved to AppContext)
- Simplified utility function exports
- Maintain existing service functionality

## Data Models

### State Management Models

**AppContext State Structure:**

```typescript
interface AppContextState {
  // Real-time Data
  activeMembers: Member[];
  globalSettings: GlobalSettings | null;

  // Member Dashboard State
  memberDashboard: {
    member: Member | null;
    currentMonth: RentHistory | null;
    rentHistory: RentHistory[];
    hasMoreHistory: boolean;
    nextHistoryCursor?: string;
    otherMembers: MemberSummary[];
  };

  // System State
  loading: {
    members: boolean;
    settings: boolean;
    memberDashboard: boolean;
    memberHistory: boolean;
    otherMembers: boolean;
  };

  errors: {
    members: string | null;
    settings: string | null;
    connection: string | null;
    memberDashboard: string | null;
    memberHistory: string | null;
    otherMembers: string | null;
  };
}
```

**Hook State Models:**

```typescript
// Common hook state pattern
interface HookState {
  isLoading: boolean;
  error: string | null;
}

// Extended for specific hooks
interface MemberOperationsState extends HookState {
  lastOperation?: 'add' | 'update' | 'deactivate' | 'delete';
  operationResult?: any;
}
```

### Data Flow Models

**Real-time Subscription Flow:**

1. AppContext establishes Firestore onSnapshot listeners
2. Real-time updates trigger state updates
3. Components receive updates through context
4. Custom hooks provide operations that trigger real-time updates

**Operation Flow:**

1. Component calls hook operation (e.g., `addMember`)
2. Hook handles loading state and error handling
3. Hook calls appropriate service function
4. Service performs Firestore operation
5. Real-time listener in AppContext receives update
6. UI updates automatically through context

## Error Handling

### Centralized Error Management

**Error Categories:**

1. **Connection Errors**: Network/Firestore connectivity issues
2. **Validation Errors**: Input validation failures
3. **Business Logic Errors**: Rule violations, conflicts
4. **System Errors**: Unexpected failures, timeouts

**Error Handling Strategy:**

```typescript
// Hook-level error handling
const useMemberOperations = () => {
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((error: unknown, operation: string) => {
    console.error(`${operation} failed:`, error);

    if (error instanceof ServiceError) {
      setError(error.message);
    } else {
      setError(`${operation} failed. Please try again.`);
    }

    // Show user notification
    notifications.show({
      title: 'Error',
      message: error instanceof ServiceError ? error.message : `${operation} failed`,
      color: 'red',
    });
  }, []);

  const addMember = useCallback(
    async (data: AddMemberFormData) => {
      setError(null);
      try {
        await MembersService.addMember(data);
        notifications.show({
          title: 'Success',
          message: `Member ${data.name} added successfully`,
          color: 'green',
        });
      } catch (error) {
        handleError(error, 'Add member');
        throw error;
      }
    },
    [handleError]
  );

  return { addMember, error, clearError: () => setError(null) };
};
```

### Connection Recovery

**Retry Mechanism (Preserved in AppContext):**

- Exponential backoff for connection failures
- Maximum retry attempts with user notification
- Manual retry option through `retryConnection()`
- Automatic reconnection when network restored

**Implementation:**

```typescript
// In AppContext
const setupMembersSubscription = useCallback(() => {
  try {
    const unsubscribe = RealtimeService.subscribeToActiveMembers((members) => {
      setActiveMembers(members);
      setLoading((prev) => ({ ...prev, members: false }));
      setErrors((prev) => ({ ...prev, members: null, connection: null }));
      setRetryCount((prev) => ({ ...prev, members: 0 }));
    });
    return unsubscribe;
  } catch (error) {
    handleConnectionError(error, 'members');
    scheduleRetry('members');
  }
}, [retryCount.members]);
```

## Testing Strategy

### Hook Testing Approach

**Custom Hook Testing:**

```typescript
// Example test structure for useMemberOperations
describe('useMemberOperations', () => {
  it('should add member successfully', async () => {
    const { result } = renderHook(() => useMemberOperations());

    await act(async () => {
      await result.current.addMember(mockMemberData);
    });

    expect(result.current.error).toBeNull();
    expect(MembersService.addMember).toHaveBeenCalledWith(mockMemberData);
  });

  it('should handle add member error', async () => {
    MembersService.addMember.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useMemberOperations());

    await act(async () => {
      try {
        await result.current.addMember(mockMemberData);
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.error).toBe('Add member failed. Please try again.');
  });
});
```

**AppContext Testing:**

```typescript
// Test real-time subscription setup
describe('AppContext', () => {
  it('should setup real-time subscriptions on mount', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    expect(RealtimeService.subscribeToActiveMembers).toHaveBeenCalled();
    expect(RealtimeService.subscribeToGlobalSettings).toHaveBeenCalled();
  });

  it('should handle connection errors with retry', async () => {
    RealtimeService.subscribeToActiveMembers.mockImplementation(() => {
      throw new Error('Connection failed');
    });

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // Verify error state and retry mechanism
    await waitFor(() => {
      expect(screen.getByText(/connection error/i)).toBeInTheDocument();
    });
  });
});
```

### Integration Testing

**Component Integration:**

- Test hook integration with components
- Verify real-time updates flow through context
- Test error handling in UI components
- Validate loading states and user feedback

**Service Integration:**

- Mock Firestore operations for predictable testing
- Test service error handling and propagation
- Verify real-time subscription cleanup
- Test retry mechanisms and connection recovery

### Migration Testing

**Backward Compatibility:**

- Verify existing component interfaces unchanged
- Test all current functionality preserved
- Validate real-time behavior matches current implementation
- Ensure no breaking changes in public APIs

## Performance Considerations

### Hook Optimization

**Memoization Strategy:**

```typescript
const useMemberOperations = () => {
  // Memoize operation functions to prevent unnecessary re-renders
  const addMember = useCallback(async (data: AddMemberFormData) => {
    // Implementation
  }, []);

  const updateMember = useCallback(async (id: string, updates: EditMemberFormData) => {
    // Implementation
  }, []);

  // Memoize return object to prevent context consumers from re-rendering
  return useMemo(
    () => ({
      addMember,
      updateMember,
      isLoading,
      error,
      clearError,
    }),
    [addMember, updateMember, isLoading, error, clearError]
  );
};
```

**Context Optimization:**

```typescript
// Split context value to prevent unnecessary re-renders
const AppProvider = ({ children }) => {
  // Memoize stable parts of context value
  const operations = useMemo(
    () => ({
      memberOperations: useMemberOperations(),
      billingOperations: useBillingOperations(),
      adminOperations: useAdminOperations(),
      memberDashboardOps: useMemberDashboard(),
      auth: useAuth(),
      paymentSettings: usePaymentSettings(),
    }),
    []
  );

  const contextValue = useMemo(
    () => ({
      // Real-time data (changes frequently)
      activeMembers,
      globalSettings,
      memberDashboard,
      loading,
      errors,

      // Operations (stable references)
      ...operations,

      // Utilities (stable references)
      getMemberStats,
      searchMembers,
      filterMembers,
      retryConnection,
    }),
    [
      activeMembers,
      globalSettings,
      memberDashboard,
      loading,
      errors,
      operations,
      getMemberStats,
      searchMembers,
      filterMembers,
      retryConnection,
    ]
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};
```

### Real-time Subscription Optimization

**Subscription Management:**

- Proper cleanup functions for all subscriptions
- Avoid duplicate subscriptions during re-renders
- Efficient error handling without subscription recreation
- Optimized dependency arrays for subscription effects

**Memory Management:**

- Clear error states when appropriate
- Cleanup timers and intervals in retry mechanisms
- Proper unsubscribe handling in useEffect cleanup
- Avoid memory leaks in long-running subscriptions

### Bundle Size Impact

**Expected Improvements:**

- Reduced bundle size through code elimination
- Better tree-shaking with direct service exports
- Smaller individual hook modules for better code splitting
- Eliminated duplicate code between AppContext and services

## Migration Strategy

### Phase 1: Hook Extraction

1. Create custom hooks with existing AppContext logic
2. Test hooks independently with current service layer
3. Ensure hooks provide same functionality as current implementation
4. Validate error handling and loading states

### Phase 2: AppContext Refactoring

1. Integrate custom hooks into AppContext
2. Remove extracted logic from AppContext
3. Maintain same public interface for backward compatibility
4. Test real-time functionality preservation

### Phase 3: Service Layer Simplification

1. Remove duplicate real-time logic from services
2. Simplify service exports to direct module exports
3. Update service imports in hooks
4. Validate service functionality unchanged

### Phase 4: Validation and Cleanup

1. Run comprehensive test suite
2. Validate all real-time functionality working
3. Check performance improvements
4. Remove any unused code or imports

### Rollback Strategy

**Safe Rollback Plan:**

- Keep original files as `.backup` during migration
- Implement feature flags for gradual rollout
- Monitor error rates and performance metrics
- Quick revert capability if issues detected

**Validation Checkpoints:**

- All existing tests pass without modification
- Real-time updates work exactly as before
- No breaking changes in component interfaces
- Performance metrics meet or exceed current levels
