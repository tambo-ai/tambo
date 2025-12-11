# Tambo React Naming Conventions

### Naming Prefixes

- Components: `Tambo`
- Hooks: `useTambo`
- Types: `Tambo`
- Props Interface: `TamboNameProps`
- Context: `TamboNameContext`
- Boolean props:
  - `is` → Current state/condition (isLoading, isActive)
  - `can` → Permissions/abilities (canEdit, canSubmit)
  - `has` → Existence/past state (hasError, hasData)
  - `should` → Configuration/future (shouldRefresh)

## Core Principles

- Use `Readonly<T>` for props

```typescript
export const TamboMessage: React.FC<Readonly<TamboMessageProps>> = () => {
  /* ... */
};
```

## Hooks

- Prefix: `useTambo` + Feature
- Specific action last
- Keep single responsibility

```typescript
useTamboMessage(); // ✓ Core hook
useTamboMessageState(); // ✓ State management
useMessageTambo(); // ✗ Wrong prefix order
```

## Props & Types

```typescript
// Props - Always Readonly
interface TamboMessageProps extends Readonly<{
  id: string; // Required props first
  onUpdate: (message: TamboMessage) => void; // Callbacks use 'on' prefix
  isLoading?: boolean; // Optional props last
}> {}

// Types - Clear hierarchy
type TamboMessage = {
  /* ... */
}; // Core type
type TamboMessageState = {
  /* ... */
}; // State type
type TamboMessageConfig = {
  /* ... */
}; // Config type
```

## Event Handlers

```typescript
// Props (external)
onMessageSend: (msg: string) => void;           // ✓ 'on' prefix

// Implementation (internal)
const handleSend = useCallback(() => {          // ✓ 'handle' prefix
  // Implementation
}, [deps]);
```
