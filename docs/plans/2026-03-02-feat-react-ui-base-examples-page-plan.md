---
title: "feat: Add examples page to react-ui-base docs showing three chat styling variations"
type: feat
status: active
date: 2026-03-02
deepened: 2026-03-02
---

## Enhancement Summary

**Deepened on:** 2026-03-02
**Sections enhanced:** 6
**Research agents used:** TypeScript reviewer, pattern-recognition specialist, code-simplicity reviewer, architecture strategist, Tailwind/CSS research

### Key Improvements

1. Styling uses **plain CSS** (inline styles + CSS-in-JS objects), NOT Tailwind — proves base components work with any styling approach
2. Mock data must use `ReactTamboThreadMessage` (not `TamboThreadMessage`) with `as const` on role/type literals
3. Three variations kept (overriding simplicity reviewer recommendation) since the user explicitly requested three
4. Each variation in a separate helper file to stay under 200-300 LOC per file
5. Exhaustive theme-to-component mapping via `satisfies Record<Theme, FC>` pattern

### Critical Constraints from Reviews

- `useDemoControls` MUST be called inside the inner `ExamplesDemo` component, NOT inside `ExamplesDemoPreview`
- Code strings in tabs use `.trimStart()` on template literals
- No `language` field on CodeFile entries (inferred from extension)
- `meta.json` MUST be updated or page won't appear in sidebar

---

# Add Examples Page to React UI Base Documentation

## Overview

Create a new "Examples" page in the react-ui-base documentation section that demonstrates the core value proposition: **write behavior once, style infinitely**. The page features a complete chat interface built with multiple react-ui-base components, shown in three dramatically different styling variations — all using the exact same behavioral primitives.

## Problem Statement / Motivation

The current react-ui-base docs show each component in isolation. There's no page that demonstrates how the components compose together into a real interface, or why using unstyled base components matters. Developers evaluating the package need to see the "aha moment" — that the same compound components can produce wildly different UIs just by changing CSS styles and targeting data-attribute selectors.

## Proposed Solution

A single new MDX page with a multi-file demo that uses `useDemoControls` to switch between three styling variations. The demo composes `ThreadContent`, `Message`, and `MessageInput` primitives into a complete chat interface.

### Three Styling Variations

1. **Modern Minimal** — Clean rounded bubbles, monochrome neutral palette, subtle shadows. Think iMessage/WhatsApp. Demonstrates: basic data-attribute role-based styling, clean typography.

2. **Retro Terminal** — Green-on-black terminal aesthetic, monospace font, box-drawing borders, blinking cursor. Demonstrates: radical visual transformation using only CSS, custom loading indicator.

3. **Glassmorphism** — Frosted glass cards, gradient backgrounds, blur backdrop effects, colorful accents. Demonstrates: advanced visual effects layered on base components, keeping all behavior identical.

### Key Features Showcased

Each variation demonstrates these react-ui-base features:

- **Compound components**: `ThreadContent.Root` > `ThreadContent.Messages` > `Message.Root` > `Message.Content`
- **`data-slot` attributes**: CSS targeting without className coupling
- **`data-role` state attributes**: Role-based styling using `[data-role="user"]` / `[data-role="assistant"]` CSS selectors
- **`keepMounted` pattern**: MessageInput submit/stop button toggling
- **Context-based composition**: No prop drilling between ThreadContent and Message
- **render props**: Custom message list rendering via `ThreadContent.Messages render={...}`

### Styling Approach: Plain CSS (No Tailwind)

All three variations use **inline styles** (React `style` prop with CSS-in-JS objects) and/or a scoped `<style>` tag. This is deliberate — it proves react-ui-base works with ANY styling approach, not just Tailwind. The code shown in tabs should be immediately understandable to developers regardless of their CSS framework preference.

Benefits:

- Zero dependency on any CSS framework
- Copy-pasteable into any project regardless of build setup
- Makes the `data-slot` and `data-role` attribute targeting story clearer via standard CSS selectors
- Strongest possible proof that the components are truly unstyled

## Technical Approach

### Files to Create

#### 1. `docs/content/docs/reference/react-ui-base/examples.mdx`

New MDX page with:

- Frontmatter: title "Chat Interface Examples", description about styling variations
- Import of the demo preview component
- Prose explaining the value proposition (same behavior, different styles)
- The live demo embed
- Brief explanation of key patterns used (data-slot targeting, render props, compound components)
- Links to individual component reference pages

#### 2. `docs/content/docs/reference/react-ui-base/_demos/examples-demo.tsx`

Main demo orchestrator file (~80-100 LOC):

- `"use client"` directive
- Imports the three variation components from sibling files
- `useDemoControls` with select: `{ theme: { options: ["minimal", "terminal", "glass"] as const, default: "minimal", label: "Theme" } }`
- Exhaustive theme-to-component lookup:
  ```tsx
  const THEME_COMPONENTS = {
    minimal: MinimalChat,
    terminal: TerminalChat,
    glass: GlassChat,
  } as const satisfies Record<typeof theme, React.FC>;
  ```
- Exported `examplesDemoCode` as `CodeFile[]` array
- Exported `ExamplesDemoPreview` wrapper

#### 3. `docs/content/docs/reference/react-ui-base/_demos/examples-minimal.tsx`

Modern Minimal variation (~100-150 LOC):

- Self-contained chat component using inline styles
- Uses `ThreadContent.Root`, `ThreadContent.Messages` (render prop), `Message.Root`, `Message.Content`, `Message.LoadingIndicator`
- Uses `MessageInput.Root`, `MessageInput.Content`, `MessageInput.Textarea`, `MessageInput.SubmitButton`
- Styling: white/light gray container, rounded message bubbles, role-based alignment via `[data-role]` selectors, subtle box-shadows
- Exports: `MinimalChat` component

#### 4. `docs/content/docs/reference/react-ui-base/_demos/examples-terminal.tsx`

Retro Terminal variation (~100-150 LOC):

- Self-contained chat component using inline styles
- Same base components as minimal
- Styling: black background, green monospace text, no border-radius, `>` and `$` prefixes for role indication
- Blinking cursor loading indicator via CSS `@keyframes` in a `<style>` tag
- No avatar elements — role indicated by text prefix character
- Exports: `TerminalChat` component

#### 5. `docs/content/docs/reference/react-ui-base/_demos/examples-glass.tsx`

Glassmorphism variation (~100-150 LOC):

- Self-contained chat component using inline styles
- Same base components as minimal
- Styling: gradient background, `backdrop-filter: blur()` on message cards, semi-transparent borders, colorful role-based accents
- Accessibility note: ensure text has sufficient contrast over blurred backgrounds (add semi-opaque text backing)
- Exports: `GlassChat` component

#### 6. `docs/content/docs/reference/react-ui-base/_demos/examples-data.ts`

Shared mock data (~30 LOC):

- Static array of mock messages
- Exports: `mockMessages` constant

### Files to Modify

#### 7. `docs/content/docs/reference/react-ui-base/meta.json`

Add `"examples"` to the pages array after `"index"`:

```json
{
  "title": "React UI Base",
  "pages": [
    "index",
    "examples",
    "message",
    ...
  ]
}
```

### Mock Data Structure

```ts
import type { ReactTamboThreadMessage } from "@tambo-ai/react";

export const mockMessages = [
  {
    id: "ex-1",
    role: "user" as const,
    content: [{ type: "text" as const, text: "What's the weather in Tokyo?" }],
  },
  {
    id: "ex-2",
    role: "assistant" as const,
    content: [
      {
        type: "text" as const,
        text: "It's currently 18°C and clear in Tokyo. Perfect weather for cherry blossom viewing!",
      },
    ],
  },
  {
    id: "ex-3",
    role: "user" as const,
    content: [{ type: "text" as const, text: "How about this weekend?" }],
  },
  {
    id: "ex-4",
    role: "assistant" as const,
    content: [
      {
        type: "text" as const,
        text: "This weekend looks great — Saturday will be 20°C with sunshine, and Sunday drops to 16°C with light clouds.",
      },
    ],
  },
] satisfies ReactTamboThreadMessage[];
```

**Type safety notes:**

- Use `ReactTamboThreadMessage` (not `TamboThreadMessage`) for the live demo — `Message.Root` requires this type
- The `as const` on `role` and `type` literals is required — without it TypeScript widens to `string` which won't satisfy the union literal types
- The code shown in tabs (for users) can use `TamboThreadMessage` since that's the simpler public type

### Component Composition Pattern

Each variation follows this structure with different inline styles:

```tsx
<ThreadContent.Root style={rootStyles}>
  <ThreadContent.Empty style={emptyStyles}>
    Start a conversation...
  </ThreadContent.Empty>
  <ThreadContent.Messages
    render={(props, state) => (
      <div {...props}>
        {state.filteredMessages.map((message) => (
          <Message.Root key={message.id} message={message} role={message.role} style={messageStyles}>
            <Message.Content style={contentStyles} />
            <Message.LoadingIndicator style={loadingStyles} />
          </Message.Root>
        ))}
      </div>
    )}
  />
</ThreadContent.Root>
<MessageInput.Root style={inputRootStyles}>
  <MessageInput.Content>
    <MessageInput.Textarea
      render={({ value, setValue, disabled }) => (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          placeholder="Type a message..."
          style={textareaStyles}
        />
      )}
    />
    <MessageInput.SubmitButton style={submitStyles}>Send</MessageInput.SubmitButton>
  </MessageInput.Content>
</MessageInput.Root>
```

### Styling Details (Plain CSS)

**Modern Minimal:**

- Container: `{ backgroundColor: '#fff', borderRadius: 12, padding: 16 }`
- Message bubbles: rounded corners, role-based alignment (user = right-aligned blue, assistant = left-aligned gray)
- Avatar: small circle with initials or icon
- Soft box-shadows: `boxShadow: '0 1px 3px rgba(0,0,0,0.1)'`
- System font stack

**Retro Terminal:**

- Container: `{ backgroundColor: '#000', fontFamily: 'monospace', color: '#4ade80', padding: 16 }`
- No border-radius anywhere
- `>` prefix for user messages, `$` prefix for assistant
- Border: `1px solid #166534` (dark green)
- Blinking cursor via `<style>` tag with `@keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }` using `step-start` timing
- No avatars — pure text terminal feel

**Glassmorphism:**

- Container: `{ background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(59,130,246,0.2), rgba(236,72,153,0.2))', padding: 16 }`
- Message cards: `{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12 }`
- Colorful accent left-border per role (purple for assistant, blue for user)
- Text backing for contrast: semi-opaque background behind text content
- Subtle glow on submit button

### Code Tabs Structure

The `examplesDemoCode` export will be a `CodeFile[]` with 3 tabs:

```ts
export const examplesDemoCode = [
  { name: "chat-minimal.tsx", code: `...`.trimStart() },
  { name: "chat-terminal.tsx", code: `...`.trimStart() },
  { name: "chat-glass.tsx", code: `...`.trimStart() },
];
```

Each code tab is a **complete, self-contained, copy-pasteable** component. Mock data is inlined in each tab (a few lines). No shared abstractions between tabs — redundancy in shown code is correct because each example should be independently liftable into a user's project.

## Acceptance Criteria

- [ ] New `examples.mdx` page renders correctly in docs dev server
- [ ] Three styling variations are visually distinct and compelling
- [ ] `useDemoControls` select switches between themes without remounting
- [ ] All three variations use the exact same react-ui-base components (ThreadContent, Message, MessageInput)
- [ ] All styling uses plain CSS (inline styles / style objects) — zero Tailwind classes in the demo components
- [ ] Multi-file code panel shows clean, copy-pasteable code for each variation
- [ ] Page appears in sidebar navigation after "Overview"
- [ ] No new dependencies added
- [ ] Passes lint and type-check
- [ ] Mock data uses `ReactTamboThreadMessage` with proper `as const` annotations

## Dependencies & Risks

- **No new dependencies**: All styling is plain CSS via inline styles
- **Low risk**: Additive-only change (new files + meta.json update)
- **Glassmorphism backdrop-filter**: Supported in all modern browsers; graceful degradation in older ones (falls back to solid semi-transparent background)
- **Glassmorphism accessibility**: Text contrast over blurred backgrounds can fail WCAG — mitigate with semi-opaque text backing

## Implementation Notes

- Follow existing demo file conventions exactly (see `message-demo.tsx` for reference patterns)
- Use `satisfies` for mock data typing, not `as` assertions
- The `ExamplesDemoPreview` wrapper just passes code + children to `DemoPreview` — no controls in it
- `useDemoControls` goes in the inner `ExamplesDemo` component only
- Code strings in tabs are inert (not compiled) — any typo won't be caught by `check-types`
- Each variation file should be independently readable without needing to reference other files
- The `role={message.role}` prop on `Message.Root` is intentionally redundant with `message.role` — it's required by the component API
