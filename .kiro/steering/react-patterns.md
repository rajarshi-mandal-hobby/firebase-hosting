---
inclusion: fileMatch
fileMatchPattern: ['**/*.ts', '**/*.tsx']
---

# React Hook Selection Guide

## State Hooks

State lets a component "remember" information like user input. Use these hooks to add state to components:

**useState** - Component state for simple values

- Primitive values (boolean, string, number)
- Form inputs, toggles, counters
- When state doesn't depend on other state
- Single values that change independently

**useReducer** - Component state with complex update logic

- Multiple related state values
- State transitions based on action types
- Complex update patterns requiring validation
- When next state depends on current state and action
- Centralized state update logic

## Context Hooks

Context lets a component receive information from distant parents without passing it as props:

**useContext** - Read and subscribe to context

- Access shared data across component tree
- Theme, authentication, global settings
- Avoiding prop drilling
- When multiple components need same data

## Ref Hooks

Refs let a component hold information that isn't used for rendering, like DOM nodes or timeout IDs:

**useRef** - Reference a value that's not needed for rendering

- Direct DOM element access
- Storing mutable values without re-renders
- Previous values, timers, intervals
- Imperative operations (focus, scroll, animations)
- Instance variables that persist across renders

**useImperativeHandle** - Customize the ref exposed by your component

- Control what parent components can access via ref
- Limit exposed imperative API
- Custom component libraries
- When forwardRef needs specific behavior

## Effect Hooks

Effects let a component connect to and synchronize with external systems:

**useEffect** - Connect to an external system

- External system synchronization (APIs, subscriptions)
- Event listeners setup/cleanup
- Firebase real-time listeners
- Timer/interval management
- NOT for derived state or event handlers

**useLayoutEffect** - Fire before the browser repaints the screen

- DOM measurements before browser paint
- Preventing visual flicker
- Synchronous DOM mutations
- When timing of DOM updates is critical

**useInsertionEffect** - Fire before React makes DOM changes

- Inserting styles before layout effects
- CSS-in-JS library implementations
- Dynamic style injection
- Rarely needed in application code

## Performance Hooks

Optimize re-rendering performance by skipping unnecessary work or prioritizing updates:

**useMemo** - Cache the result of a calculation between re-renders

- Heavy computations with specific dependencies
- Creating objects/arrays passed as props
- When child components depend on referential equality
- Expensive filtering/transforming operations

**useCallback** - Cache a function definition between re-renders

- Event handlers passed to child components
- Functions used in other hook dependencies
- When function identity affects child re-renders
- Stable references for optimized components

**useTransition** - Update state without blocking the UI

- Marking updates as low priority
- Keeping UI responsive during heavy operations
- Background data processing
- Search filtering, sorting operations

**useDeferredValue** - Defer updating a part of the UI

- Showing stale content while new content loads
- Keeping UI responsive during computations
- Debouncing expensive operations
- Progressive enhancement patterns

## Resource Hooks

Access resources without them being part of your component's state:

**use** - Read the value of a resource like Promise or context

- Reading promises that suspend rendering
- Conditional context consumption
- Suspense integration
- Data fetching with concurrent features

## Action Hooks

Handle actions, form submissions, and state transitions:

**useActionState** - Update state based on the result of a form action

- Form submissions with pending/error states
- Server actions integration
- Progressive enhancement
- Built-in loading and error handling

**useOptimistic** - Show optimistic state while async action is underway

- Immediate UI feedback before server response
- Better UX for slow network operations
- Automatic rollback on errors
- Social interactions (likes, comments)

## Other Hooks

Mostly useful for library authors, not commonly used in application code:

**useId** - Generate unique IDs that can be passed to accessibility attributes

- Accessibility attributes (aria-describedby, aria-labelledby)
- Form field associations
- Avoiding hydration mismatches in SSR
- Stable IDs across renders

**useDebugValue** - Add a label to a custom Hook in React DevTools

- Display custom hook values in React DevTools
- Debugging custom hook behavior
- Development-time diagnostics
- Optional formatting function for complex values

**useSyncExternalStore** - Subscribe to an external store

- Subscribing to external data sources
- Browser APIs (localStorage, window size)
- Third-party state management libraries
- Global state not managed by React

## You Might Not Need useEffect

### ❌ Don't Use useEffect For:

- **Derived State** → Calculate in render or use `useMemo`
- **Event Handlers** → Handle directly in event callbacks
- **Resetting State** → Use `key` prop or conditional initialization
- **Expensive Calculations** → Use `useMemo` for memoization
- **Updating state based on props** → Derive state or use `useMemo`

### ✅ DO Use useEffect For:

- External system synchronization (APIs, WebSockets)
- Firebase real-time listeners and subscriptions
- Timer/interval setup and cleanup
- Event listener registration/removal
- DOM manipulation after render
- Cleanup operations when component unmounts

## Hook Decision Tree

### State Management Decision

- **Simple value?** → `useState`
- **Complex state with actions?** → `useReducer`
- **Shared across components?** → `useContext`
- **External store?** → `useSyncExternalStore`

### Performance Decision

- **Expensive calculation?** → `useMemo`
- **Stable function reference?** → `useCallback`
- **Component re-renders often?** → `React.memo`
- **Non-urgent updates?** → `useTransition`
- **Defer expensive updates?** → `useDeferredValue`

### Side Effect Decision

- **External system sync?** → `useEffect`
- **DOM measurement before paint?** → `useLayoutEffect`
- **CSS injection?** → `useInsertionEffect`

### Form/Action Decision

- **Form with server actions?** → `useActionState`
- **Optimistic updates?** → `useOptimistic`
- **Read promises in render?** → `use`

## Project-Specific Patterns

### Mantine Integration

- Use Mantine's built-in form hooks for validation
- Leverage Mantine components over custom implementations
- Apply consistent theming through MantineProvider
- Use Mantine's responsive utilities and breakpoints

### Firebase Integration

- Extract Firestore operations into custom hooks
- Use `useEffect` for real-time listeners with proper cleanup
- Handle loading and error states consistently
- Implement optimistic updates for better UX

### Modal Management

- Use SharedModal wrapper for consistent styling
- Extract form logic into reusable custom hooks
- Handle loading states during form submissions
- Implement proper error handling and user feedback

### Component Organization

- Custom hooks first, built-in hooks second
- Memoized values third, event handlers fourth
- Early returns for loading/error states
- Main render logic last
- Always set displayName for debugging

## Critical Anti-Patterns

### ❌ Never Do

- Use `useEffect` to sync state with props
- Store derived state in `useState`
- Mutate state directly
- Call hooks conditionally or in loops
- Create objects/functions in render without memoization
- Use array indices as keys for dynamic lists
- Call components as functions
- Perform side effects during render

### ⚠️ Common Mistakes

- Missing cleanup functions in `useEffect`
- Incorrect or missing dependency arrays
- Overusing `useMemo`/`useCallback` without measuring
- Mixing business logic directly in components
- Not handling loading and error states
- Creating unstable dependencies in effect arrays
- Using `useLayoutEffect` when `useEffect` suffices

## Rules of Hooks

### Fundamental Rules

- Only call hooks at the top level of components or custom hooks
- Never call hooks inside loops, conditions, or nested functions
- Custom hooks must start with "use" prefix
- Hooks must be called in the same order every render
- Components must be pure functions during render

### Dependency Array Rules

- Include all values from component scope used inside the effect
- Use ESLint exhaustive-deps rule to catch missing dependencies
- Prefer primitive values over objects/arrays as dependencies
- Extract functions outside component if they don't need component scope
- Use `useCallback` for functions that are dependencies

## Project Standards

### Component Architecture

- Export components as named exports (not default)
- Use absolute imports with path mapping
- Follow feature-based folder structure
- Set displayName for all components
- Handle loading and error states consistently

### State Management

- Keep state as close to where it's used as possible
- Use `useReducer` for complex state logic
- Extract business logic into custom hooks
- Use context sparingly for truly global state

### Performance

- Measure before optimizing with memoization
- Use `React.memo` for components that render frequently
- Implement proper error boundaries
- Use `useTransition` for non-urgent updates

### Firebase Integration

- Extract Firestore operations into custom hooks
- Use `useEffect` for real-time listeners with cleanup
- Implement optimistic updates where appropriate
- Handle offline states and errors gracefully

### Mantine Integration

- Use Mantine components consistently
- Leverage Mantine's theming system
- Use SharedModal wrapper for all modals
- Apply responsive design with Mantine utilities
