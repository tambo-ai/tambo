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

### Pattern 2: Render Prop (State Access)

Best when consumer needs internal state.

```tsx
// Component
interface ContentProps {
  render?: (props: { data: string; isLoading: boolean }) => React.ReactNode;
  children?: React.ReactNode;
}

const Content = ({ render, children, ...props }) => {
  const { data, isLoading } = useContext();

  const content = render ? render({ data, isLoading }) : children;
  return <div {...props}>{content}</div>;
};

// Usage
<Component.Content
  render={({ data, isLoading }) => (
    <div className={isLoading ? "opacity-50" : ""}>{data}</div>
  )}
/>;
```

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
