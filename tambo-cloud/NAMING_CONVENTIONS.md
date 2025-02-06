# Hydra AI React Naming Conventions

### Naming Prefixes

- Components: `Hydra`
- Hooks: `useHydra`
- Types: `Hydra`
- Props Interface: `HydraNameProps`
- Context: `HydraNameContext`
- Boolean props:
  - `is` → Current state/condition (isLoading, isActive)
  - `can` → Permissions/abilities (canEdit, canSubmit)
  - `has` → Existence/past state (hasError, hasData)
  - `should` → Configuration/future (shouldRefresh)

## Core Principles

- Use `Readonly<T>` for props

```typescript
export const HydraMessage: React.FC<Readonly<HydraMessageProps>> = () => { ... }
```

## Hooks

- Prefix: `useHydra` + Feature
- Specific action last
- Keep single responsibility

```typescript
useHydraMessage(); // ✓ Core hook
useHydraMessageState(); // ✓ State management
useMessageHydra(); // ✗ Wrong prefix order
```

## Props & Types

```typescript
// Props - Always Readonly
interface HydraMessageProps extends Readonly<{
  id: string;                                    // Required props first
  onUpdate: (message: HydraMessage) => void;     // Callbacks use 'on' prefix
  isLoading?: boolean;                          // Optional props last
}> {}

// Types - Clear hierarchy
type HydraMessage = { ... }                     // Core type
type HydraMessageState = { ... }                // State type
type HydraMessageConfig = { ... }               // Config type
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
