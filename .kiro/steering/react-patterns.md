# React Patterns & Best Practices

## Fundamental React Rules

### Rules of Hooks

- **Only call hooks at the top level** - Never inside loops, conditions, or nested functions
- **Only call hooks from React functions** - Components or custom hooks only
- **Custom hooks must start with "use"** - This enables React's linting rules
- **Hooks must be called in the same order every time** - React relies on call order to track state

### Component and Hook Purity

- **Components must be pure functions** - Same inputs always produce same outputs
- **No side effects during rendering** - Don't mutate variables, make API calls, or update DOM during render
- **Hooks should not cause side effects during render** - Side effects belong in useEffect or event handlers
- **Don't call components as functions** - Let React handle component lifecycle

## Hook Selection Guidelines

### State Management Hooks

**useState** - Use for:

- Simple, independent state values
- Boolean flags, strings, numbers
- State that doesn't depend on other state
- When you need direct state updates

**useReducer** - Use for:

- Complex state with multiple sub-values
- State transitions that depend on previous state
- When next state depends on the action type
- Complex update logic that would benefit from centralization

**useContext** - Use for:

- Sharing data across many components
- Avoiding prop drilling
- Global application state (theme, auth, settings)
- When multiple components need the same data

### Performance Hooks

**useMemo** - Use for:

- Expensive calculations that depend on specific values
- Creating objects/arrays that are passed as props
- Preventing unnecessary re-computations
- When child components depend on referential equality

**useCallback** - Use for:

- Event handlers passed to child components
- Functions passed as dependencies to other hooks
- Preventing unnecessary re-renders of memoized components
- When function identity matters for performance

**React.memo** - Use for:

- Components that render often with same props
- Components with expensive render logic
- Child components that receive stable props
- When parent re-renders frequently but child props rarely change

### Side Effect Hooks

**useEffect** - Use ONLY for:

- Synchronizing with external systems (APIs, subscriptions, timers)
- Setting up event listeners
- Manually updating DOM
- Cleanup operations
- Data fetching on mount or prop changes

**useLayoutEffect** - Use for:

- DOM measurements before browser paint
- Synchronous DOM mutations
- Preventing visual flicker
- When timing of DOM updates matters

### Ref Hooks

**useRef** - Use for:

- Accessing DOM elements directly
- Storing mutable values that don't trigger re-renders
- Keeping references to previous values
- Imperative operations (focus, scroll, animations)

**useImperativeHandle** - Use for:

- Customizing ref value exposed to parent components
- Limiting exposed imperative API
- Creating reusable component libraries
- When forwardRef needs custom behavior

### Advanced Hooks

**useId** - Use for:

- Generating unique IDs for accessibility attributes
- Avoiding hydration mismatches in SSR
- Creating stable IDs across renders
- Form field associations

**useDeferredValue** - Use for:

- Deferring updates to non-urgent UI parts
- Keeping UI responsive during heavy computations
- Showing stale content while new content loads
- Performance optimization for expensive renders

**useTransition** - Use for:

- Marking state updates as non-urgent
- Keeping UI responsive during state transitions
- Showing loading states for slow updates
- Prioritizing user interactions over background updates

## You Might Not Need useEffect

### Don't Use useEffect For:

**Derived State** - Use useMemo instead:

- Calculating values from existing state/props
- Filtering or transforming data
- Computing totals or aggregations

**Event Handlers** - Handle directly in event handlers:

- Responding to user interactions
- Form submissions
- Button clicks

**Resetting State** - Use key prop or state initialization:

- Clearing form when user changes
- Resetting component state based on props

**Expensive Calculations** - Use useMemo instead:

- Heavy computations during render
- Creating objects or arrays

### When You DO Need useEffect:

**External System Synchronization**:

- API calls and data fetching
- Setting up subscriptions
- Timer and interval management
- WebSocket connections

**DOM Manipulation**:

- Focus management
- Scroll position
- Third-party library integration

**Cleanup Operations**:

- Removing event listeners
- Canceling network requests
- Clearing timers

## Component Design Principles

### Single Responsibility Principle

- Each component should have one clear purpose
- Extract complex logic into custom hooks
- Break large components into smaller, focused ones
- Separate UI logic from business logic

### Composition Over Inheritance

- Use component composition instead of complex prop drilling
- Create reusable compound components
- Leverage children props and render props patterns
- Build flexible component APIs

### State Colocation

- Keep state as close to where it's used as possible
- Don't lift state up unnecessarily
- Use local state when possible
- Only share state when multiple components need it

## Performance Optimization

### Memoization Strategy

- **Measure first** - Don't optimize without profiling
- **useMemo for expensive calculations** - Only when computation is actually expensive
- **useCallback for stable references** - When function identity affects child renders
- **React.memo for stable props** - When component renders frequently with same props

### Dependency Array Best Practices

- **Include all dependencies** - Don't omit values used inside the effect
- **Use ESLint exhaustive-deps rule** - Catch missing dependencies automatically
- **Prefer primitive dependencies** - Objects and arrays change reference frequently
- **Extract functions outside component** - When they don't need component scope

## Error Handling Patterns

### Error Boundaries

- Implement error boundaries for feature sections
- Provide fallback UI for component errors
- Log errors for debugging and monitoring
- Don't use error boundaries for event handlers

### Async Error Handling

- Handle errors in async operations explicitly
- Use try-catch in async functions
- Provide loading and error states
- Show user-friendly error messages

## Custom Hook Patterns

### Hook Naming and Structure

- Always start with "use" prefix
- Return objects with descriptive property names
- Keep hooks focused on single responsibility
- Extract reusable logic from components

### Common Custom Hook Types

- **Data fetching hooks** - Manage API calls and state
- **Form hooks** - Handle form state and validation
- **Local storage hooks** - Sync state with browser storage
- **Window size hooks** - Track viewport dimensions

## Testing Approaches

### Component Testing

- Focus on user interactions and behavior
- Test what users see and do, not implementation details
- Use React Testing Library for user-centric tests
- Mock external dependencies appropriately

### Hook Testing

- Test custom hooks in isolation
- Use renderHook from testing library
- Test hook behavior, not implementation
- Verify state changes and side effects

## Anti-Patterns to Avoid

### State Management Anti-Patterns

- ❌ Using useEffect to sync state with props
- ❌ Storing derived state in useState
- ❌ Mutating state directly
- ❌ Using array indices as keys in dynamic lists

### Performance Anti-Patterns

- ❌ Overusing useMemo and useCallback without measuring
- ❌ Creating objects/functions in render without memoization
- ❌ Not memoizing expensive calculations
- ❌ Unnecessary re-renders due to unstable dependencies

### Effect Anti-Patterns

- ❌ Using useEffect for derived state
- ❌ Missing cleanup functions
- ❌ Incorrect dependency arrays
- ❌ Using useEffect for event handlers

### General Anti-Patterns

- ❌ Calling hooks conditionally
- ❌ Calling components as functions
- ❌ Side effects during render
- ❌ Mixing business logic with UI components

## Best Practices Summary

### Always Do

- ✅ Follow Rules of Hooks consistently
- ✅ Keep components pure and predictable
- ✅ Use proper TypeScript types for all props and state
- ✅ Extract business logic into custom hooks
- ✅ Handle loading and error states appropriately
- ✅ Use meaningful component and variable names
- ✅ Implement proper error boundaries
- ✅ Test user behavior, not implementation details

### Project-Specific Guidelines

- Use Mantine UI components consistently
- Follow feature-based folder structure
- Export components as named exports
- Use absolute imports with path mapping
- Implement SharedModal wrapper for consistency
- Handle Firebase operations in custom hooks
