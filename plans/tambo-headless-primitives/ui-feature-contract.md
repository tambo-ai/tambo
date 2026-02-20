# UI Feature Contract: Tambo Base Primitives + Registry Blocks

**Date**: 2026-02-20  
**Status**: Approved decisions captured  
**Purpose**: Define feature ownership boundaries after architecture review.

## Contract Rules

1. `react-ui-base` is behavior-only and unstyled.
2. `ui-registry` contains styled components and opinionated block orchestration.
3. Compound composition uses `render` and direct `useRender.*` types; `asChild` stays removed.
4. Thread block components remain registry blocks, not new base primitive domains.
5. Default suggestions are caller-provided, not hardcoded defaults in blocks.
6. Global hotkeys are allowed and expected in registry blocks.
7. Base primitive docs are required deliverables per primitive slice and must follow the shared Base UI-style docs template.

## Feature Contracts

### 1) Message (Base Primitive)

- **Goal**: Render user/assistant message shells, text content, tool call info, reasoning, images, and rendered component areas.
- **Behavior ownership**: `react-ui-base`.
- **Styled composition ownership**: `ui-registry`.
- **Canonical usage**:

```tsx
<Message.Root message={message} role={message.role}>
  <Message.Content />
  <Message.Images />
  <Message.RenderedComponent>
    <Message.RenderedComponentCanvasButton />
    <Message.RenderedComponentContent />
  </Message.RenderedComponent>
</Message.Root>
```

### 2) ToolcallInfo (Base Primitive)

- **Goal**: Resolve tool status + associated result and expose composable trigger/content parts.
- **Behavior ownership**: `react-ui-base`.

```tsx
<ToolcallInfo.Root message={message}>
  <ToolcallInfo.Trigger>
    <ToolcallInfo.StatusIcon />
    <ToolcallInfo.StatusText />
  </ToolcallInfo.Trigger>
  <ToolcallInfo.Content>
    <ToolcallInfo.ToolName />
    <ToolcallInfo.Parameters />
    <ToolcallInfo.Result />
  </ToolcallInfo.Content>
</ToolcallInfo.Root>
```

### 3) ReasoningInfo (Base Primitive)

- **Goal**: Expose reasoning status + expandable reasoning steps.
- **Behavior ownership**: `react-ui-base`.

```tsx
<ReasoningInfo.Root message={message}>
  <ReasoningInfo.Trigger>
    <ReasoningInfo.StatusText />
  </ReasoningInfo.Trigger>
  <ReasoningInfo.Content>
    <ReasoningInfo.Steps />
  </ReasoningInfo.Content>
</ReasoningInfo.Root>
```

### 4) MessageInput (Base Primitive)

- **Goal**: Compose input UX with clear boundaries for text input, file controls, prompt/resource controls, submit/stop, images, error, and elicitation mode.
- **Behavior ownership**: `react-ui-base`.
- **Key contract points**:
  - Root owns submit/cancel, draft persistence, drag-drop, staged images, and elicitation mode switching.
  - Presence of a layout item determines availability (no wrapper-side child-type partitioning).
  - Submit/Stop are separate controls with `keepMounted` support and `data-hidden` when hidden but mounted.
  - Input content visibility vs elicitation visibility is handled in base primitives.
- **Canonical usage**:

```tsx
<MessageInput.Root>
  <MessageInput.Content>
    <MessageInput.TextArea placeholder="Type your message..." />
    <MessageInput.Toolbar>
      <MessageInput.FileButton>
        <MessageInput.FileInput />
      </MessageInput.FileButton>
      <MessageInput.McpPromptButton />
      <MessageInput.McpResourceButton />
      <MessageInput.SubmitButton keepMounted />
      <MessageInput.StopButton keepMounted />
    </MessageInput.Toolbar>
    <MessageInput.Images>
      <MessageInput.ImageItem>
        <MessageInput.ImageToggle>
          <MessageInput.ImagePreview />
        </MessageInput.ImageToggle>
        <MessageInput.ImageRemove />
      </MessageInput.ImageItem>
    </MessageInput.Images>
  </MessageInput.Content>
  <MessageInput.Elicitation />
  <MessageInput.Error />
</MessageInput.Root>
```

### 5) Elicitation (Base Primitive)

- **Goal**: Dedicated composable primitive for elicitation flow, with behavior parity expectations similar to MessageInput.
- **Behavior ownership**: `react-ui-base`.
- **Notes**:
  - Should be independently composable.
  - MessageInput uses this primitive for hide-input/show-elicitation behavior.

```tsx
<Elicitation.Root request={request} onResponse={onResponse}>
  <Elicitation.Message />
  <Elicitation.Fields />
  <Elicitation.Actions />
</Elicitation.Root>
```

### 6) Thread Blocks (Registry Blocks)

- **Components**: `message-thread-full`, `message-thread-panel`, `message-thread-collapsible`, `control-bar`.
- **Goal**: Styled block UIs with shared Tambo behavior and different display layouts.
- **Ownership**: `ui-registry`.
- **Notes**:
  - They may keep orchestration state (`open`, panel width, hotkeys, etc.).
  - They should compose base primitives; they do not define new base primitive domains.

### 7) ThreadHistory (Registry Component)

- **Goal**: Styled thread sidebar list/search/new-thread controls.
- **Ownership**: `ui-registry`.
- **Notes**:
  - Keep rename UI for now.
  - Add TODO in component implementation to wire rename API when backend support exists.

### 8) CanvasSpace (Registry Component)

- **Goal**: Styled canvas display for rendered components.
- **Ownership**: `ui-registry`.
- **Notes**:
  - Keep global `tambo:showComponent` event API.

### 9) Ready-to-Use Components (Registry Components)

- **Components**: `map`, `form`, `input-fields`.
- **Ownership**: `ui-registry`.
- **Notes**:
  - No base primitive extraction required for these components.

### 10) Suggestions Behavior

- **Rule**: Suggestions defaults are caller-provided.
- **Implication**: Registry blocks should accept suggestion props and avoid embedding app-specific suggestion defaults.

## Out of Scope for Base Primitive Expansion

- New base primitive domains for thread blocks.
- Base primitive extraction for `map`, `form`, `input-fields`.
- Any reintroduction of `asChild`.

## Implementation Gate

No additional structural rewrites should proceed unless they comply with this contract.
