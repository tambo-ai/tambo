---
title: Refactor Demo Page to Use Base Primitives
type: refactor
date: 2026-01-29
deepened: 2026-01-29
---

# Refactor Demo Page to Use Base Primitives

## Enhancement Summary

**Deepened on:** 2026-01-29
**Sections enhanced:** 6
**Research agents used:** best-practices-researcher, framework-docs-researcher, kieran-typescript-reviewer, code-simplicity-reviewer, architecture-strategist, pattern-recognition-specialist, agent-native-reviewer, frontend-design skill, Context7 (Radix Primitives)

### Key Improvements

1. Added TypeScript type definitions for all components
2. Fixed `<p>` tag issue for markdown content (use `<div>` instead)
3. Added visual design specifications for three distinct styles
4. Added data attributes documentation for CSS-based styling
5. Included accessibility considerations

### New Considerations Discovered

- Component props need explicit TypeScript interfaces
- Markdown content should not be wrapped in `<p>` tags (invalid HTML nesting)
- Consider extracting each style to separate files if page exceeds 300 lines

---

## Overview

Update the existing message-library-comparison showcase page to demonstrate how Tambo's **base primitives** can be used to build components in different library styles (AI Elements, Assistant UI). The current demo shows separate library implementations - the refactored demo will show the base primitives powering all three styles.

## Problem Statement / Motivation

The current showcase page imports from:

- `@tambo-ai/ui-registry/components/message` (styled components)
- Custom AI Elements implementations in `showcase/src/components/ai-elements/`
- `@assistant-ui/react` (external library)

This doesn't demonstrate the **interoperability** of Tambo's base primitives. The goal is to show that developers can use `@tambo-ai/ui-registry/base/*` primitives to build components that look like AI Elements or Assistant UI.

## Proposed Solution

Refactor the showcase page to:

1. Import base primitives from `@tambo-ai/ui-registry/base/message` and `@tambo-ai/ui-registry/base/reasoning-info`
2. Create "AI Elements Style" components using base primitives with AI Elements styling
3. Create "Assistant UI Style" components using base primitives with Assistant UI styling
4. Show how the same primitives can be styled differently while maintaining Tambo compatibility

## Technical Approach

### Current Imports (to change)

```tsx
// Current - uses styled components and external libraries
import {
  Message,
  MessageContent,
  ReasoningInfo,
} from "@tambo-ai/ui-registry/components/message";
import { Message as AIElementsMessage } from "@/components/ai-elements/message";
import {
  useExternalStoreRuntime,
  AssistantRuntimeProvider,
} from "@assistant-ui/react";
```

### New Imports

```tsx
// New - uses base primitives for all implementations
import { Message } from "@tambo-ai/ui-registry/base/message";
import { ReasoningInfo } from "@tambo-ai/ui-registry/base/reasoning-info";
import { cn } from "@/lib/utils";
```

### Research Insights: Compound Component Patterns

**Best Practices (from Radix UI, Headless UI, Base UI):**

- Namespace components as static properties on parent (`Message.Root`, `Message.Content`)
- Context-based state sharing with memoized values
- Support both `children` and `render` prop patterns
- Use `asChild` pattern (via `@radix-ui/react-slot`) for DOM composition
- Expose state via data attributes for CSS-only styling

**Data Attributes for Styling:**

```tsx
// The base primitives expose these attributes:
<Message.Root
  data-message-role="user" | "assistant"
  data-message-id={message.id}
  data-slot="message-root"
/>

// CSS targeting:
[data-message-role="user"] { justify-content: flex-end; }
[data-message-role="assistant"] { justify-content: flex-start; }
```

### Component Structure

#### TypeScript Interfaces (Required)

```tsx
import type { TamboThreadMessage } from "@tambo-ai/react";

interface StyleMessageProps {
  message: TamboThreadMessage;
  isLoading?: boolean;
}
```

#### 1. Tambo Default Style - "Editorial Clarity"

**Visual Direction:** Refined minimalism with typographic focus. No bubbles - let typography and whitespace do the work.

```tsx
function TamboStyleMessage({ message, isLoading }: StyleMessageProps) {
  return (
    <Message.Root
      role={message.role}
      message={message}
      isLoading={isLoading}
      className={cn(
        "max-w-prose",
        message.role === "assistant" && "border-l-2 border-accent pl-4",
        message.role === "user" && "ml-auto text-right",
      )}
    >
      <Message.Content>
        {({ markdownContent }) => (
          <div className="prose prose-lg leading-relaxed">
            {markdownContent}
          </div>
        )}
      </Message.Content>
    </Message.Root>
  );
}
```

#### 2. AI Elements Style - "Geometric Conversation"

**Visual Direction:** Flex layout with rounded bubbles and role-based positioning. Modern SaaS chat aesthetic.

```tsx
function AIElementsStyleMessage({ message, isLoading }: StyleMessageProps) {
  return (
    <Message.Root
      role={message.role}
      message={message}
      isLoading={isLoading}
      className={cn(
        "group flex",
        message.role === "user" ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
          message.role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted",
        )}
      >
        <Message.Content>
          {({ markdownContent }) => <div>{markdownContent}</div>}
        </Message.Content>
      </div>
    </Message.Root>
  );
}
```

#### 3. Assistant UI Style - "Contained Dialogue"

**Visual Direction:** Card-like containers with borders. More structured, app-like feel.

```tsx
function AssistantUIStyleMessage({ message, isLoading }: StyleMessageProps) {
  return (
    <Message.Root
      role={message.role}
      message={message}
      isLoading={isLoading}
      className={cn(
        "flex mb-3",
        message.role === "user" ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[70%] rounded-lg px-4 py-2 border border-border",
          message.role === "user"
            ? "bg-card border-primary/20"
            : "bg-card shadow-sm",
        )}
      >
        <Message.Content>
          {({ markdownContent }) => (
            <div className="prose prose-sm max-w-none">{markdownContent}</div>
          )}
        </Message.Content>
      </div>
    </Message.Root>
  );
}
```

### Research Insights: Code Quality

**Critical Fix - Don't use `<p>` for markdown content:**

```tsx
// BAD: <p> cannot contain block elements (headings, lists, code blocks)
{
  ({ markdownContent }) => <p>{markdownContent}</p>;
}

// GOOD: Use a generic container
{
  ({ markdownContent }) => <div>{markdownContent}</div>;
}
```

**TypeScript Type Safety:**

- Always add explicit prop interfaces
- The render prop receives `MessageContentRenderProps` with: `content`, `markdownContent`, `markdown`, `isLoading`, `isCancelled`, `isReasoning`

### Visual Style Comparison

| Aspect         | Tambo Default    | AI Elements     | Assistant UI     |
| -------------- | ---------------- | --------------- | ---------------- |
| **Metaphor**   | Document/Article | Chat App        | Structured Cards |
| **Container**  | Borderless       | Rounded bubbles | Bordered cards   |
| **Layout**     | Document flow    | Flex opposing   | Flex contained   |
| **Spacing**    | Generous         | Moderate        | Compact          |
| **Typography** | `prose-lg`       | `text-sm`       | `prose-sm`       |
| **Max Width**  | `max-w-prose`    | `80%`           | `70%`            |

### Files to Modify

1. `showcase/src/app/components/(message-primitives)/message-library-comparison/page.tsx`
   - Replace styled component imports with base primitive imports
   - Refactor implementations to use base primitives with different styling
   - Update code snippets to show base primitive usage
   - Update section descriptions to clarify this is about base primitives

2. `showcase/src/components/ai-elements/` (DELETE)
   - Remove custom AI Elements implementations since base primitives handle this

### Files to Keep

- `showcase/src/app/components/(message-primitives)/__fixtures__/mock-messages.ts` - Keep as-is

## Acceptance Criteria

- [x] Page imports base primitives from `@tambo-ai/ui-registry/base/message` and `@tambo-ai/ui-registry/base/reasoning-info`
- [x] Tambo section uses base primitives with default/minimal styling
- [x] AI Elements section uses base primitives styled like AI Elements
- [x] Assistant UI section uses base primitives styled like Assistant UI (no runtime provider needed)
- [x] Code snippets show base primitive usage for each style
- [x] API comparison table updated to show base primitive API
- [x] Key observations updated to focus on base primitive interoperability
- [x] Custom AI Elements components removed (no longer needed)
- [x] `npm run check-types -w showcase` passes
- [x] `npm run lint -w showcase` passes
- [x] `npm run build -w showcase` succeeds
- [x] PR #2026 updated with new changes

## Implementation Phases

### Phase 1: Update Imports

1. Change imports from styled components to base primitives
2. Verify base primitive exports work: `@tambo-ai/ui-registry/base/message`
3. Add TypeScript interface for `StyleMessageProps`

### Phase 2: Refactor Components

1. Create TamboStyleMessage using base primitives with editorial styling
2. Create AIElementsStyleMessage using base primitives with bubble styling
3. Create AssistantUIStyleMessage using base primitives with card styling
4. Create reasoning components for each style (same pattern)
5. Ensure all render props use `<div>` not `<p>` for markdown

### Phase 3: Update Page Content

1. Update section headers and descriptions
2. Update code snippets to show base primitive usage with TypeScript
3. Update API comparison table
4. Update key observations to emphasize:
   - Same primitives, different styles
   - No external runtime dependencies
   - CSS-only customization via data attributes

### Phase 4: Cleanup

1. Delete `showcase/src/components/ai-elements/` directory
2. Run quality checks
3. Update PR

## References

### Base Primitive Components

- `packages/ui-registry/src/base/message/index.tsx` - Message namespace
- `packages/ui-registry/src/base/reasoning-info/index.tsx` - ReasoningInfo namespace
- `packages/ui-registry/src/base/message/root/message-root.tsx` - MessageRoot API
- `packages/ui-registry/src/base/message/content/message-content.tsx` - MessageContent API

### Package Exports

- `packages/ui-registry/package.json` line 8: `"./base/*": "./src/base/*/index.ts"`

### External References

- [Radix UI Composition Guide](https://www.radix-ui.com/primitives/docs/guides/composition)
- [Headless UI Documentation](https://headlessui.com/)
- [Kent C. Dodds - Compound Components](https://kentcdodds.com/blog/compound-components-with-react-hooks)
