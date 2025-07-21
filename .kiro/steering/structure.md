# Project Structure & Architecture

## Root Structure

```
├── .kiro/                 # Kiro configuration and specs
├── functions/             # Firebase Cloud Functions
├── src/                   # React application source
├── public/                # Static assets
├── dist/                  # Build output
└── firebase.json          # Firebase configuration
```

## Source Code Organization

### Features (`src/features/`)

- **config/**: System configuration management
- **members/**: Member management (CRUD, modals)
- **rent/**: Rent and payment management

### Shared Resources (`src/shared/`)

- **components/**: Reusable UI components
- **types/**: TypeScript interfaces
- **utils/**: Helper functions and utilities

### Key Files

- `src/App.tsx`: Main application with routing
- `src/theme.ts`: Mantine theme configuration
- `src/contexts/`: React context providers
- `src/data/`: Mock data and Firebase services

## Component Architecture

### Naming Conventions

- Components: PascalCase (e.g., `MemberModal`)
- Files: Match component name exactly
- Hooks: camelCase with `use` prefix (e.g., `useMemberForm`)
- Types: PascalCase with descriptive names (e.g., `MemberFormData`)
- Constants: SCREAMING_SNAKE_CASE (e.g., `DEFAULT_SECURITY_DEPOSIT`)

### Component Structure Pattern

**Follow react-patterns.md for comprehensive React guidelines**

Standard component organization:

- Custom hooks first
- Built-in hooks second
- Memoized values third
- Event handlers fourth (memoized if passed to children)
- Early returns for loading/error states
- Main render last
- Always use displayName for debugging

### Modal Components

All modals follow consistent pattern:

- Located in `features/{domain}/components/modals/`
- Use `SharedModal` wrapper for consistency
- Extract form logic into custom hooks
- Form validation with Zod schemas
- Consistent button styling and layout
- Proper loading and error states
- Memoized expensive calculations
- Follow Mantine modal patterns and theming

### Custom Hooks Structure

**Reference react-patterns.md for detailed hook guidelines**

Custom hook organization:

- State management (useState or useReducer based on complexity)
- Side effects (useEffect only for external system synchronization)
- Memoized values (useMemo for expensive calculations)
- Callbacks (useCallback for stable references)
- Return object with clear, descriptive naming
- Always start hook names with "use" prefix

### Mantine Component Integration

- Use Mantine components consistently throughout the application
- Leverage Mantine's theming system for customization
- Reference https://mantine.dev/core/package/ for component documentation
- Apply theme configuration through MantineProvider
- Use Mantine's responsive utilities and breakpoints
- Implement Mantine's form handling patterns
- Rely on built-in accessibility features

## Data Flow

- Mock data in `src/data/mock/` for development phase
- Context providers for global state management
- Custom hooks for data access and business logic
- Firebase services for production data operations
- Follow react-patterns.md for proper state management patterns

## Development Workflow

1. **UI First**: Build components with mock data following Mantine design patterns
2. **React Patterns**: Apply react-patterns.md guidelines for hooks and state management
3. **Testing**: Test all interactions and states with proper error boundaries
4. **Firebase Integration**: Integrate Firebase services (Phase 2)
5. **Authentication**: Add authentication and security (Phase 5)

## Cross-Reference Guidelines

- **React Patterns**: See `.kiro/steering/react-patterns.md` for comprehensive React best practices
- **Technology Stack**: See `.kiro/steering/tech.md` for development standards and Mantine guidelines
- **Product Context**: See `.kiro/steering/product.md` for business requirements and feature context
