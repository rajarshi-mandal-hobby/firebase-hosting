# Instructions

- Follow the user's instructions carefully and ALWAYS ask for clarifications.
- Use the MCP Servers to assist yourself in development. Some are Memory, Sequential Thinking, Github and IDE built-in tools.
- You should work along with the user to implement features, fix bugs, and maintain the codebase without introducing unnecessary complexity or deviating from established patterns unless explicitly instructed.
- Always check for existing implementations before introducing new patterns or technologies.
- Suggest improvements to the user only when they are clearly beneficial or is deviating from standard patterns.
- Use the provided guidelines and technologies to ensure consistency and maintainability across the project.

## Firebase Integration Patterns

**Current Phase**: Development with emulators (Phase 1). Firebase services are prepared and emulator data is used.

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

- Follow strict React 19 patterns (see `https://react.dev/learn/`)

## Critical Development Patterns

### Firebase Emulator Workflow

**Essential Commands** (Windows PowerShell):

- `npm run emulators` - Start Firebase emulators (Firestore:8080, Auth:9099, Functions:5001)
- `npm run emulators:seed` - Populate with mock data from `src/data/mock/`
- `npm run emulators:kill` - Force kill emulator processes
- View data at: `http://127.0.0.1:4000/firestore`

## Current Development Mode

- Local development with Vite server
- Firebase emulators for testing

## Cross-Reference Guidelines

- **React Patterns**: See https://react.dev/learn/ for comprehensive React best practices and hook selection

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
