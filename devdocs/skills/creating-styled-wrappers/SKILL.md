---
name: creating-styled-wrappers
description: Creates styled wrapper components that compose headless/base compound components. Use when refactoring styled components to use base primitives, implementing opinionated design systems on top of headless components, or when the user mentions "use base components", "compose primitives", "styled wrapper", or "refactor to use base".
---

# Styling Compound Wrappers

Create styled wrapper components that compose headless base compound components. This skill complements `building-compound-components` (which builds the base primitives) by focusing on **how to properly consume and wrap them** with styling and additional behavior.

**Real-world example**: See [references/real-world-example.md](references/real-world-example.md) for a complete before/after MessageInput refactoring.

## Core Principle: Compose, Don't Duplicate

Styled wrappers should **compose** base components, not **re-implement** their logic.

```tsx
// WRONG - re-implementing what base already does
const StyledInput = ({ children, className }) => {
  const { value, setValue, submit } = useTamboThreadInput(); // Duplicated!
  const [isDragging, setIsDragging] = useState(false); // Duplicated!
  const handleDrop = useCallback(/* ... */); // Duplicated!

  return (
    <form onDrop={handleDrop} className={className}>
      {children}
    </form>
  );
};

// CORRECT - compose the base component
const StyledInput = ({ children, className, variant }) => {
  return (
    <BaseInput.Root className={cn(inputVariants({ variant }), className)}>
      <BaseInput.Content className="rounded-xl data-[dragging]:border-dashed">
        {children}
      </BaseInput.Content>
    </BaseInput.Root>
  );
};
```

## Refactoring Workflow

Copy this checklist and track progress:

```
Styled Wrapper Refactoring:
- [ ] Step 1: Identify duplicated logic
- [ ] Step 2: Import base components
- [ ] Step 3: Wrap with Base Root
- [ ] Step 4: Apply state-based styling and behavior
- [ ] Step 5: Wrap sub-components with styling
- [ ] Step 6: Final verification
```

### Step 1: Identify Duplicated Logic

Look for patterns that indicate logic should come from base:

- SDK hooks (`useTamboThread`, `useTamboThreadInput`, etc.)
- Context creation (`React.createContext`)
- State management that mirrors base component state
- Event handlers (drag, submit, etc.) that base components handle

### Step 2: Import Base Components

```tsx
import { MessageInput as MessageInputBase } from "@tambo-ai/react-ui-base/message-input";
```

### Step 3: Wrap with Base Root

Replace custom context/state management with the base Root:

```tsx
// Before
const MessageInput = ({ children, variant }) => {
  return (
    <MessageInputInternal variant={variant}>{children}</MessageInputInternal>
  );
};

// After
const MessageInput = ({ children, variant, className }) => {
  return (
    <MessageInputBase.Root className={cn(variants({ variant }), className)}>
      {children}
    </MessageInputBase.Root>
  );
};
```

### Step 4: Apply State-Based Styling and Behavior

State access follows a hierarchy — use the simplest option that works:

1. **Data attributes** (preferred for styling) — base components expose `data-*` attributes
2. **Render props** (for behavior changes) — use when rendering different components
3. **Context hooks** (for sub-components) — OK for styled sub-components needing deep context access

```tsx
// BEST - data-* classes for styling, render props only for behavior
// Note: use `data-[dragging]:*` syntax (v3-compatible), not `data-dragging:*` (v4 only)
const StyledContent = ({ children }) => (
  <BaseComponent.Content
    className={cn(
      "group rounded-xl border",
      "data-[dragging]:border-dashed data-[dragging]:border-emerald-400",
    )}
  >
    {({ elicitation, resolveElicitation }) => (
      <>
        {/* Drop overlay uses group-data-* for styling */}
        <div className="hidden group-data-[dragging]:flex absolute inset-0 bg-emerald-50/90">
          <p>Drop files here</p>
        </div>

        {elicitation ? (
          <ElicitationUI
            request={elicitation}
            onResponse={resolveElicitation}
          />
        ) : (
          children
        )}
      </>
    )}
  </BaseComponent.Content>
);

// OK - styled sub-components can use context hook for deep access
const StyledTextarea = ({ placeholder }) => {
  const { value, setValue, handleSubmit, editorRef } = useMessageInputContext();
  return (
    <CustomEditor
      ref={editorRef}
      value={value}
      onChange={setValue}
      onSubmit={handleSubmit}
      placeholder={placeholder}
    />
  );
};
```

**When to use context hooks vs render props:**

- Render props: when the parent wrapper needs state for behavior changes
- Context hooks: when a styled sub-component needs values not exposed via render props

### Step 5: Wrap Sub-Components

```tsx
// Submit button
const SubmitButton = ({ className, children }) => (
  <BaseComponent.SubmitButton className={cn("w-10 h-10 rounded-lg", className)}>
    {({ showCancelButton }) =>
      children ?? (showCancelButton ? <Square /> : <ArrowUp />)
    }
  </BaseComponent.SubmitButton>
);

// Error
const Error = ({ className }) => (
  <BaseComponent.Error className={cn("text-sm text-destructive", className)} />
);

// Staged images - base pre-computes props array, just iterate
const StagedImages = ({ className }) => (
  <BaseComponent.StagedImages className={cn("flex gap-2", className)}>
    {({ images }) =>
      images.map((imageProps) => (
        <ImageBadge key={imageProps.image.id} {...imageProps} />
      ))
    }
  </BaseComponent.StagedImages>
);
```

### Step 6: Final Verification

```
Final Checks:
- [ ] No duplicate context creation
- [ ] No duplicate SDK hooks in root wrappers
- [ ] No duplicate state management or event handlers
- [ ] Base namespace imported and `Base.Root` used as wrapper
- [ ] `data-*` classes used for styling (with `group-data-*` for children)
- [ ] Render props used only for rendering behavior changes
- [ ] Base sub-components wrapped with styling
- [ ] Icon factories passed from styled layer to base hooks
- [ ] Visual sub-components and CSS variants stay in styled layer
```

## What Belongs in Styled Layer

### Icon Factories

When base hooks need icons, pass a factory function:

```tsx
// Base hook accepts optional icon factory
export function useCombinedResourceList(
  providers: ResourceProvider[] | undefined,
  search: string,
  createMcpIcon?: (serverName: string) => React.ReactNode,
) {
  /* ... */
}

// Styled layer provides the factory
const resources = useCombinedResourceList(providers, search, (serverName) => (
  <McpServerIcon name={serverName} className="w-4 h-4" />
));
```

### CSS Variants

```tsx
const inputVariants = cva("w-full", {
  variants: {
    variant: {
      default: "",
      solid: "[&>div]:shadow-xl [&>div]:ring-1",
      bordered: "[&>div]:border-2",
    },
  },
});
```

### Layout Logic, Visual Sub-Components, Custom Data Fetching

These all stay in the styled layer. Base handles behavior; styled handles presentation.

## Type Handling

Handle ref type differences between base and styled components:

```tsx
// Base context may have RefObject<T | null>
// Styled component may need RefObject<T>
<TextEditor ref={editorRef as React.RefObject<TamboEditor>} />
```

## Anti-Patterns

- **Re-implementing base logic** - if base handles it, compose it
- **Using render props for styling** - prefer `data-*` classes; render props are for behavior changes
- **Duplicating context in wrapper** - use base Root which provides context
- **Hardcoding icons in base hooks** - use factory functions to keep styling in styled layer
