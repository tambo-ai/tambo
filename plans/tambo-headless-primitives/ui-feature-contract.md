# UI Feature Contract: Tambo Base Primitives + Registry Blocks

**Date**: 2026-02-20  
**Status**: Approved decisions captured  
**Purpose**: Define feature ownership boundaries after architecture review.

## Contract Rules

1. `react-ui-base` is behavior-only and unstyled.
2. `ui-registry` contains styled components and opinionated block orchestration.
3. Compound composition uses `render` and direct `useRender.*` types; `asChild` stays removed.
4. Thread block containers remain registry blocks; supporting thread control/timeline/render primitives belong in `react-ui-base`.
5. Default suggestions are caller-provided, not hardcoded defaults in blocks.
6. Global hotkeys are allowed and expected in registry blocks.
7. Base primitive docs are required deliverables per primitive slice and must follow the shared Base UI-style docs template.
8. Registry components/blocks should compose base primitives for Tambo-specific behavior and avoid direct Tambo hook usage.

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

### 6) ThreadHistory (Base Primitive)

- **Goal**: Own thread list/search/select/new-thread behavior boundaries in composable headless parts.
- **Behavior ownership**: `react-ui-base`.
- **Notes**:
  - Registry wrappers provide styling and presentation.
  - Rename affordance remains visible; backend rename wiring stays explicitly deferred.

```tsx
<ThreadHistory.Root>
  <ThreadHistory.Search />
  <ThreadHistory.List>
    <ThreadHistory.Item />
  </ThreadHistory.List>
  <ThreadHistory.NewThreadButton />
</ThreadHistory.Root>
```

### 7) ThreadDropdown (Base Primitive)

- **Goal**: Expose thread action availability and composable trigger/content parts for thread controls.
- **Behavior ownership**: `react-ui-base`.

```tsx
<ThreadDropdown.Root>
  <ThreadDropdown.Trigger />
  <ThreadDropdown.Content>
    <ThreadDropdown.NewThread />
    <ThreadDropdown.ThreadHistory />
  </ThreadDropdown.Content>
</ThreadDropdown.Root>
```

### 8) ThreadContent (Base Primitive)

- **Goal**: Own timeline container behavior boundaries (loading/empty/content state seams) for thread rendering.
- **Behavior ownership**: `react-ui-base`.

```tsx
<ThreadContent.Root>
  <ThreadContent.Loading />
  <ThreadContent.Empty />
  <ThreadContent.Messages />
</ThreadContent.Root>
```

### 9) McpComponents (Base Primitive)

- **Goal**: Own rendered-component availability/state boundaries for MCP/component rendering flows.
- **Behavior ownership**: `react-ui-base`.

```tsx
<McpComponents.Root>
  <McpComponents.Trigger />
  <McpComponents.Content />
</McpComponents.Root>
```

### 10) Thread Blocks (Registry Blocks)

- **Components**: `message-thread-full`, `message-thread-panel`, `message-thread-collapsible`, `control-bar`.
- **Goal**: Styled block UIs with shared Tambo behavior and different display layouts.
- **Ownership**: `ui-registry`.
- **Notes**:
  - They may keep orchestration state (`open`, panel width, hotkeys, etc.).
  - They should compose base primitives; they do not define new base primitive domains.

### 11) ThreadHistory (Registry Component)

- **Goal**: Styled `ThreadHistory` primitive composition for sidebar/list/search/new-thread UX.
- **Ownership**: `ui-registry`.
- **Notes**:
  - Keep rename UI for now.
  - Add TODO in component implementation to wire rename API when backend support exists.
  - Do not own core thread behavior; compose base primitives.

### 12) ThreadDropdown (Registry Component)

- **Goal**: Styled `ThreadDropdown` primitive composition and shortcut wiring.
- **Ownership**: `ui-registry`.
- **Notes**:
  - Keeps product-level keyboard affordances.
  - Does not own thread action state derivation.

### 13) ThreadContent (Registry Component)

- **Goal**: Styled `ThreadContent` primitive composition for timeline presentation.
- **Ownership**: `ui-registry`.
- **Notes**:
  - Keeps visual layout and display concerns only.

### 14) CanvasSpace (Registry Component)

- **Goal**: Styled canvas display for rendered components.
- **Ownership**: `ui-registry`.
- **Notes**:
  - Compose `McpComponents` behavior boundaries from `react-ui-base`.
  - Keep global `tambo:showComponent` event API.

### 15) Ready-to-Use Components (Registry Components)

- **Components**: `map`, `form`, `input-fields`.
- **Ownership**: `ui-registry`.
- **Notes**:
  - No base primitive extraction required for these components.

### 16) Suggestions Behavior

- **Rule**: Suggestions defaults are caller-provided.
- **Implication**: Registry blocks should accept suggestion props and avoid embedding app-specific suggestion defaults.

## Out of Scope for Base Primitive Expansion

- New base primitive domains for thread blocks.
- Base primitive extraction for `map`, `form`, `input-fields`.
- Any reintroduction of `asChild`.

## Implementation Gate

No additional structural rewrites should proceed unless they comply with this contract.
