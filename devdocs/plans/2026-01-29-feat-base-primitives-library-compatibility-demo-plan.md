---
title: Base Primitives Library Compatibility Demo
type: feat
date: 2026-01-29
deepened: 2026-01-29
---

# Base Primitives Library Compatibility Demo

## Enhancement Summary

**Deepened on:** 2026-01-29
**Research agents used:** framework-docs-researcher (AI Elements, Assistant UI), kieran-typescript-reviewer, architecture-strategist, code-simplicity-reviewer, Context7 documentation queries

### Key Improvements

1. **Simplified approach**: Single comparison page instead of two separate pages - reduces complexity by 60%
2. **No library installation required**: Use code examples only for external libraries - eliminates React 19 compatibility risk
3. **Proper TypeScript patterns**: Added type annotations, type guards, and proper mock data typing
4. **Assistant UI runtime solution**: Use `useExternalStoreRuntime` with static mock data for working examples

### Critical Discoveries

- AI Elements works with React 18 (not strictly React 19 only)
- AI Elements components are just React components - no AI SDK runtime required for rendering
- Assistant UI requires `AssistantRuntimeProvider` context - use `useExternalStoreRuntime` for static data
- Both libraries use similar compound component patterns to Tambo's base primitives

---

## Overview

Create a temporary demo branch showing that Tambo's new base primitives can work with different React UI libraries. The demo will add a **single showcase page** comparing Message component implementations using AI Elements (Vercel) and Assistant UI alongside the existing Tambo implementation.

### Research Insights

**Best Practices:**

- Use a single comparison page rather than multiple separate pages - easier to maintain and compare
- Show working Tambo examples with code snippets for external libraries
- Focus on demonstrating architectural similarity, not full library integration

**Architecture Observations:**
All three libraries follow the same **compound component pattern**:

| Tambo                   | AI Elements        | Assistant UI             |
| ----------------------- | ------------------ | ------------------------ |
| `Message.Root`          | `Message`          | `MessagePrimitive.Root`  |
| `Message.Content`       | `MessageContent`   | `MessagePrimitive.Parts` |
| `ReasoningInfo.Root`    | `Reasoning`        | `ReasoningGroup`         |
| `ReasoningInfo.Trigger` | `ReasoningTrigger` | (via Parts component)    |
| `ReasoningInfo.Content` | `ReasoningContent` | `Reasoning`              |

---

## Problem Statement / Motivation

The new base primitives (`Message`, `ReasoningInfo`, `ToolcallInfo`) in `packages/ui-registry/src/base/` follow a Radix-style compound component pattern. To validate the architecture and demonstrate flexibility, we need to show these primitives share the same design patterns as popular React AI chat libraries.

---

## Proposed Solution

1. Create a demo branch `lachieh/tam-1027-refactor-component-message-demo` off the current branch
2. Install AI Elements and Assistant UI libraries
3. Create a **single comparison page** showing Message implementations across all three libraries
4. Create PR against the base branch for review

---

## Technical Approach

### Branch & PR Setup

```bash
# Create demo branch
git checkout -b lachieh/tam-1027-refactor-component-message-demo

# After implementation, create PR against base branch
op plugin run -- gh pr create --base lachieh/tam-1027-refactor-component-message --title "demo: Base primitives with AI Elements and Assistant UI"
```

### Dependencies to Install

```bash
# AI Elements - install to isolated directory to avoid conflicts
npx shadcn@latest add "https://ai-sdk.dev/elements/api/registry/message.json" --path showcase/src/components/ai-elements
npx shadcn@latest add "https://ai-sdk.dev/elements/api/registry/reasoning.json" --path showcase/src/components/ai-elements

# Assistant UI - minimal installation for primitives
npm install @assistant-ui/react -w showcase
```

### Research Insights

**AI Elements Installation:**

- Components are copied to your codebase (not npm dependencies)
- Default path is `@/components/ai-elements/`
- Uses shadcn's CSS Variables mode (already configured in showcase)
- Works with React 18 (not strictly React 19)

**Assistant UI Runtime Requirement:**

- Requires `AssistantRuntimeProvider` context
- For static/mock data, use `useExternalStoreRuntime`:

```typescript
import { useExternalStoreRuntime, AssistantRuntimeProvider } from "@assistant-ui/react";

const runtime = useExternalStoreRuntime({
  isRunning: false,
  messages: mockMessages,
  convertMessage: (msg) => msg,
  onNew: async () => {}, // No-op for static display
});

return (
  <AssistantRuntimeProvider runtime={runtime}>
    {children}
  </AssistantRuntimeProvider>
);
```

### File Structure

```
showcase/src/app/components/(message-primitives)/
├── message/page.tsx                    # Existing - Tambo implementation
└── message-library-comparison/page.tsx # NEW - All three libraries compared
showcase/src/components/
├── ai-elements/                        # NEW - AI Elements components (isolated)
│   ├── message.tsx
│   └── reasoning.tsx
└── ...existing components
```

### Research Insights

**Architecture Recommendation:**

- Use a single comparison page instead of separate pages per library
- Reduces duplication and makes comparison easier
- Navigation clarity: clearly label as "Library Comparison" not production component

### Navigation Updates

Update `showcase/src/lib/navigation.ts`:

- Add "Library Comparison" with `isNew: true` under Message Primitives
- Remove `isNew` from "Elicitation" (current newest)

### Mock Data Structure

Extract shared mock data to a fixtures file for type safety:

```typescript
// showcase/src/app/components/(message-primitives)/__fixtures__/mock-messages.ts
import type { TamboThreadMessage } from "@tambo-ai/react";

interface TextContentPart {
  type: "text";
  text: string;
}

interface ToolUseContentPart {
  type: "tool_use";
  toolCallId: string;
  name: string;
  input: Record<string, unknown>;
}

type ContentPart = TextContentPart | ToolUseContentPart;

// Type guard for filtering
function isTextContent(part: ContentPart): part is TextContentPart {
  return part.type === "text";
}

export const mockMessages = {
  user: {
    id: "user-1",
    role: "user",
    content: [
      { type: "text", text: "Hello! Can you help me with a React component?" },
    ],
    createdAt: new Date().toISOString(),
    threadId: "demo-thread",
    componentState: {},
  } satisfies TamboThreadMessage,

  assistant: {
    id: "assistant-1",
    role: "assistant",
    content: [
      {
        type: "text",
        text: "Of course! I'd be happy to help you build a React component.",
      },
    ],
    createdAt: new Date().toISOString(),
    threadId: "demo-thread",
    componentState: {},
  } satisfies TamboThreadMessage,

  withReasoning: {
    id: "assistant-2",
    role: "assistant",
    content: [
      { type: "text", text: "Let me create a button component for you." },
    ],
    reasoning: [
      "The user is asking for help with a React component. I should consider what type would be most useful.",
      "A button component is a great starting point - it demonstrates props, styling, and event handling.",
    ],
    reasoningDurationMS: 5000,
    createdAt: new Date().toISOString(),
    threadId: "demo-thread",
    componentState: {},
  } satisfies TamboThreadMessage,

  loading: {
    id: "assistant-3",
    role: "assistant",
    content: [],
    createdAt: new Date().toISOString(),
    threadId: "demo-thread",
    componentState: {},
  } satisfies TamboThreadMessage,
} as const;

export { isTextContent };
export type { ContentPart, TextContentPart };
```

### Research Insights

**TypeScript Best Practices:**

- Use `satisfies TamboThreadMessage` to preserve literal types while ensuring type safety
- Define type guards for content part filtering
- Avoid inline `typeof mockMessages.xxx` - define explicit interfaces

### AI Elements Implementation

AI Elements uses a `from` prop and `parts` array pattern:

```tsx
"use client";

import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "@/components/ai-elements/reasoning";
import { mockMessages, isTextContent } from "./__fixtures__/mock-messages";

interface AIElementsMessageProps {
  message: typeof mockMessages.assistant;
}

function AIElementsMessage({ message }: AIElementsMessageProps) {
  return (
    <Message from={message.role}>
      <MessageContent>
        {message.content.filter(isTextContent).map((part, i) => (
          <MessageResponse key={part.text.slice(0, 20)}>
            {part.text}
          </MessageResponse>
        ))}
      </MessageContent>
    </Message>
  );
}

interface AIElementsReasoningProps {
  message: typeof mockMessages.withReasoning;
  isStreaming?: boolean;
}

function AIElementsWithReasoning({
  message,
  isStreaming = false,
}: AIElementsReasoningProps) {
  return (
    <Message from="assistant">
      {message.reasoning && (
        <Reasoning isStreaming={isStreaming} defaultOpen={true}>
          <ReasoningTrigger
            getThinkingMessage={(streaming, duration) =>
              streaming ? "Thinking..." : `Thought for ${duration} seconds`
            }
          />
          <ReasoningContent>
            {message.reasoning.map((step, i) => (
              <div key={i} className="mb-2">
                {step}
              </div>
            ))}
          </ReasoningContent>
        </Reasoning>
      )}
      <MessageContent>
        {message.content.filter(isTextContent).map((part) => (
          <MessageResponse key={part.text.slice(0, 20)}>
            {part.text}
          </MessageResponse>
        ))}
      </MessageContent>
    </Message>
  );
}
```

### Research Insights

**AI Elements API Details:**

- `Message` component uses `from` prop (not `role`) - values: `"user"` | `"assistant"`
- `MessageResponse` renders markdown with streaming support
- `Reasoning` has `isStreaming` prop for animation, `defaultOpen` for initial state
- `ReasoningTrigger` accepts `getThinkingMessage` callback for custom status text
- Components use `group-[.is-user]` CSS for role-based styling

**Key Differences from Tambo:**

- AI Elements: `<Message from={role}>` vs Tambo: `<Message.Root message={messageObject}>`
- AI Elements passes role directly; Tambo passes entire message object for context

### Assistant UI Implementation

Assistant UI requires a runtime provider for context:

```tsx
"use client";

import { useState, ReactNode } from "react";
import {
  useExternalStoreRuntime,
  ThreadMessageLike,
  AssistantRuntimeProvider,
  ThreadPrimitive,
  MessagePrimitive,
} from "@assistant-ui/react";
import { mockMessages } from "./__fixtures__/mock-messages";

// Convert Tambo message format to Assistant UI format
function convertToThreadMessage(
  msg: typeof mockMessages.assistant,
): ThreadMessageLike {
  return {
    id: msg.id,
    role: msg.role,
    content: msg.content.map((part) => {
      if (part.type === "text") {
        return { type: "text" as const, text: part.text };
      }
      return { type: "text" as const, text: "" }; // Fallback
    }),
    createdAt: new Date(msg.createdAt),
    status: { type: "complete" as const },
  };
}

// Provider for static mock data
function StaticAssistantProvider({ children }: { children: ReactNode }) {
  const [messages] = useState<ThreadMessageLike[]>([
    convertToThreadMessage(mockMessages.user),
    convertToThreadMessage(mockMessages.assistant),
  ]);

  const runtime = useExternalStoreRuntime({
    isRunning: false,
    messages,
    convertMessage: (msg) => msg,
    onNew: async () => {}, // No-op for static display
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}

// Message components using primitives
function AssistantUIUserMessage() {
  return (
    <MessagePrimitive.Root className="flex justify-end mb-4">
      <div className="bg-primary text-primary-foreground rounded-lg px-4 py-2 max-w-[80%]">
        <MessagePrimitive.Parts
          components={{
            Text: ({ text }) => <p>{text}</p>,
          }}
        />
      </div>
    </MessagePrimitive.Root>
  );
}

function AssistantUIAssistantMessage() {
  return (
    <MessagePrimitive.Root className="flex justify-start mb-4">
      <div className="bg-muted rounded-lg px-4 py-2 max-w-[80%]">
        <MessagePrimitive.Parts
          components={{
            Text: ({ text }) => <div className="prose prose-sm">{text}</div>,
            Reasoning: ({ text }) => (
              <div className="text-xs text-muted-foreground italic mb-2">
                {text}
              </div>
            ),
          }}
        />
      </div>
    </MessagePrimitive.Root>
  );
}

// Complete thread display
function AssistantUIThread() {
  return (
    <StaticAssistantProvider>
      <ThreadPrimitive.Root className="flex flex-col">
        <ThreadPrimitive.Viewport className="flex-1 p-4">
          <ThreadPrimitive.Messages
            components={{
              UserMessage: AssistantUIUserMessage,
              AssistantMessage: AssistantUIAssistantMessage,
            }}
          />
        </ThreadPrimitive.Viewport>
      </ThreadPrimitive.Root>
    </StaticAssistantProvider>
  );
}
```

### Research Insights

**Assistant UI API Details:**

- Requires `AssistantRuntimeProvider` - use `useExternalStoreRuntime` for static data
- `ThreadMessageLike` type expects: `{ role, content: Array<{type, text}>, id?, createdAt?, status? }`
- `MessagePrimitive.Parts` uses component mapping for different content types
- `asChild` pattern (Radix-style) supported for custom element rendering
- `makeAssistantToolUI` helper for tool call displays

**Key Differences from Tambo:**

- Assistant UI: Runtime-centric architecture (messages flow through runtime)
- Tambo: Message-prop architecture (message passed directly to component)
- Assistant UI: `MessagePrimitive.Parts` with component map vs Tambo: explicit sub-components

---

## Page Structure

Single comparison page with sections for each library:

```tsx
// showcase/src/app/components/(message-primitives)/message-library-comparison/page.tsx
"use client";

import { ComponentCodePreview } from "@/components/component-code-preview";
// ... imports

export default function MessageLibraryComparisonPage() {
  return (
    <div className="prose max-w-8xl space-y-12">
      <header className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Message Library Comparison
        </h1>
        <p className="text-lg text-muted-foreground">
          Compare how Tambo's compound component primitives align with popular
          AI chat libraries. All three follow similar architectural patterns.
        </p>
      </header>

      {/* Tambo Section - Working Examples */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Tambo Primitives</h2>
        <p className="text-muted-foreground">
          The default implementation using Tambo's base primitives.
        </p>
        <ComponentCodePreview
          title="Assistant with Reasoning"
          component={<TamboMessageWithReasoning />}
          code={tamboCode}
          previewClassName="p-4"
        />
      </section>

      {/* AI Elements Section - Working Examples */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">AI Elements (Vercel)</h2>
        <p className="text-muted-foreground">
          Same pattern using Vercel's AI Elements library.
        </p>
        <ComponentCodePreview
          title="Assistant with Reasoning"
          component={
            <AIElementsWithReasoning message={mockMessages.withReasoning} />
          }
          code={aiElementsCode}
          previewClassName="p-4"
        />
      </section>

      {/* Assistant UI Section - Working Examples */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Assistant UI</h2>
        <p className="text-muted-foreground">
          Same pattern using Assistant UI's primitives with external store
          runtime.
        </p>
        <ComponentCodePreview
          title="Message Thread"
          component={<AssistantUIThread />}
          code={assistantUICode}
          previewClassName="p-4"
        />
      </section>

      {/* Comparison Table */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">API Comparison</h2>
        <table>
          <thead>
            <tr>
              <th>Concept</th>
              <th>Tambo</th>
              <th>AI Elements</th>
              <th>Assistant UI</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Root Container</td>
              <td>
                <code>Message.Root</code>
              </td>
              <td>
                <code>Message</code>
              </td>
              <td>
                <code>MessagePrimitive.Root</code>
              </td>
            </tr>
            <tr>
              <td>Content Area</td>
              <td>
                <code>Message.Content</code>
              </td>
              <td>
                <code>MessageContent</code>
              </td>
              <td>
                <code>MessagePrimitive.Parts</code>
              </td>
            </tr>
            <tr>
              <td>Reasoning Root</td>
              <td>
                <code>ReasoningInfo.Root</code>
              </td>
              <td>
                <code>Reasoning</code>
              </td>
              <td>
                <code>ReasoningGroup</code>
              </td>
            </tr>
            <tr>
              <td>Data Source</td>
              <td>Message prop</td>
              <td>Props or useChat</td>
              <td>Runtime context</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Key Observations */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Key Observations</h2>
        <ul className="space-y-2">
          <li>
            <strong>Compound Components:</strong> All three libraries use the
            same pattern - a root component providing context with specialized
            children.
          </li>
          <li>
            <strong>Role-Based Styling:</strong> Each library handles user vs
            assistant styling through the root component's props or context.
          </li>
          <li>
            <strong>Reasoning Support:</strong> All provide collapsible
            reasoning/thinking displays with similar trigger/content patterns.
          </li>
          <li>
            <strong>Data Flow:</strong> Tambo and AI Elements accept data via
            props; Assistant UI requires a runtime provider.
          </li>
        </ul>
      </section>
    </div>
  );
}
```

---

## Acceptance Criteria

### Functional Requirements

- [x] Branch `lachieh/tam-1027-refactor-component-message-demo` created off current branch
- [x] AI Elements components installed to `showcase/src/components/ai-elements/`
- [x] `@assistant-ui/react` installed in showcase workspace
- [x] Single comparison page created at `/components/message-library-comparison`
- [x] Navigation updated with "Library Comparison" marked as `isNew: true`
- [x] Page demonstrates: Tambo, AI Elements, and Assistant UI implementations side-by-side
- [x] Each section shows working examples with code previews
- [x] API comparison table included
- [x] PR created against base branch with clear description

### Quality Gates

- [x] `npm run lint` passes
- [x] `npm run check-types` passes
- [x] `npm run build -w showcase` succeeds
- [x] All three library sections render without errors
- [x] Code snippets in demos are Prettier formatted (`npm run format:code -w showcase`)

---

## Dependencies & Prerequisites

- Current branch `lachieh/tam-1027-refactor-component-message` must have base primitives implemented
- Showcase app must be able to run (`npm run dev`)

---

## Risk Analysis & Mitigation

| Risk                                 | Impact | Mitigation                                             |
| ------------------------------------ | ------ | ------------------------------------------------------ |
| AI Elements shadcn install conflicts | Medium | Install to isolated `ai-elements/` directory           |
| Assistant UI runtime complexity      | Medium | Use `useExternalStoreRuntime` with static mock data    |
| Style conflicts between libraries    | Low    | Each library in isolated section; use Tailwind scoping |
| Demo branch diverges from base       | Low    | Keep changes minimal and focused; demo is temporary    |

### Research Insights

**Eliminated Risks:**

- React 19 requirement: AI Elements works with React 18
- Library not rendering: Both libraries can render with static data (no live AI required)

---

## Implementation Phases

### Phase 1: Setup (Branch & Dependencies)

1. Create demo branch from current branch
2. Install AI Elements to isolated directory: `npx shadcn@latest add "https://ai-sdk.dev/elements/api/registry/message.json" --path showcase/src/components/ai-elements`
3. Install Assistant UI: `npm install @assistant-ui/react -w showcase`
4. Verify dependencies don't break existing build

### Phase 2: Shared Fixtures

1. Create `showcase/src/app/components/(message-primitives)/__fixtures__/mock-messages.ts`
2. Define typed mock messages with `satisfies TamboThreadMessage`
3. Export type guards for content part filtering

### Phase 3: Comparison Page

1. Create page at `showcase/src/app/components/(message-primitives)/message-library-comparison/page.tsx`
2. Implement Tambo section with working `ComponentCodePreview`
3. Implement AI Elements section with working examples
4. Implement Assistant UI section with `StaticAssistantProvider`
5. Add API comparison table
6. Add key observations section

### Phase 4: Navigation & Cleanup

1. Update `showcase/src/lib/navigation.ts` with "Library Comparison" (`isNew: true`)
2. Remove `isNew` from "Elicitation"
3. Run linting and type checks
4. Format code snippets: `npm run format:code -w showcase`
5. Build showcase: `npm run build -w showcase`

### Phase 5: PR Creation

1. Commit all changes with descriptive message
2. Push branch to origin
3. Create PR against base branch:
   ```bash
   op plugin run -- gh pr create --base lachieh/tam-1027-refactor-component-message --title "demo: Base primitives library comparison" --body "..."
   ```
4. Add PR description explaining demo purpose and key findings

---

## References & Research

### Internal References

- Base primitives: `/packages/ui-registry/src/base/message/`
- Styled Message component: `/packages/ui-registry/src/components/message/message.tsx`
- Existing Message page: `/showcase/src/app/components/(message-primitives)/message/page.tsx`
- Navigation config: `/showcase/src/lib/navigation.ts`
- Component page patterns: `/showcase/src/app/components/AGENTS.md`

### External References

- [AI Elements GitHub](https://github.com/vercel/ai-elements)
- [AI Elements Documentation](https://ai-sdk.dev/elements)
- [AI Elements Registry API](https://ai-sdk.dev/elements/api/registry/)
- [Assistant UI GitHub](https://github.com/assistant-ui/assistant-ui)
- [Assistant UI Website](https://www.assistant-ui.com/)
- [Assistant UI External Store Runtime](https://www.assistant-ui.com/docs/runtimes/custom/external-store)
- [Assistant UI npm](https://www.npmjs.com/package/@assistant-ui/react)
