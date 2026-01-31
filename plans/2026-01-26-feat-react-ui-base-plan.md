# Feature: @tambo-ai/react-ui-base Package

## Overview

Extract business logic from UI components into reusable hooks, utilities, and unstyled base components in a new `@tambo-ai/react-ui-base` package. This enables users to build custom UIs while leveraging Tambo's core functionality. The extraction targets the two largest components (`message-input.tsx` at 1612 lines and `message.tsx` at 1071 lines) while maintaining backwards compatibility.

## Key Design Decisions

- **Separate package**: `@tambo-ai/react-ui-base` - cleaner dependency boundaries, easier tree-shaking
- **Peer dependency on react-sdk**: Base hooks integrate with existing `@tambo-ai/react` providers
- **Tambo-specific naming**: Hooks follow `useTambo*` convention for consistency
- **Incremental extraction**: Start with pure utility functions, then simple hooks, then complex stateful hooks
- **Internal-first migration**: Original components will use base hooks internally, preserving API backwards compatibility
- **Composition over replacement**: Each extracted hook handles one concern; components compose multiple hooks

## Tree-shaking Requirements

Tree-shaking should be treated as a requirement, not just a nice-to-have.

- `@tambo-ai/react-ui-base` should be publishable as side-effect free (`"sideEffects": false` in package.json)
- Avoid module-level side effects (no work at import-time):
  - No `window`/`document`/`sessionStorage` access outside of `useEffect` / guarded helper functions
  - No logging, no runtime registration, no global polyfills
- Keep base hooks UI-agnostic to avoid pulling in UI dependencies (e.g., no `lucide-react` imports or returning JSX elements from hooks)
- Be careful with `index.ts` barrels: prefer `export { foo } from "./foo"` re-exports over patterns that eagerly import modules
- Use feature-based subpath exports (e.g., `@tambo-ai/react-ui-base/message-input`, `@tambo-ai/react-ui-base/message`)

## Architecture

```
User Code
    |
    v
@tambo-ai/react-ui-base (feature-based subpath exports - tree-shakeable)
    |
    +-- message-input/
    |     +-- use-message-input-state.ts
    |     +-- use-keyboard-shortcut.ts
    |     +-- draft-persistence.ts
    |     +-- image-validation.ts
    |     +-- keyboard-shortcuts.ts
    |
    +-- message/
    |     +-- use-message-content.ts
    |     +-- use-tool-response.ts
    |     +-- format-tool-result.ts
    |     +-- get-tool-status-message.ts
    |     +-- content-utils.ts
    |     +-- content-transforms.ts
    |
    +-- thread/
    |     +-- use-thread-management.ts
    |     +-- use-suggestion-merge.ts
    |
    +-- resources/
    |     +-- use-combined-resources.ts
    |     +-- use-combined-prompts.ts
    |     +-- resource-filters.ts
    |
    +-- scroll/
          +-- use-tambo-auto-scroll.ts
    |
    v
@tambo-ai/react (providers & core hooks)
    |
    v
@tambo-ai/typescript-sdk (API client)
```

## Usage

```typescript
// Import by feature
import {
  useMessageInputState,
  useKeyboardShortcut,
} from "@tambo-ai/react-ui-base/message-input";
import {
  useMessageContent,
  formatToolResult,
} from "@tambo-ai/react-ui-base/message";
import { useTamboAutoScroll } from "@tambo-ai/react-ui-base/scroll";

// Or from main entry (re-exports all features - less tree-shakeable; depends on bundler)
import {
  useMessageInputState,
  useTamboAutoScroll,
} from "@tambo-ai/react-ui-base";

// Core SDK (providers, API hooks)
import { useTambo, TamboProvider } from "@tambo-ai/react";
```

## Component Schema/Interface

```typescript
// Auto-scroll hook interface
interface UseTamboAutoScrollOptions {
  /** Tolerance in pixels for "at bottom" detection (default: 8) */
  tolerance?: number;
  /** Disable auto-scroll entirely */
  disabled?: boolean;
}

interface UseTamboAutoScrollReturn {
  /** Ref to attach to scrollable container */
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  /** Whether auto-scroll is active */
  isAutoScrollEnabled: boolean;
  /** Manually scroll to bottom */
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  /** onScroll handler to attach to container */
  handleScroll: () => void;
}

// Message input state hook interface
interface UseMessageInputStateOptions {
  threadId: string;
  onSubmit: (options: {
    value: string;
    resourceNames: Record<string, string>;
  }) => Promise<void>;
  persistDrafts?: boolean;
}

interface MessageInputState {
  value: string;
  setValue: (value: string) => void;
  displayValue: string;
  setDisplayValue: (value: string) => void;
  submitError: string | null;
  setSubmitError: (error: string | null) => void;
  imageError: string | null;
  setImageError: (error: string | null) => void;
  isSubmitting: boolean;
  handleSubmit: (
    e: React.FormEvent,
    resourceNames: Record<string, string>,
  ) => Promise<void>;
  clearErrors: () => void;
}

// Message content hook interface
interface UseMessageContentOptions {
  content: TamboThreadMessage["content"];
  enableMarkdown?: boolean;
}

interface MessageContentState {
  markdownContent: string;
  hasContent: boolean;
  images: string[];
}

// Tool response hook interface
interface UseToolResponseOptions {
  message: TamboThreadMessage;
  threadMessages: TamboThreadMessage[];
}

interface ToolResponseState {
  toolCallRequest: TamboAI.ToolCallRequest | undefined;
  associatedToolResponse: TamboThreadMessage | null;
  toolStatusMessage: string | null;
  hasToolError: boolean;
}

// Combined resources hook interface
interface UseCombinedResourceListOptions {
  externalProvider?: ResourceProvider;
  search: string;
  debounceMs?: number;
}

// Formatting utilities
function formatToolResult(result: unknown): string;
function getToolStatusMessage(status: ToolCallStatus): string;
```

## File Structure

Organized by **feature folders** rather than by type (hooks/utils). Each feature folder contains all related hooks, utilities, and tests.

```
packages/
  react-ui-base/                   # NEW PACKAGE
    package.json
    tsconfig.json
    src/
      index.ts                     # Main entry: @tambo-ai/react-ui-base

      message-input/               # Message input feature
        index.ts
        use-message-input-state.ts
        use-message-input-state.test.ts
        use-keyboard-shortcut.ts
        use-keyboard-shortcut.test.ts
        draft-persistence.ts
        draft-persistence.test.ts
        image-validation.ts
        image-validation.test.ts
        keyboard-shortcuts.ts
        keyboard-shortcuts.test.ts

      message/                     # Message display feature
        index.ts
        use-message-content.ts
        use-message-content.test.ts
        use-tool-response.ts
        use-tool-response.test.ts
        format-tool-result.ts
        format-tool-result.test.ts
        get-tool-status-message.ts
        get-tool-status-message.test.ts
        content-utils.ts
        content-utils.test.ts
        content-transforms.ts
        content-transforms.test.ts

      thread/                      # Thread management feature
        index.ts
        use-thread-management.ts
        use-thread-management.test.ts
        use-suggestion-merge.ts
        use-suggestion-merge.test.ts

      resources/                   # Resource/prompt combining feature
        index.ts
        use-combined-resources.ts
        use-combined-resources.test.ts
        use-combined-prompts.ts
        use-combined-prompts.test.ts
        resource-filters.ts
        resource-filters.test.ts

      scroll/                      # Auto-scroll feature
        index.ts
        use-tambo-auto-scroll.ts
        use-tambo-auto-scroll.test.ts
```

**package.json:**

```json
{
  "name": "@tambo-ai/react-ui-base",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "sideEffects": false,
  "exports": {
    ".": "./src/index.ts",
    "./message-input": "./src/message-input/index.ts",
    "./message": "./src/message/index.ts",
    "./thread": "./src/thread/index.ts",
    "./resources": "./src/resources/index.ts",
    "./scroll": "./src/scroll/index.ts"
  },
  "peerDependencies": {
    "@tambo-ai/react": "*",
    "react": "^18 || ^19"
  }
}
```

## Implementation Steps

### Step 1: In-Place Component Refactoring (Preparation)

Before creating the base package, refactor existing components to separate "dumb-display" (presentation) from "base-functional" (state/logic) parts. This is done within the existing `ui-registry` package without changing functionality.

#### Progress (Step 1)

**Base Primitives Created** (in `packages/ui-registry/src/base/`):

- [x] `message/` - MessageBase compound components (Root, Content, Avatar, Group)
- [x] `reasoning-info/` - ReasoningInfoBase compound components
- [x] `toolcall-info/` - ToolcallInfoBase compound components
- [x] `types/` - Shared type definitions
- [x] `use-render/` - Render utility hook

**Package Exports Added**:

- [x] `"./base/*": "./src/base/*/index.tsx"` added to ui-registry package.json

**Data Attributes**:

- [x] `data-slot` attributes added to all base components for CSS targeting

**Goal:** Each component directory exports both:

- **Display components** - Pure presentation, receive all data via props, no state management
- **Functional hooks/logic** - State management, side effects, business logic

**Approach:**

- Refactor one component at a time
- No new package dependencies
- All existing tests must pass without modification
- No API changes to exported components

**Components to refactor (in order of complexity):**

1. [ ] `message-suggestions` (simplest - mostly display)
2. [ ] `scrollable-message-container` (auto-scroll logic extraction)
3. [ ] `thread-dropdown` (thread management logic)
4. [x] `message` (content transformation, tool response logic) - **DONE**: Refactored to use MessageBase compound primitives. Visual parity verified via screenshot comparison.
5. [ ] `message-input` (most complex - input state, MCP resources, draft persistence)

**Per-component refactoring pattern:**

```
Before:
  message-input/
    message-input.tsx        # 1612 lines mixing state + display

After:
  message-input/
    message-input.tsx        # Orchestrates hooks + renders display
    message-input-display.tsx    # Pure presentation component
    use-message-input-state.ts   # Input state hook (local to component)
    use-combined-resources.ts    # Resource merging hook (local to component)
    utils.ts                     # Pure utility functions (local to component)
```

**Key Implementation Details:**

- Extract inline state/effects into local hooks within the same component directory
- Create display sub-components that receive all data via props
- Keep hooks and utils local to each component initially (not shared)
- Main exported component becomes a thin orchestration layer
- This is NOT a hard rule - use judgment on what separation makes sense

**Acceptance for Step 1:**

- [ ] Each refactored component has clear separation between logic and display
- [ ] All existing tests pass without modification
- [ ] No changes to public component APIs
- [ ] Showcase app renders and functions identically

---

### Step 2: Create Package Scaffolding

After in-place refactoring proves the separation works, create the `@tambo-ai/react-ui-base` package.

**Files:**

- `packages/react-ui-base/package.json` (NEW)
- `packages/react-ui-base/tsconfig.json` (NEW)
- `packages/react-ui-base/src/index.ts` (NEW) - Main entry point
- `packages/react-ui-base/src/message-input/index.ts` (NEW) - Message input feature barrel
- `packages/react-ui-base/src/message/index.ts` (NEW) - Message feature barrel
- `packages/react-ui-base/src/thread/index.ts` (NEW) - Thread feature barrel
- `packages/react-ui-base/src/resources/index.ts` (NEW) - Resources feature barrel
- `packages/react-ui-base/src/scroll/index.ts` (NEW) - Scroll feature barrel

**Key Implementation Details:**

- Create new package in `packages/react-ui-base/`
- Set up peer dependency on `@tambo-ai/react`
- Configure `"sideEffects": false` for tree-shaking
- Use feature folders instead of hooks/utils folders
- No build step initially - export TypeScript directly (like `ui-registry`)

### Step 3: Extract Shared Utilities

Extract pure functions with zero React dependencies. These can be tested independently. Utilities are colocated with their related feature.

**Files:**

- `packages/react-ui-base/src/message/content-transforms.ts` (NEW)
- `packages/react-ui-base/src/message/format-tool-result.ts` (NEW)
- `packages/react-ui-base/src/message/get-tool-status-message.ts` (NEW)
- `packages/react-ui-base/src/message/content-utils.ts` (NEW)
- `packages/react-ui-base/src/message-input/draft-persistence.ts` (NEW)
- `packages/react-ui-base/src/message-input/image-validation.ts` (NEW)
- `packages/react-ui-base/src/message-input/keyboard-shortcuts.ts` (NEW)
- `packages/react-ui-base/src/resources/resource-filters.ts` (NEW)

**Key Implementation Details:**

- Extract `convertContentToMarkdown()` from message.tsx
- Extract `formatToolResult()`, `formatTextContent()`, `renderImageContent()`, `renderResourceContent()` from message.tsx
- Extract `getToolStatusMessage()` and `keyifyParameters()` from message.tsx
- Extract `dedupeResourceItems()`, `filterResourceItems()`, `filterPromptItems()` from message-input.tsx
- Extract `getStorageKey()`, `storeValueInSessionStorage()`, `getValueFromSessionStorage()` from message-input.tsx
- Extract `getImageItems()` from text-editor.tsx
- Move `getSafeContent()`, `checkHasContent()`, `getMessageImages()` from ui-registry/lib/thread-hooks.ts

```pseudo
// content-transforms.ts
function convertContentToMarkdown(content):
  if not content: return ""
  if string: return content
  if ReactElement: return ""
  if array:
    parts = []
    for item in content:
      if item.type === "text": parts.push(item.text)
      if item.type === "resource":
        encodedUri = encodeURIComponent(item.resource.uri)
        parts.push(`[${displayName}](tambo-resource://${encodedUri})`)
    return parts.join(" ")

// draft-persistence.ts
const STORAGE_KEY = "tambo.components.messageInput.draft"

function getStorageKey(threadId):
  return `${STORAGE_KEY}.${threadId}`

function saveDraft(threadId, value):
  if value === undefined:
    sessionStorage.removeItem(getStorageKey(threadId))
  else:
    sessionStorage.setItem(key, JSON.stringify({ rawQuery: value }))

function loadDraft(threadId):
  stored = sessionStorage.getItem(getStorageKey(threadId))
  try: return JSON.parse(stored).rawQuery ?? ""
  catch: return ""

// format-tool-result.ts
function formatToolResult(result):
  if result is string:
    try parse as JSON, pretty-print
    catch: return original string
  else:
    return JSON.stringify(result, null, 2)

// get-tool-status-message.ts
function getToolStatusMessage(status):
  match status:
    PENDING -> "Running..."
    COMPLETED -> "Completed"
    ERROR -> "Failed"
    _ -> throw "Unknown status"
```

### Step 4: Simple Stateless Hooks

Create hooks that compute derived state without managing their own state.

**Files:**

- `packages/react-ui-base/src/message/use-message-content.ts` (NEW)
- `packages/react-ui-base/src/message/use-tool-response.ts` (NEW)
- `packages/react-ui-base/src/message-input/use-keyboard-shortcut.ts` (NEW)

**Key Implementation Details:**

- `useMessageContent`: Memoizes markdown conversion, checks hasContent, extracts images
- `useToolResponse`: Finds associated tool response in thread messages, computes status message
- `useKeyboardShortcut`: Abstracts document.addEventListener pattern for shortcuts

```pseudo
// use-message-content.ts
function useMessageContent({ content, enableMarkdown = true }):
  markdownContent = useMemo(() => convertContentToMarkdown(content), [content])
  hasContent = useMemo(() => checkHasContent(content), [content])
  images = useMemo(() => getMessageImages(content), [content])
  return { markdownContent, hasContent, images }

// use-tool-response.ts
function useToolResponse({ message, threadMessages }):
  toolCallRequest = getToolCallRequest(message)

  associatedToolResponse = useMemo(() => {
    if no threadMessages: return null
    currentIndex = threadMessages.findIndex(m => m.id === message.id)
    if currentIndex === -1: return null

    for i from currentIndex + 1 to length:
      nextMessage = threadMessages[i]
      if nextMessage.role === "tool": return nextMessage
      if nextMessage.role === "assistant" and hasToolCall: break
    return null
  }, [message, threadMessages])

  return { toolCallRequest, associatedToolResponse, ... }

// use-keyboard-shortcut.ts
function useKeyboardShortcut(shortcut, callback, options = {}):
  useEffect(() => {
    handler = (event) => {
      if matchesShortcut(event, shortcut):
        event.preventDefault()
        callback()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [shortcut, callback])
```

### Step 5: Stateful Resource/Prompt Hooks

Extract the MCP resource and prompt merging logic with debouncing.

**Files:**

- `packages/react-ui-base/src/resources/use-combined-resources.ts` (NEW)
- `packages/react-ui-base/src/resources/use-combined-prompts.ts` (NEW)

**Key Implementation Details:**

- Extract `useCombinedResourceList()` from message-input.tsx
- Extract `useCombinedPromptList()` from message-input.tsx
- Parameterize debounce duration (default 200ms)
- Handle async provider search with cancellation
- Primitives must not import icon/UI libraries (e.g. `lucide-react`). Return stable keys/metadata and map to UI elements in `ui-registry`.

```pseudo
// use-combined-resources.ts
function useCombinedResourceList({ externalProvider, search, debounceMs = 200 }):
  { data: mcpResources } = useTamboMcpResourceList(search)
  [debouncedSearch] = useDebounce(search, debounceMs)

  mcpItems = useMemo(() =>
    mcpResources?.map(entry => ({
      id: entry.resource.uri,
      name: entry.resource.name ?? entry.resource.uri,
      iconKey: "mcp-resource",
      componentData: { type: "mcp-resource", data: entry }
    })) ?? []
  , [mcpResources])

  [externalItems, setExternalItems] = useState([])

  useEffect(() => {
    if no externalProvider:
      setExternalItems([])
      return

    cancelled = false
    externalProvider.search(debouncedSearch)
      .then(items => { if not cancelled: setExternalItems(items) })
      .catch(() => { if not cancelled: setExternalItems([]) })

    return () => { cancelled = true }
  }, [externalProvider, debouncedSearch])

  return useMemo(() => {
    filteredExternal = filterResourceItems(externalItems, search)
    return dedupeResourceItems([...mcpItems, ...filteredExternal])
  }, [mcpItems, externalItems, search])
```

### Step 6: Auto-Scroll Hook

Extract the scroll behavior with user override detection.

**Files:**

- `packages/react-ui-base/src/scroll/use-tambo-auto-scroll.ts` (NEW)
- `packages/react-ui-base/src/scroll/use-tambo-auto-scroll.test.ts` (NEW)

**Key Implementation Details:**

- Extract logic from `scrollable-message-container.tsx`
- Track user scroll position to disable auto-scroll when user scrolls up
- Re-enable when user scrolls to bottom
- Handle both streaming and non-streaming modes

```pseudo
// use-tambo-auto-scroll.ts
function useTamboAutoScroll({ containerRef, dependencies, isStreaming }):
  [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  lastScrollTopRef = useRef(0)

  handleScroll = useCallback(() => {
    if no containerRef.current: return

    { scrollTop, scrollHeight, clientHeight } = containerRef.current
    isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 8

    // User scrolled up - disable autoscroll
    if scrollTop < lastScrollTopRef.current:
      setShouldAutoScroll(false)
    // User is at bottom - enable autoscroll
    else if isAtBottom:
      setShouldAutoScroll(true)

    lastScrollTopRef.current = scrollTop
  }, [])

  scrollToBottom = useCallback(() => {
    if containerRef.current:
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth"
      })
  }, [containerRef])

  // Auto-scroll effect
  useEffect(() => {
    if containerRef.current and shouldAutoScroll:
      if isStreaming:
        requestAnimationFrame(scrollToBottom)
      else:
        timeout = setTimeout(scrollToBottom, 50)
        return () => clearTimeout(timeout)
  }, [dependencies, isStreaming, shouldAutoScroll, scrollToBottom])

  return { shouldAutoScroll, scrollToBottom, handleScroll }
```

### Step 7: Message Input State Hook

Extract the core message input state management.

**Files:**

- `packages/react-ui-base/src/message-input/use-message-input-state.ts` (NEW)

**Key Implementation Details:**

- Handles draft persistence (load on mount, save on change)
- Manages submit/error states
- Separates `value` from `displayValue` for optimistic updates
- Handles submission with error recovery

```pseudo
// use-message-input-state.ts
function useMessageInputState({ threadId, onSubmit, persistDrafts = true }):
  [value, setValue] = useState("")
  [displayValue, setDisplayValue] = useState("")
  [submitError, setSubmitError] = useState<string | null>(null)
  [imageError, setImageError] = useState<string | null>(null)
  [isSubmitting, setIsSubmitting] = useState(false)

  // Load draft on mount
  useEffect(() => {
    if not persistDrafts: return
    storedValue = loadDraft(threadId)
    if storedValue: setValue(storedValue)
  }, [threadId, persistDrafts])

  // Sync display value and persist
  useEffect(() => {
    setDisplayValue(value)
    if persistDrafts: saveDraft(threadId, value)
  }, [value, threadId, persistDrafts])

  handleSubmit = useCallback(async (e, resourceNames) => {
    e.preventDefault()
    if not value.trim() or isSubmitting: return

    setSubmitError(null)
    setImageError(null)
    setDisplayValue("")
    saveDraft(threadId) // clear draft
    setIsSubmitting(true)

    try:
      await onSubmit({ value, resourceNames })
      setValue("")
    catch error:
      setDisplayValue(value)
      setSubmitError(error.message ?? "Failed to send message")
    finally:
      setIsSubmitting(false)
  }, [value, isSubmitting, threadId, onSubmit])

  clearErrors = useCallback(() => {
    setSubmitError(null)
    setImageError(null)
  }, [])

  return {
    value, setValue,
    displayValue, setDisplayValue,
    submitError, setSubmitError,
    imageError, setImageError,
    isSubmitting,
    handleSubmit,
    clearErrors
  }
```

### Step 8: Thread Management & Suggestion Hooks

Extract thread and suggestion logic.

**Files:**

- `packages/react-ui-base/src/thread/use-thread-management.ts` (NEW)
- `packages/react-ui-base/src/thread/use-suggestion-merge.ts` (NEW)

**Key Implementation Details:**

- Wraps `startNewThread` and `switchCurrentThread` with error handling
- Provides loading states
- Combines initial suggestions with generated ones

```pseudo
// use-thread-management.ts
function useThreadManagement({ onThreadChange }):
  { switchCurrentThread, startNewThread } = useTamboThread()
  { refetch } = useTamboThreadList()

  handleNewThread = useCallback(async () => {
    try:
      await startNewThread()
      await refetch()
      onThreadChange?.()
    catch error:
      console.error("Failed to create new thread:", error)
      throw error
  }, [startNewThread, refetch, onThreadChange])

  handleSwitchThread = useCallback(async (threadId) => {
    try:
      switchCurrentThread(threadId)
      onThreadChange?.()
    catch error:
      console.error("Failed to switch thread:", error)
      throw error
  }, [switchCurrentThread, onThreadChange])

  return { handleNewThread, handleSwitchThread }

// use-suggestion-merge.ts
function useSuggestionMerge({
  threadMessages,
  initialSuggestions = [],
  generatedSuggestions,
  maxSuggestions = 3
}):
  return useMemo(() => {
    // Only use pre-seeded suggestions if thread is empty
    if not threadMessages?.length and initialSuggestions.length > 0:
      return initialSuggestions.slice(0, maxSuggestions)
    // Otherwise use generated suggestions
    return generatedSuggestions
  }, [threadMessages?.length, generatedSuggestions, initialSuggestions, maxSuggestions])
```

### Step 9: Move Hooks to @tambo-ai/react-ui-base

Move the already-separated hooks from component directories into the new package.

**Files to move (from ui-registry component directories to react-ui-base feature folders):**

- Message input hooks/utils → `packages/react-ui-base/src/message-input/`
- Message hooks/utils → `packages/react-ui-base/src/message/`
- Thread hooks → `packages/react-ui-base/src/thread/`
- Resource hooks/utils → `packages/react-ui-base/src/resources/`
- Scroll hooks → `packages/react-ui-base/src/scroll/`
- Update imports in ui-registry components to use `@tambo-ai/react-ui-base`

**Key Implementation Details:**

- This is a straightforward move since separation was already done in Step 1
- Add `@tambo-ai/react-ui-base` as dependency to ui-registry
- Keep all existing props and component API unchanged
- Re-export moved utilities from original locations with deprecation warnings (if needed)

**Migration pattern:**

```pseudo
// Before (local to component):
// packages/ui-registry/src/components/message-input/use-message-input-state.ts
export function useMessageInputState(...) { ... }

// After (in react-ui-base package):
// packages/react-ui-base/src/message-input/use-message-input-state.ts
export function useMessageInputState(...) { ... }

// Component import changes:
// Before:
import { useMessageInputState } from "./use-message-input-state";

// After:
import { useMessageInputState } from "@tambo-ai/react-ui-base";
```

### Step 10: Testing and Validation

Add comprehensive tests for all extracted functionality.

**Files:**

- All `*.test.ts` files alongside their source files
- Integration tests in showcase

**Key Implementation Details:**

- Unit tests for all pure utility functions
- Hook tests using React Testing Library's `renderHook`
- Integration tests in showcase to verify components still work
- Verify no breaking changes by running existing tests

## Out of Scope (v1)

- **Image drag-and-drop extraction** - Complex DOM event handling; keep in component for now
- **TipTap editor logic** - Tightly coupled to TipTap; text-editor.tsx remains UI-specific
- **Elicitation handling** - MCP-specific feature; extract separately if needed
- **Markdown rendering components** - Presentation-only; stay in ui-registry
- **Canvas detection hooks** - Layout-specific; remain in ui-registry for now
- **Dictation button** - Audio API-dependent; keep as lazy-loaded component
- **MCP config modal** - Complex UI; keep in ui-registry
- **Virtualized list utilities** - Future optimization, not core functionality

## Testing Strategy

1. **Unit tests for utilities** - Each pure function gets isolated tests
2. **Hook tests** - Use `@testing-library/react` renderHook for hook isolation
3. **Integration validation** - Run showcase app to verify visual/behavioral parity
4. **Regression prevention** - All existing ui-registry tests must pass unchanged

## Backwards Compatibility Requirements

1. All existing component props must continue to work
2. All existing component refs must continue to work
3. All existing CSS classes and data attributes must be preserved
4. Context APIs (MessageInputContext, MessageContext) remain available
5. Re-export moved utilities from original locations with deprecation warnings

## Acceptance Criteria

**Step 1 (In-Place Refactoring):**

- [ ] Each component has clear separation between logic (hooks) and display
- [ ] All existing tests pass without modification
- [ ] No changes to public component APIs
- [ ] Showcase app renders and functions identically

**Steps 2-10 (Subpath Export & Migration):**

- [ ] Subpath exports added to react-sdk package.json
- [ ] react-sdk builds without errors: `npm run build -w react-sdk`
- [ ] All tests pass: `npm test -w react-sdk`
- [ ] Lint passes: `npm run lint -w react-sdk`
- [ ] Subpath imports work: `import { ... } from "@tambo-ai/react-ui-base"`
- [ ] Tree-shaking works: unused exports not bundled
- [ ] All utility functions extracted and tested in isolation
- [ ] All hooks extracted and tested with renderHook
- [ ] ui-registry components import from `@tambo-ai/react-ui-base`
- [ ] No changes to component public APIs
- [ ] All existing tests pass without modification
- [ ] Showcase app renders and functions identically
- [ ] JSDoc comments on all public exports
- [ ] `useTamboAutoScroll` hook properly integrates with `useTambo()` provider
- [ ] Formatting utilities are pure functions with no React dependencies
