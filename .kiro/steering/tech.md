# Technology Stack & Standards

## Frontend Stack

- **React 19** with TypeScript 5.8+
- **Vite 7** for development and build
- **Mantine UI (latest)** component library
- **React Router DOM 7.6** for routing
- **Zod 4.0** for validation

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
- **Custom Hooks**: Extract complex logic into reusable hooks
- **Component Composition**: Break large components into smaller, focused ones
- **State Management**: Use useReducer for complex state, useState for simple state
- **Performance**: Use React.memo, useMemo, useCallback strategically
- **Data fetching**: Use useEffect to synchronize with some external system
- **Error Boundaries**: Implement proper error handling at component boundaries
- **Prop Types**: Use TypeScript interfaces for all component props
- **Event Handlers**: Use useCallback for event handlers passed to child components

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

### File Organization

- **features/**: Feature-based modules
- **shared/**: Reusable components/utils
- **pages/**: Route components
- **contexts/**: React contexts
- **data/**: Services and mock data
- **hooks/**: Custom hooks

### Firebase Rules

- Authentication last (Phase 5)
- Use emulators for development
- Cloud Functions in TypeScript
- Firestore security rules with RBAC

## Current Development Mode

- Mock data for all components
- Authentication bypass enabled
- Firebase emulators for testing

## Cross-Reference Guidelines

- **React Patterns**: See `.kiro/steering/react-patterns.md` for comprehensive React best practices and hook selection
- **Project Structure**: See `.kiro/steering/structure.md` for architecture patterns and component organization
- **Product Context**: See `.kiro/steering/product.md` for business requirements and feature specifications

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
