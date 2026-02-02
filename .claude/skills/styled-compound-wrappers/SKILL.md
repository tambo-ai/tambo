---
name: styled-compound-wrappers
description: Creates styled wrapper components that compose headless/base compound components. Use when refactoring styled components to use base primitives, implementing opinionated design systems on top of headless components, or when the user mentions "use base components", "compose primitives", "styled wrapper", or "refactor to use base".
---

# Implementing Styled Compound Wrappers

Create styled wrapper components that compose headless base compound components. This skill complements `compound-components` (which builds the base primitives) by focusing on **how to properly consume and wrap them** with styling and additional behavior.

## When to Use

This skill applies when:

- Refactoring a styled component to use existing base/headless components
- Creating a design system layer on top of primitives
- The styled component duplicates logic that base components already handle
- Adding custom data fetching or business logic on top of base components

## Core Principle: Compose, Don't Duplicate

Styled wrappers should **compose** base components, not **re-implement** their logic.

```tsx
// ❌ WRONG - re-implementing what base already does
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

// ✅ CORRECT - compose the base component
const StyledInput = ({ children, className, variant }) => {
  return (
    <BaseInput.Root className={cn(inputVariants({ variant }), className)}>
      <BaseInput.Content>
        {({ isDragging }) => (
          <div className={cn("rounded-xl", isDragging && "border-dashed")}>
            {children}
          </div>
        )}
      </BaseInput.Content>
    </BaseInput.Root>
  );
};
```

## Refactoring Pattern

When refactoring a styled component to use base components:

### Step 1: Identify Duplicated Logic

Look for these patterns that indicate logic should come from base:

- SDK hooks (`useTamboThread`, `useTamboThreadInput`, etc.)
- Context creation (`React.createContext`)
- State management that mirrors base component state
- Event handlers (drag, submit, etc.) that base components handle

### Step 2: Import Base Components

Import the base namespace:

```tsx
// Import base compound components
import { MessageInput as MessageInputBase } from "../../base/message-input";
```

### Step 3: Wrap with Base Root

Replace custom context/state management with the base Root component:

```tsx
// Before: Custom internal component with all the logic
const MessageInput = ({ children, variant }) => {
  return (
    <MessageInputInternal variant={variant}>{children}</MessageInputInternal>
  );
};

// After: Compose base Root
const MessageInput = ({ children, variant, className }) => {
  return (
    <MessageInputBase.Root className={cn(variants({ variant }), className)}>
      {children}
    </MessageInputBase.Root>
  );
};
```

### Step 4: Use Data Attributes for Styling, Render Props for Behavior

**Prefer Tailwind `data-*` classes** for styling changes. Base components expose state via data attributes (e.g., `data-dragging="true"`). Only use render props when the actual rendering behavior changes (showing different components).

```tsx
{
  /* ✅ PREFERRED - data-* classes for styling */
}
<MessageInputBase.Content
  className={cn(
    "rounded-xl border border-border",
    "data-[dragging=true]:border-dashed data-[dragging=true]:border-emerald-400",
  )}
>
  {/* Drop overlay styled with CSS, hidden by default */}
  <div className="hidden data-[dragging=true]:flex absolute inset-0 bg-emerald-50/90">
    <p>Drop files here</p>
  </div>

  {/* Render props ONLY for actual rendering behavior changes */}
  <MessageInputBase.Elicitation>
    {({ elicitation, resolveElicitation }) =>
      elicitation ? (
        <ElicitationUI request={elicitation} onResponse={resolveElicitation} />
      ) : (
        <>{children}</>
      )
    }
  </MessageInputBase.Elicitation>
</MessageInputBase.Content>;

{
  /* ❌ AVOID - render props just for styling */
}
<MessageInputBase.Content>
  {({ isDragging }) => (
    <div className={cn("rounded-xl", isDragging && "border-emerald-400")}>
      {/* Don't use render props when data-* classes would work */}
    </div>
  )}
</MessageInputBase.Content>;
```

### Step 5: Wrap Sub-Components

Wrap base sub-components with styling:

```tsx
// Submit button wrapping base
const SubmitButton = ({ className, children }) => (
  <BaseComponent.SubmitButton className={cn("w-10 h-10 rounded-lg", className)}>
    {({ showCancelButton }) =>
      children ?? (showCancelButton ? <Square /> : <ArrowUp />)
    }
  </BaseComponent.SubmitButton>
);

// Error wrapping base
const Error = ({ className }) => (
  <BaseComponent.Error className={cn("text-sm text-destructive", className)} />
);

// Staged images - base pre-computes props for each image
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

## Consuming Collection Render Props

Base components expose collections as **pre-computed props arrays** (see `compound-components` skill). Simply iterate and spread:

```tsx
// Base provides pre-computed array - just iterate
<BaseComponent.Items>
  {({ items }) =>
    items.map((itemProps) => (
      <ItemBadge key={itemProps.item.id} {...itemProps} />
    ))
  }
</BaseComponent.Items>
```

Each item in the array has all props pre-bound (callbacks, computed state). No index management needed.

## What Belongs in Styled Layer

### Icon Factories for Base Hooks

When base components include data-fetching hooks that need icons, pass a factory function from styled layer:

```tsx
// ✅ Base hook accepts optional icon factory
// packages/base/use-combined-lists.tsx
export function useCombinedResourceList(
  providers: ResourceProvider[] | undefined,
  search: string,
  createMcpIcon?: (serverName: string) => React.ReactNode,
) {
  // ... data fetching logic
  return items.map((item) => ({
    ...item,
    icon:
      item.isMcp && createMcpIcon ? createMcpIcon(item.serverName) : item.icon,
  }));
}

// ✅ Styled layer provides the icon factory
// packages/styled/message-input.tsx
const resources = useCombinedResourceList(providers, search, (serverName) => (
  <McpServerIcon name={serverName} className="w-4 h-4" />
));
```

This keeps styling in the styled layer while logic lives in base.

### Custom Data Fetching

Data fetching that combines multiple sources or uses external providers can live in base as implementation details, with the styled layer providing any visual elements (like icons) via factory functions.

### Styled Sub-Components

Visual components that render state from base:

```tsx
// ✅ Styled layer - visual presentation
const ImageContextBadge = ({
  image,
  displayName,
  isExpanded,
  onToggle,
  onRemove,
}) => (
  <div className="relative group">
    <button
      onClick={onToggle}
      className={cn("rounded-lg", isExpanded && "w-40")}
    >
      {isExpanded && <img src={image.dataUrl} alt={displayName} />}
    </button>
    <button onClick={onRemove}>
      <X className="w-3 h-3" />
    </button>
  </div>
);
```

### Layout Logic

Custom layout that's specific to the styled version:

```tsx
// ✅ Styled layer - toolbar layout splits children
const Toolbar = ({ children }) => (
  <BaseComponent.Toolbar className="flex justify-between">
    <div className="flex gap-2">
      {/* Left side - everything except submit */}
      {React.Children.map(children, (child) =>
        child.type !== SubmitButton ? child : null,
      )}
    </div>
    <div className="flex gap-2">
      <DictationButton />
      {/* Right side - only submit */}
      {React.Children.map(children, (child) =>
        child.type === SubmitButton ? child : null,
      )}
    </div>
  </BaseComponent.Toolbar>
);
```

### CSS Variants

Style variants using class-variance-authority or similar:

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

## Accessing State in Styled Components

State access follows a hierarchy:

1. **Data attributes** (preferred for styling) - Base components expose `data-*` attributes
2. **Render props** (for behavior changes) - Use when rendering different components
3. **Context hooks** (for sub-components) - OK for styled sub-components needing deep context access

```tsx
// ✅ BEST - data-* classes for styling, render props only for behavior
// Note: `data-[dragging]:*` and `data-dragging:*` are equivalent in Tailwind v4
// but only the former works in v3. For this reason, we use the v3 syntax here
// for broader compatibility.
const StyledContent = ({ children }) => (
  <BaseComponent.Content
    className={cn(
      "group rounded-xl border",
      "data-[dragging]:border-dashed data-[dragging]:border-emerald-400",
    )}
  >
    {/* Render props ONLY for behavior changes */}
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

// ✅ OK - styled sub-components can use exported context hook
// when they need more context than render props provide
const StyledTextarea = ({ placeholder }) => {
  // Hook usage OK here - this sub-component needs deep context access
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

// ❌ WRONG - render props just for styling
<BaseComponent.Content>
  {({ isDragging }) => (
    <div className={cn("rounded-xl", isDragging && "border-dashed")} />
  )}
</BaseComponent.Content>;
```

**When to use context hooks vs render props:**

- Use render props when the parent wrapper needs state for behavior changes
- Use context hooks when a styled sub-component needs context values not exposed via render props

## Type Handling

Handle ref type differences between base and styled components:

```tsx
// Base context may have RefObject<T | null>
// Styled component may need RefObject<T>
<TextEditor
  ref={editorRef as React.RefObject<TamboEditor>}
  // ...
/>
```

## Checklist

When refactoring to use base components:

- [ ] Remove duplicate context creation
- [ ] Remove duplicate SDK hooks from root wrappers
- [ ] Remove duplicate state management
- [ ] Remove duplicate event handlers (drag, submit, etc.)
- [ ] Import base namespace and use `Base.Root` as wrapper
- [ ] Use `data-*` classes for styling based on state (with `group-data-*` for children)
- [ ] Use render props only for rendering behavior changes
- [ ] Wrap base sub-components with styling
- [ ] Base hooks can provide data fetching; styled layer provides icon factories
- [ ] Keep visual sub-components in styled layer
- [ ] Keep CSS variants in styled layer
- [ ] Sub-components can use exported context hook when render props aren't sufficient

## Anti-Patterns

- **Re-implementing base logic** - If base handles it, compose it
- **Using render props for styling** - Prefer `data-*` classes; render props are for behavior changes
- **Duplicating context in wrapper** - Use base Root which provides context
- **Hardcoding icons in base hooks** - Use factory functions to keep styling in styled layer
