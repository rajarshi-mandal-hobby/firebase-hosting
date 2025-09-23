# Instructions

- You are the developer working on a Firebase React project along with the user.
- Follow the user's instructions carefully and ask for clarification if needed.
- Use the MCP Servers to assist yourself in development. Some are Memory, Sequential Thinking, Github and IDE built-in tools.
- You should work along with the user to implement features, fix bugs, and maintain the codebase without introducing unnecessary complexity or deviating from established patterns unless explicitly instructed.
- Always check for existing implementations before introducing new patterns or technologies.
- Suggest improvements to the user only when they are clearly beneficial or is deviating from patterns.
- Use the provided guidelines and technologies to ensure consistency and maintainability across the project.

# Project Architecture Overview

## Domain-Driven Structure

This is a **Rent Management Application** for hostel/mess administration with feature-based organization:

- `src/features/admin/` - Admin dashboard, member management, billing operations
- `src/features/member-dashboard/` - Member-facing views and payment flows
- `src/features/rent/` - Rent generation, payment tracking, electric bill management
- `src/shared/` - Reusable components, types, utilities across features

## Context-Centric State Management

**AppContext** (`src/contexts/AppContext.tsx`) is the central hub managing real-time Firestore subscriptions and global state. Custom hooks in `src/contexts/hooks/` handle domain-specific operations:

- `useMemberOperations` - CRUD operations for member management
- `useBillingOperations` - Payment processing and bill generation
- `useAdminOperations` - Admin configuration and role management
- Hook-based pattern separates business logic from real-time state subscriptions

## Firebase Integration Patterns

**Current Phase**: Development with emulators (Phase 1). Firebase services are prepared but mock data is used.

- **Emulator Setup**: `npm run emulators` starts full Firebase emulator suite
- **Data Seeding**: `npm run emulators:seed` populates emulator with mock data
- **Service Layer**: `src/data/services/` contains individual service modules (ConfigService, MembersService, BillingService)
- **Cloud Functions**: `functions/src/` with TypeScript, organized by domain (config-operations, member-operations, billing-operations)

# Technology Stack & Standards

## Frontend Stack

- **React 19** with TypeScript 5.8+
- **Vite 7** for development and build
- **Mantine UI (latest)** component library
- **React Router DOM 7.6** for routing

## Backend Stack

- **Firebase 11.x** (Firestore, Auth, Functions, Hosting)
- **Node.js 22** for Cloud Functions
- **TypeScript** for all backend code

## Development Standards

### Code Style

- Use TypeScript strict mode with proper type definitions
- Feature-based folder structure with clear separation
- Shared components for consistency and reusability
- No inline CSS - use Mantine theme system exclusively
- Export components as named exports (not default exports)
- Use absolute imports with path mapping
- Consistent file naming: PascalCase for components, camelCase for utilities

### React Best Practices

- **Follow react-patterns.md** - Comprehensive React guidelines and hook selection
- .kiro\steering\react-patterns.md

### Mantine UI Standards

- **Use Latest Version**: Always use the most recent Mantine version for latest features
- **Official Documentation**: Reference https://mantine.dev/core/package/ for components
- **Theming System**: Use MantineProvider and theme configuration https://mantine.dev/theming/mantine-provider/
- **Component Consistency**: Leverage Mantine's built-in components over custom implementations
- **Theme Customization**: Utilize Mantine's theming system for consistent design
- **CSS Variables**: Use Mantine's CSS variable system for dynamic theming
- **Component Props**: Use defaultProps for consistent component styling across the app
- **Responsive Design**: Leverage Mantine's responsive utilities and breakpoints
- **Form Handling**: Use Mantine's form components and validation patterns
- **Accessibility**: Rely on Mantine's built-in accessibility features

### Component Patterns

- Use Mantine's defaultProps for consistent styling
- Button radius: 'xl' for modern appearance
- High-contrast design (black-on-white)
- Bottom-center notifications
- Progressive disclosure for complex features
- **Form Patterns**: Use controlled components with validation hooks
- **Modal Patterns**: Consistent modal structure with SharedModal wrapper
- **Loading States**: Implement proper loading and error states for all async operations

## Critical Development Patterns

### Modal Stack Pattern

Complex modals use **Mantine's Modal.Stack** with multiple modals (see `GenerateBillsModal.tsx`):

```tsx
const stack = useModalsStack(['form', 'error', 'confirm']);
// Form → Error (on failure) → Confirm (on success)
```

### Form State Management

Forms handle month-based data caching with `useRef` Maps:

```tsx
const monthlyDataCache = useRef<Map<string, FormData>>(new Map());
// Cache form data per billing month to preserve user input
```

### Firebase Emulator Workflow

**Essential Commands** (Windows PowerShell):

- `npm run emulators` - Start Firebase emulators (Firestore:8080, Auth:9099, Functions:5001)
- `npm run emulators:seed` - Populate with mock data from `src/data/mock/`
- `npm run emulators:kill` - Force kill emulator processes
- View data at: `http://127.0.0.1:4000/firestore`

### Service Import Patterns

Use direct service imports (no aggregated objects):

```tsx
import { MembersService } from '../data/services/membersService';
import { ConfigService } from '../data/services/configService';
// NOT: import { FirestoreService } from '...'
```

## Current Development Mode

- Local development with Vite server
- Firebase emulators for testing

## Cross-Reference Guidelines

- **React Patterns**: See `.kiro/steering/react-patterns.md` for comprehensive React best practices and hook selection

## Mantine Documentation References

- **Core Components**: https://mantine.dev/core/package/
- **Theming System**: https://mantine.dev/theming/mantine-provider/
- **Theme Object**: https://mantine.dev/theming/theme-object/
- **CSS Variables**: https://mantine.dev/theming/css-variables/
- **Colors**: https://mantine.dev/theming/colors/
- **Typography**: https://mantine.dev/theming/typography/
- **Responsive Styles**: https://mantine.dev/styles/responsive/
- **Form Components**: https://mantine.dev/form/use-form/

## Firestore Documentation References

- **Getting Started**: https://firebase.google.com/docs/firestore/quickstart#node.js
- **Index**: https://firebase.google.com/docs/firestore/query-data/index-overview
- **Transactions and batched writes**: https://firebase.google.com/docs/firestore/manage-data/transactions
- **Firestore Realtime Updates**: https://firebase.google.com/docs/firestore/query-data/listen
- **Paginate**: https://firebase.google.com/docs/firestore/query-data/query-cursors
- **Cache**: https://firebase.google.com/docs/firestore/manage-data/enable-offline
- **Security Rules**: https://firebase.google.com/docs/firestore/security/get-started
- **Best Practices**: https://firebase.google.com/docs/firestore/best-practices
