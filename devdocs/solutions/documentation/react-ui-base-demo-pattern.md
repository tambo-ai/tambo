---
title: "Demoing Components and DemoPreview Pattern for Documentation"
category: "documentation"
tags:
  - react-ui-base
  - fumadocs
  - interactive-examples
  - documentation
  - demo-components
  - live-preview
severity: medium
component: docs, react-ui-base
problem_type: best_practice
date_documented: 2026-03-02
date_updated: 2026-03-02
---

# Demoing Components and DemoPreview Pattern for Documentation

## Overview

Phase 6 of the Tambo documentation established a reusable pattern for creating interactive component demos in Fumadocs documentation. This pattern is used throughout the `react-ui-base` component reference to showcase component behavior with controllable state.

## The Pattern Architecture

### Three-Layer Structure

The demo system consists of three layers that work together:

1. **DemoProvider** (`demo-provider.tsx`) - Shared state management
2. **useDemoControls** (in `demo-controls.tsx`) - Hook for registering controls and reading their values
3. **DemoPreview** (`demo-preview.tsx`) - Renderer that displays live demo, control bar, and expandable code
4. **Individual demo components** (e.g., `message-demo.tsx`) - Component-specific demo logic

### DemoProvider: Shared Context

The `DemoProvider` manages:

- **Expanded state**: Whether the code panel is open or collapsed
- **Control schema**: Definition of all controls (selects, booleans)
- **Control values**: Current state of all controls

```tsx
// Wraps demo content
<DemoProvider>
  <DemoPreview code={code}>{children}</DemoPreview>
</DemoProvider>
```

Key exports:

- `useDemoContext()` - Access provider state (for DemoPreview internal use)
- `DemoProvider` - Context provider

### useDemoControls: Define Interactive Controls

This hook declares what controls appear in the demo and returns their current values:

```tsx
const { images, component, loading } = useDemoControls({
  images: { default: true, label: "Images" },
  component: { default: true, label: "Component" },
  loading: { default: false, label: "Loading" },
});
```

**Usage pattern:**

1. Define controls with `{ default, label }` for booleans or `{ options, default, label }` for selects
2. Destructure the returned values
3. Use returned values in demo component logic (useMemo, conditionals, etc.)
4. Control bar renders automatically in DemoPreview

**Control types:**

```tsx
// Boolean toggle
{ default: true, label: "Show images" }

// Select dropdown
{ options: ["small", "medium", "large"], default: "medium", label: "Size" }
```

### DemoPreview: Container and Code Renderer

DemoPreview renders:

1. **Control bar** (only if `useDemoControls` was called)
2. **Live demo area** - Your component
3. **Collapsible code panel** - Syntax highlighted via Fumadocs' `DynamicCodeBlock`
4. **Toggle button** - "Show more" / "Hide code"

**Props:**

```tsx
<DemoPreview
  code={string | CodeFile | CodeFile[]}
  language="tsx" // default
>
  {children} // Your demo component
</DemoPreview>
```

**Code prop formats:**

```tsx
// Single string
<DemoPreview code="const x = 1;">

// Single file object
<DemoPreview code={{ name: "demo.tsx", code: "..." }}>

// Multiple files with tabs
<DemoPreview code={[
  { name: "demo.tsx", code: "..." },
  { name: "utils.ts", code: "..." },
]}>
```

**Behavior:**

- Code panel starts collapsed at `13rem` height with gradient fade
- "Show more" toggles expanded state (stretches to full height)
- When expanded, toggle button becomes sticky at viewport bottom
- Multi-file previews show tabs for switching between files

## Real-World Example: MessageDemo

Located at: `/docs/content/docs/reference/react-ui-base/_demos/message-demo.tsx`

```tsx
"use client";

import { useDemoControls } from "@/components/demos/demo-controls";
import { DemoPreview } from "@/components/demos/demo-preview";
import { Message } from "@tambo-ai/react-ui-base/message";
import { useMemo } from "react";

export function MessageDemoPreview() {
  return (
    <DemoPreview code={messageDemoCode}>
      <MessageDemo />
    </DemoPreview>
  );
}

function MessageDemo() {
  // Step 1: Declare controls
  const { images, component, loading } = useDemoControls({
    images: { default: true, label: "Images" },
    component: { default: true, label: "Component" },
    loading: { default: false, label: "Loading" },
  });

  // Step 2: Use controlled values in memoized data
  const userMessage = useMemo(
    () => ({
      id: "demo-msg-user",
      role: "user" as const,
      content: [
        { type: "text", text: "What's the weather?" },
        ...(images
          ? [{ type: "image_url", image_url: { url: IMAGE_URL } }]
          : []),
      ],
    }),
    [images],
  );

  // Step 3: Render component with controlled state
  return (
    <div className="space-y-4">
      <Message.Root message={userMessage} role="user">
        <Message.Content />
        {images && <Message.Images />}
      </Message.Root>
      {/* more content */}
    </div>
  );
}

// Step 4: Define code shown in panel
const messageDemoCode = `
import { Message } from "@tambo-ai/react-ui-base/message";

function MessageDemo() {
  return (
    <Message.Root message={message} role="user">
      <Message.Content />
      <Message.Images />
    </Message.Root>
  );
}
`;
```

## MDX Integration

In your MDX file:

```mdx
import { MessageDemoPreview } from "./_demos/message-demo";

# Message Component

<MessageDemoPreview />
```

Then just reference the exported `*DemoPreview` function. It:

- Renders the live demo
- Shows control bar
- Displays code panel
- Handles expansion/collapse

## File Organization

```
docs/content/docs/reference/react-ui-base/
├── _demos/
│   ├── message-demo.tsx
│   ├── message-input-demo.tsx
│   ├── elicitation-demo.tsx
│   ├── toolcall-info-demo.tsx
│   └── ... (other demos)
├── message.mdx
├── message-input.mdx
├── elicitation.mdx
└── ... (other docs)

docs/src/components/demos/
├── demo-provider.tsx      # Context & state management
├── demo-controls.tsx      # useDemoControls hook
├── demo-preview.tsx       # Main container & renderer
└── demo-controls.tsx      # Control bar UI rendering
```

## Key Implementation Details

### Control Bar Rendering

The control bar automatically renders only when `useDemoControls` is called in a child component:

```tsx
// Inside DemoPreviewInner
<DemoControlBar /> // Only renders if controls registered via useDemoControls
```

The `DemoControlBar` component reads from context and renders all registered controls as toggles (boolean) or dropdowns (select).

### Code Panel Styling

The collapsed code panel uses Tailwind classes to achieve the fade effect:

```tsx
{
  /* Gradient fade overlay when collapsed */
}
{
  !expanded && (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-fd-card to-transparent" />
  );
}
```

### Multi-File Code Display

When multiple code files are provided:

1. Tabs appear at top of code panel
2. Each tab is a button controlling `activeTab` state
3. Only the active file's code is displayed
4. File language is auto-detected from filename or specified in `CodeFile.language`

## Common Patterns

### Toggle-Based Rendering

```tsx
const { showImages } = useDemoControls({
  showImages: { default: false, label: "Show images" },
});

return (
  <Message.Root message={message} role="user">
    <Message.Content />
    {showImages && <Message.Images />}
  </Message.Root>
);
```

### Variant Selection

```tsx
const { size, variant } = useDemoControls({
  size: { options: ["sm", "md", "lg"], default: "md", label: "Size" },
  variant: {
    options: ["default", "outline", "ghost"],
    default: "default",
    label: "Variant",
  },
});

return (
  <Button size={size} variant={variant}>
    Click me
  </Button>
);
```

### Data Mutation Based on Controls

```tsx
const { loading } = useDemoControls({
  loading: { default: false, label: "Loading state" },
});

const message = useMemo(
  () => ({
    id: "msg-1",
    role: "assistant",
    content: loading
      ? [{ type: "text", text: "Thinking..." }]
      : [{ type: "text", text: "Here's the answer..." }],
  }),
  [loading],
);
```

## Common Gotchas

### 1. useDemoControls Must Be Called in Child of DemoPreview

**Wrong:**

```tsx
function MessageDemo() {
  const { images } = useDemoControls({ images: { default: true } });
  return <DemoPreview code="...">{/* ... */}</DemoPreview>;
}
// Context is accessed before DemoProvider exists
```

**Correct:**

```tsx
export function MessageDemoPreview() {
  return (
    <DemoPreview code="...">
      <MessageDemo />
    </DemoPreview>
  );
}

function MessageDemo() {
  const { images } = useDemoControls({ images: { default: true } });
  // Now context exists
  return <div>{/* ... */}</div>;
}
```

### 2. Use useMemo for Controlled Data

Always memoize data that depends on control values to avoid unnecessary re-renders:

```tsx
const message = useMemo(
  () => ({
    // ... message with conditional content based on controls
  }),
  [images, component, loading],
);
```

### 3. Code Panel Gets Syntax Highlighting Automatically

The `DynamicCodeBlock` component from Fumadocs handles all highlighting. Just provide the code string:

```tsx
const code = `
import { Message } from "@tambo-ai/react-ui-base/message";

export function Demo() {
  // ...
}
`;

<DemoPreview code={code}>{/* ... */}</DemoPreview>;
// Automatically syntax-highlighted as TSX
```

### 4. Control Labels Are Optional

```tsx
// With labels (recommended)
useDemoControls({
  images: { default: true, label: "Show Images" },
});

// Without labels (control key used as display)
useDemoControls({
  images: { default: true },
});
```

## Extension Points

### Custom Control Types

Currently supports `boolean` (toggle) and `select` (dropdown). To add new control types:

1. Update `ControlDef` union in `demo-provider.tsx`
2. Add corresponding UI in `DemoControlBar` (in `demo-controls.tsx`)
3. Update `ControlInput` and `ControlValue` types in `useDemoControls`

## See Also

- Commit: `40fc632df` - Phase 6 Demoing Components implementation
- Files created: 10+ demo files across `react-ui-base` components
- Related docs: `/docs/content/docs/reference/react-ui-base/*.mdx`

## Best Practices Checklist

- [ ] Demo component is a child of DemoPreview (not parent)
- [ ] useDemoControls called in leaf component (not parent)
- [ ] Controlled data memoized with dependencies
- [ ] Code string shows complete, runnable example
- [ ] Multi-file code organized as arrays with `name` field
- [ ] Component imports are shown in code panel
- [ ] Default control values are sensible (show normal state)
- [ ] Labels are clear and user-focused
