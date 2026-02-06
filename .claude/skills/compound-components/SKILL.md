---
name: building-compound-components
description: Creates unstyled compound components that separate business logic from styles. Use when building headless UI primitives, creating component libraries, implementing Radix-style namespaced components, or when the user mentions "compound components", "headless", "unstyled", "primitives", or "render props".
---

# Building Compound Components

Create unstyled, composable React components following the Radix UI / Base UI pattern. Components expose behavior via context while consumers control rendering.

## Quick Start

```tsx
// 1. Create context for shared state
const StepsContext = React.createContext<StepsContextValue | null>(null);

// 2. Create Root that provides context
const StepsRoot = ({ children, className, ...props }) => {
  const [steps] = useState(["Step 1", "Step 2"]);
  return (
    <StepsContext.Provider value={{ steps }}>
      <div className={className} {...props}>
        {children}
      </div>
    </StepsContext.Provider>
  );
};

// 3. Create consumer components
const StepsItem = ({ children, className, ...props }) => {
  const { steps } = useStepsContext();
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
};

// 4. Export as namespace
export const Steps = {
  Root: StepsRoot,
  Item: StepsItem,
};
```

## Core Pattern

### File Structure

```
my-component/
├── index.tsx              # Namespace export
├── root/
│   ├── component-root.tsx
│   └── component-context.tsx
├── item/
│   └── component-item.tsx
└── content/
    └── component-content.tsx
```

### Context Pattern

```tsx
// component-context.tsx
import * as React from "react";

interface ComponentContextValue {
  data: unknown;
  isOpen: boolean;
  toggle: () => void;
}

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

### Root Component

```tsx
// component-root.tsx
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { ComponentContext } from "./component-context";

interface ComponentRootProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  defaultOpen?: boolean;
}

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

### Namespace Export

```tsx
// index.tsx
import { ComponentRoot } from "./root/component-root";
import { ComponentTrigger } from "./trigger/component-trigger";
import { ComponentContent } from "./content/component-content";

export const Component = {
  Root: ComponentRoot,
  Trigger: ComponentTrigger,
  Content: ComponentContent,
};

// Re-export types
export type { ComponentRootProps } from "./root/component-root";
export type { ComponentContentProps } from "./content/component-content";
```

## Composition Patterns

### Pattern 1: Direct Children (Simplest)

Best for static content. Consumer just adds children.

```tsx
// Component
const Content = ({ children, className, ...props }) => {
  const { data } = useContext();
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
};

// Usage
<Component.Content className="my-styles">
  <p>Static content here</p>
</Component.Content>;
```

### Pattern 2: Children as Render Function (State Access)

Best when consumer needs internal state. Children can be a function that receives render props.

```tsx
// Component
interface ContentRenderProps {
  data: string;
  isLoading: boolean;
}

type ContentProps = BasePropsWithChildrenOrRenderFunction<
  React.HTMLAttributes<HTMLDivElement>,
  ContentRenderProps
>;

const Content = React.forwardRef<HTMLDivElement, ContentProps>(
  ({ asChild, ...props }, ref) => {
    const { data, isLoading } = useContext();
    const Comp = asChild ? Slot : "div";

    const { content, componentProps } = useRender(props, { data, isLoading });

    return (
      <Comp ref={ref} data-loading={isLoading || undefined} {...componentProps}>
        {content}
      </Comp>
    );
  },
);

// Usage - children as function
<Component.Content>
  {({ data, isLoading }) => (
    <div className={isLoading ? "opacity-50" : ""}>{data}</div>
  )}
</Component.Content>;

// Usage - static children (state accessed via data attributes or sub-components)
<Component.Content className="data-[loading]:opacity-50">
  <p>Static content</p>
</Component.Content>;
```

**Never use a `render` prop.** Always use children — either as static ReactNode or as a function.

### Pattern 3: Sub-Context (Maximum Composability)

Best for lists/iterations where each item needs its own context.

```tsx
// Parent provides array context
const Steps = ({ children }) => {
  const { reasoning } = useMessageContext();
  return (
    <StepsContext.Provider value={{ steps: reasoning }}>
      {children}
    </StepsContext.Provider>
  );
};

// Item provides individual step context
const Step = ({ children, index }) => {
  const { steps } = useStepsContext();
  return (
    <StepContext.Provider value={{ step: steps[index], index }}>
      {children}
    </StepContext.Provider>
  );
};

// Content reads from nearest context
const StepContent = ({ className }) => {
  const { step } = useStepContext();
  return <div className={className}>{step}</div>;
};

// Usage - maximum flexibility
<ReasoningInfo.Steps className="space-y-4">
  {steps.map((_, i) => (
    <ReasoningInfo.Step key={i} index={i}>
      <div className="custom-wrapper">
        <ReasoningInfo.StepContent className="text-sm" />
      </div>
    </ReasoningInfo.Step>
  ))}
</ReasoningInfo.Steps>;
```

## Essential Features

### 1. Data Attributes for CSS Styling

Expose state via data attributes so consumers can style with CSS only:

```tsx
<div
  data-state={isOpen ? "open" : "closed"}
  data-disabled={disabled || undefined}
  data-loading={isLoading || undefined}
  data-slot="component-trigger"
  {...props}
>
```

CSS targeting:

```css
[data-state="open"] {
  /* open styles */
}
[data-slot="component-trigger"]:hover {
  /* hover styles */
}
```

### 2. asChild Pattern (Radix Slot)

Allow consumers to replace the default element:

```tsx
import { Slot } from "@radix-ui/react-slot";

interface Props extends React.HTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const Trigger = ({ asChild, ...props }) => {
  const Comp = asChild ? Slot : "button";
  return <Comp {...props} />;
};

// Usage
<Component.Trigger asChild>
  <a href="/link">I'm a link now</a>
</Component.Trigger>;
```

### 3. Ref Forwarding

Always forward refs for DOM access:

```tsx
export const Component = React.forwardRef<HTMLDivElement, Props>(
  (props, ref) => {
    return <div ref={ref} {...props} />;
  },
);
Component.displayName = "Component";
```

### 4. Proper TypeScript

Export prop types for consumers:

```tsx
export interface ComponentRootProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  defaultOpen?: boolean;
}

export interface ComponentContentRenderProps {
  data: string;
  isLoading: boolean;
}
```

## Guidelines

- **No styles in primitives** - consumers control all styling via className/props
- **Context for state sharing** - parent manages, children consume
- **Data attributes for CSS** - expose state like `data-state="open"`
- **Support asChild** - let consumers swap the underlying element
- **Forward refs** - always use forwardRef
- **Display names** - set for React DevTools (`Component.Root`, `Component.Item`)
- **Throw on missing context** - fail fast with clear error messages
- **Export types** - consumers need `ComponentProps`, `RenderProps` types

## When to Use Each Pattern

| Scenario             | Pattern                     | Why                             |
| -------------------- | --------------------------- | ------------------------------- |
| Static content       | Direct children             | Simplest, most flexible         |
| Need internal state  | Children as render function | Explicit state access           |
| List/iteration       | Sub-context                 | Each item gets own context      |
| Element polymorphism | asChild                     | Change underlying element       |
| CSS-only styling     | Data attributes             | No JS needed for style variants |

## Hooks Are Internal

Hooks are implementation details, not public API. **Never export hooks from the index.**

```tsx
// index.tsx - WRONG
export { useComponentContext }; // ❌ Don't export hooks

// index.tsx - CORRECT
export const Component = {
  Root: ComponentRoot,
  Content: ComponentContent,
};
// ✅ Only export components and types
export type { ComponentRootProps, ComponentContentRenderProps };
```

Consumers access state via **render props**, not hooks:

```tsx
// Consumer code - using render props (correct)
<Component.Content>
  {({ isOpen, toggle }) => (
    <button onClick={toggle}>{isOpen ? "Close" : "Open"}</button>
  )}
</Component.Content>
```

When styled wrappers in the **same package** need hook access, import directly from the source file:

```tsx
// ✅ Internal use - import from source file
import { useComponentContext } from "../base/component/component-context";

// ❌ Wrong - hooks shouldn't be in the public index
import { useComponentContext } from "../base/component"; // Not exported
```

This keeps hooks internal while allowing same-package usage.

## No Custom Data Fetching in Primitives

Base components can use `@tambo-ai/react` SDK hooks - they're designed to work within a Tambo provider. However, **custom data fetching logic** (combining sources, external providers, etc.) belongs in the styled layer.

```tsx
// ✅ OK - using @tambo-ai/react SDK hooks
const Root = ({ children }) => {
  const { value, setValue, submit } = useTamboThreadInput();
  const { isIdle, cancel } = useTamboThread();
  // SDK hooks are fine - components require Tambo provider anyway
  return <Context.Provider value={{ value, setValue, isIdle }}>{children}</Context.Provider>;
};

// ❌ WRONG - custom data fetching in primitive
const Textarea = ({ resourceProvider }) => {
  const { data: mcpResources } = useTamboMcpResourceList(search);
  const externalResources = useFetchExternal(resourceProvider); // Custom fetching
  const combined = [...mcpResources, ...externalResources]; // Combining logic
  return <div>{combined.map(...)}</div>;
};

// ✅ CORRECT - primitive exposes state via render props, styled layer does custom fetching
const Textarea = ({ children }) => {
  const { value, setValue, disabled } = useContext();
  return (
    <div data-disabled={disabled}>
      {typeof children === "function"
        ? children({ value, setValue, disabled })
        : children}
    </div>
  );
};
```

Custom data fetching and combining logic belongs in the **styled wrapper layer**.

## Pre-computed Props Arrays for Collections

When exposing collections via render props, **pre-compute all props in a memoized array** rather than providing a getter function. This is more performant (single memoization vs per-item function calls) and simpler for consumers.

```tsx
// ❌ AVOID - getter function pattern
export interface ItemsRenderProps {
  items: RawItem[];
  getItemProps: (index: number) => ItemRenderProps;
}

const Items = ({ children }) => {
  const { rawItems, selectedId, removeItem } = useContext();

  // Getter creates new object on every call
  const getItemProps = (index: number) => ({
    item: rawItems[index],
    isSelected: selectedId === rawItems[index].id,
    onRemove: () => removeItem(rawItems[index].id),
  });

  return children({ items: rawItems, getItemProps });
};

// ✅ PREFERRED - pre-computed array
export interface ItemsRenderProps {
  items: ItemRenderProps[];
}

const Items = ({ children }) => {
  const { rawItems, selectedId, removeItem } = useContext();

  // Pre-compute all props once, memoized
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

This pattern:

- Memoizes computation once per render cycle
- Gives consumers a simple array to iterate
- Pre-binds callbacks so consumers don't need to manage indices

## Anti-Patterns

- **Hardcoded styles** - primitives should be unstyled
- **Prop drilling** - use context instead
- **Missing error boundaries** - throw when context is missing
- **Inline functions in render prop types** - define proper interfaces
- **Default exports** - use named exports in namespace object
- **Exporting hooks** - hooks are internal; expose state via children-as-function or sub-components
- **Custom data fetching in primitives** - SDK hooks are fine, but combining/external fetching belongs in styled layer
- **Re-implementing base logic** - styled wrappers should compose, not duplicate
- **Getter functions for collections** - pre-compute props arrays in useMemo instead
