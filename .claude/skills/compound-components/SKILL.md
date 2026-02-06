---
name: building-compound-components
description: Creates unstyled compound components that separate business logic from styles. Use when building headless UI primitives, creating component libraries, implementing Radix-style namespaced components, or when the user mentions "compound components", "headless", "unstyled", "primitives", or "render props".
---

# Building Compound Components

Create unstyled, composable React components following the Radix UI / Base UI pattern. Components expose behavior via context while consumers control rendering.

## Project Rules

These rules are specific to this codebase and override general patterns.

### Hooks Are Internal

Hooks are implementation details, not public API. **Never export hooks from the index.**

```tsx
// index.tsx - CORRECT
export const Component = {
  Root: ComponentRoot,
  Content: ComponentContent,
};
export type { ComponentRootProps, ComponentContentRenderProps };

// index.tsx - WRONG
export { useComponentContext }; // Don't export hooks
```

Consumers access state via **render props**, not hooks. When styled wrappers in the **same package** need hook access, import directly from the source file:

```tsx
import { useComponentContext } from "../base/component/component-context";
```

### No Custom Data Fetching in Primitives

Base components can use `@tambo-ai/react` SDK hooks (components require Tambo provider anyway). **Custom data fetching logic** (combining sources, external providers) belongs in the styled layer.

```tsx
// OK - SDK hooks in primitive
const Root = ({ children }) => {
  const { value, setValue, submit } = useTamboThreadInput();
  const { isIdle, cancel } = useTamboThread();
  return <Context.Provider value={{ value, setValue, isIdle }}>{children}</Context.Provider>;
};

// WRONG - custom data fetching in primitive
const Textarea = ({ resourceProvider }) => {
  const { data: mcpResources } = useTamboMcpResourceList(search);
  const externalResources = useFetchExternal(resourceProvider);
  const combined = [...mcpResources, ...externalResources];
  return <div>{combined.map(...)}</div>;
};
```

### Pre-computed Props Arrays for Collections

When exposing collections via render props, **pre-compute all props in a memoized array** rather than providing a getter function.

```tsx
// AVOID - getter function pattern
const Items = ({ children }) => {
  const { rawItems, selectedId, removeItem } = useContext();
  const getItemProps = (index: number) => ({
    /* new object every call */
  });
  return children({ items: rawItems, getItemProps });
};

// PREFERRED - pre-computed array
const Items = ({ children }) => {
  const { rawItems, selectedId, removeItem } = useContext();

  const items = React.useMemo<ItemRenderProps[]>(
    () =>
      rawItems.map((item, index) => ({
        item,
        index,
        isSelected: selectedId === item.id,
        onSelect: () => setSelectedId(item.id),
        onRemove: () => removeItem(item.id),
      })),
    [rawItems, selectedId, removeItem],
  );

  return children({ items });
};
```

## Workflow

Copy this checklist and track progress:

```
Compound Component Progress:
- [ ] Step 1: Create context file
- [ ] Step 2: Create Root component
- [ ] Step 3: Create consumer components
- [ ] Step 4: Create namespace export (index.tsx)
- [ ] Step 5: Verify all guidelines met
```

### Step 1: Create context file

```
my-component/
├── index.tsx
├── component-context.tsx
├── component-root.tsx
├── component-item.tsx
└── component-content.tsx
```

Create a context with a null default and a hook that throws on missing provider:

```tsx
// component-context.tsx
const ComponentContext = React.createContext<ComponentContextValue | null>(
  null,
);

export function useComponentContext() {
  const context = React.useContext(ComponentContext);
  if (!context) {
    throw new Error("Component parts must be used within Component.Root");
  }
  return context;
}

export { ComponentContext };
```

### Step 2: Create Root component

Root manages state and provides context. Use `forwardRef`, support `asChild` via Radix `Slot`, and expose state via data attributes:

```tsx
// component-root.tsx
export const ComponentRoot = React.forwardRef<
  HTMLDivElement,
  ComponentRootProps
>(({ asChild, defaultOpen = false, children, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const Comp = asChild ? Slot : "div";

  return (
    <ComponentContext.Provider
      value={{ isOpen, toggle: () => setIsOpen(!isOpen) }}
    >
      <Comp ref={ref} data-state={isOpen ? "open" : "closed"} {...props}>
        {children}
      </Comp>
    </ComponentContext.Provider>
  );
});
ComponentRoot.displayName = "Component.Root";
```

### Step 3: Create consumer components

Choose the composition pattern based on need:

**Direct children** (simplest, for static content):

```tsx
const Content = ({ children, className, ...props }) => {
  const { data } = useComponentContext();
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
};
```

**Render prop** (when consumer needs internal state):

```tsx
const Content = ({ children, ...props }) => {
  const { data, isLoading } = useComponentContext();
  const content =
    typeof children === "function" ? children({ data, isLoading }) : children;
  return <div {...props}>{content}</div>;
};
```

**Sub-context** (for lists where each item needs own context):

```tsx
const Steps = ({ children }) => {
  const { reasoning } = useMessageContext();
  return (
    <StepsContext.Provider value={{ steps: reasoning }}>
      {children}
    </StepsContext.Provider>
  );
};

const Step = ({ children, index }) => {
  const { steps } = useStepsContext();
  return (
    <StepContext.Provider value={{ step: steps[index], index }}>
      {children}
    </StepContext.Provider>
  );
};
```

### Step 4: Create namespace export

```tsx
// index.tsx
export const Component = {
  Root: ComponentRoot,
  Trigger: ComponentTrigger,
  Content: ComponentContent,
};

// Re-export types only - never hooks
export type { ComponentRootProps } from "./component-root";
export type { ComponentContentProps } from "./component-content";
```

### Step 5: Verify guidelines

- **No styles in primitives** - consumers control all styling via className/props
- **Data attributes for CSS** - expose state like `data-state="open"`, `data-disabled`, `data-loading`
- **Support asChild** - let consumers swap the underlying element via Radix `Slot`
- **Forward refs** - always use `forwardRef`
- **Display names** - set for DevTools (`Component.Root`, `Component.Item`)
- **Throw on missing context** - fail fast with clear error messages
- **Export types** - consumers need `ComponentProps`, `RenderProps` interfaces
- **Hooks stay internal** - never export from index, expose state via render props
- **SDK hooks OK, custom fetching not** - `@tambo-ai/react` hooks are fine, combining logic goes in styled layer
- **Pre-compute collection props** - use `useMemo` arrays, not getter functions

## Pattern Selection

| Scenario             | Pattern         | Why                             |
| -------------------- | --------------- | ------------------------------- |
| Static content       | Direct children | Simplest, most flexible         |
| Need internal state  | Render prop     | Explicit state access           |
| List/iteration       | Sub-context     | Each item gets own context      |
| Element polymorphism | asChild         | Change underlying element       |
| CSS-only styling     | Data attributes | No JS needed for style variants |

## Anti-Patterns

- **Hardcoded styles** - primitives should be unstyled
- **Prop drilling** - use context instead
- **Missing error boundaries** - throw when context is missing
- **Inline functions in render prop types** - define proper interfaces
- **Default exports** - use named exports in namespace object
- **Exporting hooks** - hooks are internal; expose state via render props
- **Custom data fetching in primitives** - SDK hooks are fine, but combining/external fetching belongs in styled layer
- **Re-implementing base logic** - styled wrappers should compose, not duplicate
- **Getter functions for collections** - pre-compute props arrays in useMemo instead
