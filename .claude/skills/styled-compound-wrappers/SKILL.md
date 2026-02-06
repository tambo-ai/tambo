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

// ✅ CORRECT - compose the base component, use data attributes for styling
const StyledInput = ({ children, className, variant }) => {
  return (
    <BaseInput.Root className={cn(inputVariants({ variant }), className)}>
      <BaseInput.Content
        className={cn("rounded-xl", "data-[dragging]:border-dashed")}
      >
        {children}
      </BaseInput.Content>
    </BaseInput.Root>
  );
};
```

## State Access Hierarchy

Styled wrappers should access base component state in this order of preference:

### 1. Use context-aware sub-components directly (BEST)

Base components provide sub-components that read from context automatically. Just render them with styling.

```tsx
// ✅ BEST - sub-components read context internally, just add styling
const StyledSuggestions = ({ className }) => (
  <SuggestionsBase.Root className={cn("px-4 pb-2", className)}>
    <SuggestionsBase.Status className="text-sm text-muted-foreground" />
    <SuggestionsBase.List className="flex gap-2 overflow-x-auto" />
  </SuggestionsBase.Root>
);
```

### 2. Data attributes for CSS styling (PREFERRED for conditional styles)

Base components expose state via `data-*` attributes. Use Tailwind's `data-[attr]` selectors.

```tsx
// ✅ PREFERRED - data-* classes for styling based on state
<BaseComponent.Content
  className={cn(
    "group rounded-xl border border-border",
    "data-[dragging]:border-dashed data-[dragging]:border-emerald-400",
    "data-[idle]:p-0 data-[idle]:min-h-0",
  )}
>
  {/* Child elements can use group-data-* to react to parent state */}
  <div className="hidden group-data-[dragging]:flex absolute inset-0 bg-emerald-50/90">
    <p>Drop files here</p>
  </div>
  {children}
</BaseComponent.Content>
```

### 3. Children as render function (ONLY when rendering differs)

Use children-as-function **only** when you need to conditionally render entirely different component trees based on state. Not for styling.

```tsx
// ✅ OK - different component trees based on state
<BaseComponent.Content
  className="group rounded-xl border data-[dragging]:border-dashed"
>
  {({ elicitation, resolveElicitation }) => (
    <>
      <div className="hidden group-data-[dragging]:flex absolute inset-0 bg-emerald-50/90">
        <p>Drop files here</p>
      </div>
      {elicitation ? (
        <ElicitationUI request={elicitation} onResponse={resolveElicitation} />
      ) : (
        children
      )}
    </>
  )}
</BaseComponent.Content>

// ❌ WRONG - children function just for styling (use data-* instead)
<BaseComponent.Content>
  {({ isDragging }) => (
    <div className={cn("rounded-xl", isDragging && "border-dashed")} />
  )}
</BaseComponent.Content>
```

### 4. Context hooks (for deep access in sub-components)

Styled sub-components that need context values not available via render props can import the context hook directly from the base source file.

```tsx
// ✅ OK - styled sub-component needs deep context access
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

## NEVER Use the `render` Prop

The `render` prop is **deprecated**. Always use children — either as static ReactNode or as a function.

```tsx
// ❌ NEVER - render prop is deprecated
<BaseComponent.Status
  render={({ error, isGenerating }) => (
    <div>{error ? error.message : "Loading..."}</div>
  )}
/>

// ✅ CORRECT - children as function
<BaseComponent.Status>
  {({ error, isGenerating }) => (
    <div>{error ? error.message : "Loading..."}</div>
  )}
</BaseComponent.Status>

// ✅ EVEN BETTER - static children with data attributes when possible
<BaseComponent.Status
  className="data-[error]:bg-red-50 data-[generating]:animate-pulse"
>
  <BaseComponent.GenerationStage className="text-xs text-muted-foreground" />
</BaseComponent.Status>
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
import { MessageInput as MessageInputBase } from "@tambo-ai/react-ui-base/message-input";
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

### Step 4: Prefer Sub-Components Over Render Functions

When the base provides sub-components that handle display, use them directly with styling instead of using children-as-function to reconstruct the same thing manually.

```tsx
// ❌ AVOID - manually reconstructing what sub-components already do
<SuggestionsBase.List>
  {({ suggestions, isGenerating }) => (
    <>
      {suggestions.map((s) => (
        <button key={s.id} className="rounded-2xl px-2.5 py-2">
          {s.title}
        </button>
      ))}
    </>
  )}
</SuggestionsBase.List>

// ✅ PREFER - use base Item sub-component, just add styling
<SuggestionsBase.List className="flex gap-2 data-[generating]:opacity-70">
  {({ suggestions }) =>
    suggestions.map((suggestion, index) => (
      <SuggestionsBase.Item
        key={suggestion.id}
        suggestion={suggestion}
        index={index}
        className="rounded-2xl px-2.5 py-2 border text-xs"
      >
        <span className="font-medium">{suggestion.title}</span>
      </SuggestionsBase.Item>
    ))
  }
</SuggestionsBase.List>
```

### Step 5: Wrap Sub-Components with Styling

```tsx
// Submit button wrapping base - children as function for icon swap
const SubmitButton = ({ className, children }) => (
  <BaseComponent.SubmitButton className={cn("w-10 h-10 rounded-lg", className)}>
    {({ showCancelButton }) =>
      children ?? (showCancelButton ? <Square /> : <ArrowUp />)
    }
  </BaseComponent.SubmitButton>
);

// Error wrapping base - static children, styling only
const Error = ({ className }) => (
  <BaseComponent.Error className={cn("text-sm text-destructive", className)} />
);

// Staged images - children as function to iterate pre-computed array
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
const resources = useCombinedResourceList(providers, search, (serverName) => (
  <McpServerIcon name={serverName} className="w-4 h-4" />
));
```

### Styled Sub-Components

Visual components that render state from base:

```tsx
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
const Toolbar = ({ children }) => (
  <BaseComponent.Toolbar className="flex justify-between">
    <div className="flex gap-2">
      {React.Children.map(children, (child) =>
        child.type !== SubmitButton ? child : null,
      )}
    </div>
    <div className="flex gap-2">
      <DictationButton />
      {React.Children.map(children, (child) =>
        child.type === SubmitButton ? child : null,
      )}
    </div>
  </BaseComponent.Toolbar>
);
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

## Type Handling

Handle ref type differences between base and styled components:

```tsx
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
- [ ] **Never use `render` prop** — use children (static or function)
- [ ] Prefer using base sub-components directly with className over children-as-function
- [ ] Use `data-*` classes for styling based on state (with `group-data-*` for children)
- [ ] Use children-as-function only when rendering entirely different component trees
- [ ] Wrap base sub-components with styling
- [ ] Base hooks can provide data fetching; styled layer provides icon factories
- [ ] Keep visual sub-components in styled layer
- [ ] Keep CSS variants in styled layer
- [ ] Sub-components can use exported context hook when render props aren't sufficient

## Anti-Patterns

- **Using `render` prop** — It's deprecated. Use children as a function instead
- **Using children-as-function just for styling** — Use `data-*` classes instead
- **Manually reconstructing what sub-components do** — Use the base sub-components with className
- **Re-implementing base logic** — If base handles it, compose it
- **Duplicating context in wrapper** — Use base Root which provides context
- **Hardcoding icons in base hooks** — Use factory functions to keep styling in styled layer
