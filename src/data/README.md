# Firestore Service Layer - Refactored Architecture

## Overview
The Firestore service layer has been refactored into smaller, more maintainable files using types from `firestore-types.ts`. This architecture is designed to be easily migrated to Firebase emulators and real Firebase Functions.

## File Structure

```
src/data/
├── mock/
│   └── mockData.ts           # Mock data for development/testing
├── services/
│   ├── configService.ts      # Global settings & admin management
│   ├── membersService.ts     # Member CRUD operations
│   └── billingService.ts     # Bill generation & electricity costs
├── utils/
│   └── serviceUtils.ts       # Common utilities & helpers
├── firestoreService.ts       # Main service aggregator
└── examples.ts               # Usage examples
```

## Key Features

### 🔧 **Modular Architecture**
- Each service handles a specific domain
- Easy to test and maintain
- Clear separation of concerns

### 📝 **Type Safety**
- Uses types from `firestore-types.ts`
- Consistent interfaces across services
- Runtime validation helpers

### 🚀 **Firebase Ready**
- Designed for easy migration to Firebase Functions
- Mock implementation with setTimeout simulation
- Real async behavior for testing

### 🛠 **Development Features**
- Mock data with realistic scenarios
- Network delay simulation
- Error handling with proper error codes
- Real-time subscription simulation

## Usage Examples

### Basic Import
```typescript
import FirestoreService from '@/data/firestoreService';
```

### Member Operations
```typescript
// Get active members
const members = await FirestoreService.Members.getMembers({ isActive: true });

// Add new member
const newMember = await FirestoreService.Members.addMember(memberData);

// Search members
const results = await FirestoreService.Members.searchMembers('John');
```

### Configuration Management
```typescript
// Get global settings
const settings = await FirestoreService.Config.getGlobalSettings();

// Update settings
await FirestoreService.Config.updateGlobalSettings({ wifiMonthlyCharge: 450 });
```

### Billing Operations
```typescript
// Generate monthly bills
const result = await FirestoreService.Billing.generateMonthlyBills({
  billingMonth: '2025-07',
  floorElectricityCosts: { '2nd': 2500, '3rd': 1800 },
  bulkExpenses: [],
  wifiMemberIds: ['member-1', 'member-2'],
});
```

### Real-time Subscriptions
```typescript
// Subscribe to member changes
const unsubscribe = FirestoreService.Realtime.subscribeToActiveMembers((members) => {
  console.log('Members updated:', members.length);
});

// Cleanup
return () => unsubscribe();
```

## Error Handling

All services use the `ServiceError` class with structured error codes:

```typescript
try {
  const member = await FirestoreService.Members.getMember('invalid-id');
} catch (error) {
  if (error instanceof ServiceError) {
    console.error(`Error [${error.code}]:`, error.message);
    // Handle specific error types
    switch (error.code) {
      case 'business/member-not-found':
        // Show user-friendly message
        break;
      case 'network-error':
        // Retry logic
        break;
    }
  }
}
```

## Migration to Firebase

When ready to migrate to Firebase emulators/production:

1. **Replace service implementations** with Firebase Function calls
2. **Keep the same API** - components won't need changes
3. **Update mock data** to use real Firestore collections
4. **Replace setTimeout** with actual network calls

## Testing

Run examples to test the service layer:

```typescript
import examples from '@/data/examples';

// Run all examples
await examples.runAllExamples();

// Run specific examples
await examples.exampleMemberOperations();
```

## Development Notes

- **Mock Data**: Realistic data in `mockData.ts` for development
- **Network Simulation**: Configurable delays and error rates
- **Type Consistency**: All types from `firestore-types.ts`
- **Service Focus**: Each service handles one domain
- **Future Proof**: Easy migration path to real Firebase

## Error Codes

Common error codes used across services:

- `validation/*` - Input validation errors
- `business/*` - Business logic violations
- `auth/*` - Authentication/authorization errors
- `network-error` - Simulated network failures

## Next Steps

1. **Test with components** - Replace old imports with new service
2. **Firebase emulator setup** - Prepare for real Firebase integration
3. **Component integration** - Update modals and forms to use new services
4. **Performance optimization** - Add caching and optimization as needed

---

This architecture provides a solid foundation for both development and production use with Firebase.
