# Feature: @tambo-ai/client Package Extraction

## Enhancement Summary

**Deepened on:** 2026-02-19
**Research agents used:** 11 (architecture-strategist, kieran-typescript-reviewer, performance-oracle, code-simplicity-reviewer, pattern-recognition-specialist, agent-native-reviewer, security-sentinel, spec-flow-analyzer, best-practices-researcher, framework-docs-researcher, vercel-react-best-practices)
**Context7 queries:** React useSyncExternalStore, Vercel AI SDK streamText/maxSteps

### Key Improvements from Research

1. **State immutability contract specified** — `getState()` must return referentially stable snapshots (critical for useSyncExternalStore)
2. **TamboStream error semantics defined** — `.thread` rejects on error, async iterator throws, synthetic RUN_ERROR dispatched
3. **Concurrency model documented** — one active run per thread, concurrent run throws, switchThread does not abort
4. **React adapter performance strategy** — selector-based hooks + getServerSnapshot for SSR
5. **Security hardening** — tool argument validation, beforeRun mutation protection, API key browser warnings
6. **Agent-native gaps closed** — added `fetchThread()`, MCP data access on MCPClient, context helpers in client
7. **maxSteps termination behavior specified**
8. **Notification batching via queueMicrotask** for streaming performance

### New Considerations Discovered

- `accumulatingToolArgs` should be excluded from public `ThreadState` type (internal streaming detail)
- TamboStream should implement `AsyncIterable<StreamEvent>` (not just `AsyncIterator`)
- Return types should use domain types (`TamboThread[]`) not SDK wrappers (`ThreadListResponse`)
- The `useMemo` dependency array for client creation must include all config props, not just `apiKey`
- `getServerSnapshot` (3rd arg) is required for SSR with `useSyncExternalStore`
- Pending streaming message optimization avoids O(n) array copies per token

## Overview

Extract all framework-agnostic business logic from `@tambo-ai/react` (react-sdk) into a new `@tambo-ai/client` package at `packages/client/`. This gives non-React consumers (Node.js CLI apps, Vue, Svelte, etc.) access to Tambo's streaming, tool execution, and thread management without React dependencies. The react-sdk is then refactored to become a thin React adapter layer on top of `@tambo-ai/client`.

## Key Design Decisions

- **Wraps @tambo-ai/typescript-sdk internally**: The REST client is an implementation detail, declared as a regular `dependency` (not devDependency) since its types leak through re-exports. Consumers only install `@tambo-ai/client`.
- **Client owns its state directly**: `TamboClient` has `getState()` and `subscribe()` methods directly on it. No separate `TamboStore` interface or `InMemoryStore` class in the public API. React adapter uses `useSyncExternalStore(client.subscribe, client.getState)`.
- **TamboStream**: Two consumption modes only. (1) Async iterable yielding `{ event, snapshot }` pairs. (2) `.thread` promise property that resolves when the stream completes. The processing loop always runs internally — `.thread` never triggers a separate consumption path.
- **Stitchable stream for tool loops**: Multi-step tool execution uses a single outer `AsyncIterable` that appends inner continuation streams dynamically, so consumers see one unbroken stream.
- **Component types use typescript-sdk directly**: No new `AvailableComponent` type. The API types from `@tambo-ai/typescript-sdk` are sufficient for component metadata.
- **Minimal public API**: Export `TamboClient`, `TamboStream`, and the types consumers actually reference. Internal utilities (reducer, schema converters, etc.) are not public.
- **`TamboClient` is a class, not an interface**: No separate interface. Consumers mock it directly in tests.

### Research Insights: Design Decisions

**Precedent alignment (Zustand, Redux, Vercel AI SDK):**

- The `getState()` + `subscribe()` pattern matches Zustand's `StoreApi` interface exactly: `{ getState, subscribe, setState }`. This is the canonical contract for `useSyncExternalStore`.
- Vercel AI SDK uses the same core/adapter split: `ai` (framework-agnostic) + `@ai-sdk/react` (React hooks). Their `streamText()` returns a dual-interface object (async iterable + promise properties), matching our `TamboStream` design.
- The fire-and-forget processing loop in TamboStream's constructor matches the pattern used by Vercel's `StreamTextResult` — stream processing starts immediately and results accumulate into promise properties.

**State immutability contract (CRITICAL):**

`useSyncExternalStore` compares `getState()` return values using `Object.is`. This requires:

1. `getState()` returns the **exact same reference** when state hasn't changed
2. The reducer produces **new objects immutably** (spread/structuredClone) when state changes
3. Only the changed `ThreadState` in `threadMap` gets a new reference — other threads keep their old reference (structural sharing)

```typescript
// CORRECT: Only replace the changed thread's state
return {
  ...state,
  threadMap: {
    ...state.threadMap,
    [threadId]: updatedThreadState, // new ref only for this thread
  },
};
```

**Concurrency model (must specify before implementation):**

- One active stream per thread. Calling `run()` on a thread with an active stream throws.
- `switchThread()` does NOT abort the active stream on the previous thread. It only changes `currentThreadId`. The old thread's stream continues processing in the background.
- Multiple threads CAN stream concurrently (each has independent state in `threadMap`).
- `startNewThread()` is purely local — generates a placeholder ID, migrated to a real server ID on first `run()`.

## Architecture

```
Consumer Code (CLI, Node.js, etc.)
     |
     v
+------------------+        +---------------------+
| @tambo-ai/react  |------->| @tambo-ai/client    |
| (thin adapter)   |        | (business logic)    |
|                  |        |                     |
| - useTambo()     |        | - TamboClient class |
| - TamboProvider  |        | - TamboStream       |
| - Component      |        | - Event accumulator |
|   rendering      |        | - Tool executor     |
| - useSyncExternalStore    | - MCPClient         |
| - MCP React hooks|        | - Suggestions API   |
| - Suggestions RQ |        | - Auth state        |
| - Thread naming  |        |                     |
+------------------+        +--------|------------+
                                     |
                                     v
                            +---------------------+
                            | @tambo-ai/typescript-sdk |
                            | (dependency, not     |
                            |  re-exported)        |
                            +---------------------+
```

**Data Flow (run)**:

1. `client.run("hello")` -> creates API stream via typescript-sdk
2. Stream events flow through `handleEventStream` -> `streamReducer`
3. Reducer updates client internal state (threadMap, currentThreadId)
4. If `autoExecuteTools: true`, awaiting_input triggers tool execution + continuation stream (stitched into outer stream)
5. React: `useSyncExternalStore(client.subscribe, client.getState)` triggers re-renders

## Component Schema/Interface

### TamboClient (main entry point)

```typescript
class TamboClient {
  constructor(options: TamboClientOptions);

  // Core operations
  run(message: string | InputMessage, options?: RunOptions): TamboStream;

  // Thread management
  switchThread(threadId: string): Promise<void>;
  startNewThread(): string;
  getThread(threadId: string): TamboThread | undefined;
  listThreads(): Promise<TamboThread[]>; // unwrap SDK response type
  fetchThread(threadId: string): Promise<TamboThread>; // load from API (not just local cache)

  // Registration
  registerTool(tool: TamboTool): void;
  registerTools(tools: TamboTool[]): void;

  // State access (useSyncExternalStore-compatible)
  getState(): ClientState;
  subscribe(listener: () => void): () => void;

  // Auth
  getAuthState(): TamboAuthState;

  // Run control
  cancelRun(threadId?: string): Promise<void>;

  // Thread naming (API wrapper only — auto-naming logic stays in react-sdk)
  updateThreadName(threadId: string, name: string): Promise<void>;
  generateThreadName(threadId: string): Promise<string>;

  // MCP
  connectMcpServer(serverInfo: McpServerInfo): Promise<MCPClient>;
  disconnectMcpServer(serverKey: string): Promise<void>;
  getMcpClients(): Record<string, MCPClient>;
  getMcpToken(
    contextKey: string,
  ): Promise<{ mcpAccessToken: string; tamboBaseUrl: string }>;

  // Suggestions
  listSuggestions(messageId: string, threadId: string): Promise<Suggestion[]>; // unwrap SDK response type
  generateSuggestions(
    messageId: string,
    threadId: string,
    options?: { maxSuggestions?: number },
  ): Promise<Suggestion[]>; // unwrap SDK response type

  // Context helpers (for agent consumers)
  addContextHelper(name: string, fn: ContextHelperFn): void;
  removeContextHelper(name: string): void;
}

interface TamboClientOptions {
  apiKey: string;
  tamboUrl?: string;
  environment?: "production" | "staging";
  userKey?: string;
  userToken?: string;

  // Tool registration
  tools?: TamboTool[];

  // MCP servers to connect on init
  mcpServers?: McpServerInfo[];

  // Called before each run — can modify additionalContext
  beforeRun?: (context: BeforeRunContext) => MaybeAsync<void>;
}

interface RunOptions {
  threadId?: string;
  autoExecuteTools?: boolean;
  maxSteps?: number; // default 10, safety limit for tool loops
  toolChoice?: ToolChoice;
  debug?: boolean;
  additionalContext?: Record<string, unknown>;
  signal?: AbortSignal;
}

interface BeforeRunContext {
  threadId: string | undefined;
  message: InputMessage;
  tools: Readonly<Record<string, TamboTool>>; // frozen — cannot mutate tools
}
```

**Research Insights: TamboClient API**

- **Return domain types, not SDK wrappers**: `listThreads()` returns `TamboThread[]` not `ThreadListResponse`. `listSuggestions()` returns `Suggestion[]` not `SuggestionListResponse`. This decouples the public API from typescript-sdk response shapes.
- **`fetchThread(threadId)`**: Added per agent-native review. `getThread()` only reads local cache; CLI agents need to hydrate from the server to resume conversations.
- **`registerTools(tools[])`**: Added per agent-native review for batch registration convenience.
- **`addContextHelper` / `removeContextHelper`**: Moved from react-sdk-only to client. Agents need automatic context injection (current time, environment, etc.) on every `run()` call. The client calls all registered helpers before each run and merges results into `additionalContext`.
- **Naming convention**: `get*` reads local state (sync), `list*`/`fetch*` calls API (async). `getMcpToken` should be renamed to `fetchMcpToken` to signal the network call.
- **`environment` vs `tamboUrl`**: Validate at construction — throw if both are provided (they conflict).
- **`beforeRun` semantics**: (1) Always awaited (even if sync). (2) `tools` is frozen/readonly — cannot mutate. (3) If it throws, the run is aborted and the error propagates to the caller. (4) No timeout in v1.
- **Concurrent run guard**: `run()` throws if a run is already active on the target thread. Track active runs per thread internally.

### TamboStream

Two consumption modes only. The processing loop always runs internally (fire-and-forget in constructor). The `.thread` promise resolves naturally when the loop finishes — no auto-consume trigger.

```typescript
/** Yielded by the async iterator on each event */
interface StreamEvent {
  event: AGUIEvent;
  snapshot: TamboThread;
}

class TamboStream implements AsyncIterable<StreamEvent> {
  // Async iterable: yields StreamEvent pairs as they arrive
  [Symbol.asyncIterator](): AsyncIterableIterator<StreamEvent>;

  // Promise that resolves when the stream completes, rejects on error
  readonly thread: Promise<TamboThread>;

  // Abort the stream
  abort(): void;
}
```

**Research Insights: TamboStream**

**Error semantics (CRITICAL — must be implemented exactly):**

- When the processing loop catches an error (network, tool failure, unexpected event):
  1. A synthetic `RUN_ERROR` event is dispatched to the reducer (updates thread state)
  2. `.thread` **rejects** with the error
  3. The async iterator **throws** on the next `next()` call
  4. The error is stored as `this.error` on the stream for late inspection
- When `abort()` is called:
  1. The AbortController fires, stream closes
  2. `.thread` **rejects** with an `AbortError`
  3. The async iterator ends cleanly (returns `{ done: true }`)
  4. Thread state transitions to `idle`

**Processing loop error handling pattern (from best-practices research):**

```typescript
class TamboStream {
  private error: Error | null = null;

  constructor(/* ... */) {
    void this.processLoop().catch((err) => {
      this.error = err;
      this.rejectThread(err);
      this.closeEventQueue();
    });
  }
}
```

Always catch at the top level AND inside the loop. Belt and suspenders.

**maxSteps behavior:** When `maxSteps` is reached, the stream resolves normally (does not throw). The thread may have pending tool calls unresolved. A warning is logged. This matches Vercel AI SDK's `stopWhen: stepCountIs(N)` behavior.

**Single consumption:** The async iterator can only be iterated once (like ReadableStream). Document this. The internal processing loop and the external iterator observe from the same event queue.

**Stitchable stream edge cases to test:** (a) error in first stream, (b) error in continuation stream, (c) abort during tool execution, (d) abort before any tool executes, (e) empty tool results, (f) multiple sequential tool calls.

### ClientState

```typescript
interface ClientState {
  threadMap: Record<string, ThreadState>;
  currentThreadId: string;
}

// Public ThreadState — excludes internal streaming details
interface ThreadState {
  thread: TamboThread;
  streaming: StreamingState;
  lastCompletedRunId?: string;
}

// Internal ThreadState — used inside the reducer only
//
// Important: we should avoid projecting/sanitizing state inside `getState()`, because
// `useSyncExternalStore` relies on referential stability of the returned snapshot.
//
// Instead, store internal-only fields on the same runtime object using a non-exported
// `unique symbol` key. This keeps internal fields out of the public `.d.ts` surface,
// while preserving structural sharing + reference stability.
//
// Note: this is not a security boundary (someone can still discover symbol keys via
// reflection), but it does make the internal fields non-obvious and non-addressable
// via normal property access.
const accumulatingToolArgsKey: unique symbol = Symbol("accumulatingToolArgs");

type InternalThreadState = ThreadState & {
  [accumulatingToolArgsKey]: Record<string, string>; // was Map<string, string>
};
```

Note: `authState` is computed on access via `getAuthState()`, not stored in `ClientState`.

**Research Insights: ClientState**

- **`accumulatingToolArgs` excluded from public ThreadState**: This is internal streaming state that accumulates partial JSON during tool argument streaming. Exposing it leaks implementation details that consumers should never depend on. Store it on the same runtime object under a non-exported `unique symbol` key so `getState()` can return the internal state _as-is_ (preserving referential stability) without exposing the field in the public type surface.
- **Structural sharing**: When the reducer updates a thread, only that thread's `ThreadState` gets a new reference. Other threads keep their old references. This enables selector-based subscription in the React adapter — a component reading thread A does not re-render when thread B changes.
- **Notification batching**: During high-frequency streaming (100+ events/sec), batch subscriber notifications via `queueMicrotask`:

```typescript
private pendingNotification = false;
private notifyListeners(): void {
  if (!this.pendingNotification) {
    this.pendingNotification = true;
    queueMicrotask(() => {
      this.pendingNotification = false;
      for (const listener of this.listeners) {
        listener();
      }
    });
  }
}
```

This collapses multiple rapid state updates into one notification per microtask tick, reducing React re-renders from 100+/sec to ~60/sec without losing any data.

### BeforeRun callback

```typescript
interface BeforeRunContext {
  threadId: string | undefined;
  message: InputMessage;
  tools: Readonly<Record<string, TamboTool>>; // frozen, cannot mutate
}

// The React SDK builds named context helpers on top of this:
// beforeRun collects all context helpers and merges into additionalContext
```

**Research Insights: BeforeRun**

- **Mutation protection (security)**: Pass a frozen/readonly copy of `tools` to prevent malicious or buggy callbacks from redirecting tool execution. Shallow-clone `message` before passing.
- **Async handling**: `run()` is sync (returns TamboStream immediately). The `beforeRun` callback is awaited inside the processing loop before the first API call, not in `run()` itself. This means `beforeRun` can be async without blocking `run()`.
- **Error contract**: If `beforeRun` throws, the run is aborted. `.thread` rejects with the error. The async iterator throws.
- **Context helper integration**: The client calls all registered context helpers (from `addContextHelper()`) during the beforeRun phase, merging their results into `additionalContext`. The user's `beforeRun` callback runs after context helpers.

## File Structure

```
packages/client/
  package.json (NEW)
  tsconfig.json (NEW)
  tsconfig.cjs.json (NEW)
  tsconfig.esm.json (NEW)
  tsconfig.test.json (NEW)
  jest.config.ts (NEW)
  eslint.config.mjs (NEW)
  src/
    index.ts (NEW) - public API exports (minimal)
    tambo-client.ts (NEW) - TamboClient class
    tambo-stream.ts (NEW) - TamboStream class
    types/
      thread.ts (MOVED from react-sdk, remove ReactElement dep)
      message.ts (MOVED, split: base types here, React-specific stays)
      event.ts (MOVED as-is)
      auth.ts (MOVED as-is)
      tool-choice.ts (MOVED as-is)
    utils/
      event-accumulator.ts (MOVED, Map -> Record in ThreadState)
      stream-handler.ts (MOVED as-is)
      tool-executor.ts (MOVED, remove React dep from TamboTool import)
      tool-call-tracker.ts (MOVED as-is)
      keyed-throttle.ts (MOVED as-is)
      registry-conversion.ts (MOVED, use typescript-sdk types for components)
      unstrictify.ts (MOVED as-is)
      json-patch.ts (MOVED as-is)
      thread-utils.ts (MOVED as-is)
      send-message.ts (NEW) - extracted from use-tambo-v1-send-message.ts
    schema/
      schema.ts (MOVED as-is)
      json-schema.ts (MOVED as-is)
      standard-schema.ts (MOVED as-is)
    model/
      component-metadata.ts (MOVED, split React parts out)
      mcp-server-info.ts (MOVED as-is)
    mcp/
      mcp-client.ts (MOVED as-is)
      mcp-constants.ts (MOVED as-is)
      elicitation.ts (MOVED, types + pure helpers only)
      index.ts (NEW) - MCP module exports

react-sdk/
  src/v1/
    types/
      message.ts (MODIFIED - re-export from client + add renderedComponent)
      thread.ts (MODIFIED - re-export from client)
      event.ts (MODIFIED - re-export from client)
      auth.ts (MODIFIED - re-export from client)
    utils/
      event-accumulator.ts (DELETED - imported from client internally)
      stream-handler.ts (DELETED - imported from client internally)
      tool-executor.ts (DELETED - imported from client internally)
      tool-call-tracker.ts (DELETED - imported from client internally)
      keyed-throttle.ts (DELETED - imported from client internally)
      registry-conversion.ts (DELETED - imported from client internally)
      unstrictify.ts (DELETED - imported from client internally)
      json-patch.ts (DELETED - imported from client internally)
      thread-utils.ts (DELETED - imported from client internally)
    hooks/
      use-tambo-v1-send-message.ts (MODIFIED - thin wrapper calling client.run())
      use-tambo-v1.ts (MODIFIED - reads from client state via useSyncExternalStore)
      use-tambo-v1-auth-state.ts (MODIFIED - delegates to client.getAuthState())
    providers/
      tambo-v1-provider.tsx (MODIFIED - creates TamboClient, provides via context)
      tambo-v1-stream-context.tsx (MODIFIED - replaced by useSyncExternalStore on client)
  src/mcp/
    tambo-mcp-provider.tsx (MODIFIED - uses client.connectMcpServer())
    mcp-client.ts (DELETED - imported from client)
    mcp-constants.ts (DELETED - imported from client)
    elicitation.ts (MODIFIED - types from client, React hook stays)
  src/util/
    mcp-server-utils.ts (DELETED - imported from client)
  src/model/
    mcp-server-info.ts (DELETED - imported from client)
```

## Implementation Phases

### Phase 1: Package Scaffolding

Set up the `packages/client/` directory with build configuration mirroring react-sdk's dual CJS/ESM pattern.

**Files:**

- `packages/client/package.json` (NEW) - Package manifest with dual CJS/ESM exports
- `packages/client/tsconfig.json` (NEW) - Base TypeScript config (no JSX, no React)
- `packages/client/tsconfig.cjs.json` (NEW) - CJS build config
- `packages/client/tsconfig.esm.json` (NEW) - ESM build config
- `packages/client/tsconfig.test.json` (NEW) - Test config
- `packages/client/jest.config.ts` (NEW) - Jest configuration
- `packages/client/eslint.config.mjs` (NEW) - ESLint config

**Key Implementation Details:**

- Copy build setup from react-sdk, removing all React/JSX related config
- Dependencies: `@tambo-ai/typescript-sdk` (regular dependency, not devDep — types leak through), `@ag-ui/core`, `fast-json-patch`, `partial-json`, `@standard-community/standard-json`, `@standard-schema/spec`, `type-fest`, `@modelcontextprotocol/sdk`
- Peer dependencies: `zod` (optional, for schema conversion), `zod-to-json-schema` (optional)
- No `react`, `react-dom`, or `@tanstack/react-query` dependencies
- Package name: `@tambo-ai/client`
- Add `@tambo-ai/client` as dependency of `react-sdk`

**Research Insights: Build System**

- **Stick with tsc + tsc-esm-fix** to match react-sdk. Consistency within the monorepo trumps marginal build speed gains from tsup/unbuild. The tsc approach produces declarations guaranteed to match source, and unbundled output allows consumer tree-shaking.
- **`package.json` must use `"exports"` field** with `"import"` and `"require"` conditions, and `"types"` pointing to correct `.d.ts` per format.
- **Do not ship `__dirname` or `require()`** in the ESM bundle (common mistake with dual builds).
- **Pin `@tambo-ai/typescript-sdk` to exact version** (not range) since its types leak through. Any type shape change becomes a breaking change for `@tambo-ai/client` consumers.
- **`fast-json-patch` and `partial-json` should also be pinned** to exact versions per security review (JSON parsing is an attack surface).

**Commit:** `chore(client): scaffold @tambo-ai/client package with build config`

Verify: `npm install && npm run build -w packages/client && npm run check-types -w packages/client`

---

### Phase 2: Move All Framework-Agnostic Code

Move all types, utilities, reducer, tool system, schemas, and MCP code in one pass. These files are already framework-agnostic (zero React imports). Tests move alongside their source files.

**Files:**

All files listed in the File Structure above under `packages/client/src/` that are marked MOVED.

**Key Implementation Details:**

- The event-accumulator reducer is already pure. Move as-is, but change `accumulatingToolArgs` from `Map<string, string>` to `Record<string, string>` (fixes JSON serialization, now is the time since it's a new package).
- `TamboTool` generic defaults change from `any` to `unknown`. Drop the unused `Rest` type parameter. The type becomes `TamboTool<Params = unknown, Returns = unknown>`.
- Split `TamboComponentContent`: base type in client has all fields except `renderedComponent?: ReactElement`. React-sdk extends it.
- Use typescript-sdk types directly for component metadata in API calls (no new `AvailableComponent` type).
- `registry-conversion.ts`: conversion functions accept typescript-sdk's `AvailableComponent` type.
- Move existing test files alongside their source files. Update import paths.
- MCPClient, mcp-constants, elicitation types, server utils all move as-is.
- MCP data access: MCPClient should expose `listPrompts()`, `getPrompt()`, `listResources()`, `readResource()` wrappers for agent consumers who connect to MCP servers (these are data-access primitives, not UI-specific).

**Research Insights: Phase 2**

- **`TamboTool` any→unknown is a breaking change** for react-sdk consumers. Since this is a new package, the break is clean. But the react-sdk re-export must not silently change existing consumers' types. Add a migration note.
- **`accumulatingToolArgs` Map→Record**: All `Map` method calls (`get`, `set`, `delete`, `new Map()`) must be rewritten. The existing reducer at lines 1035-1036 of `event-accumulator.ts` uses Map methods extensively.
- **Use defensive access for `Record<string, ThreadState>`**: Under `noUncheckedIndexedAccess`, `threadMap[id]` returns `ThreadState | undefined`. Write code defensively: `const threadState = state.threadMap[threadId]; if (!threadState) throw new Error(...)`.
- **Message array copy optimization**: The reducer likely spreads the entire `messages` array on every text delta token. Consider storing the in-progress streaming message separately from committed messages during streaming, merging once on `RUN_FINISHED`. This avoids O(n × t) array copies (n=messages, t=tokens).

**Commit:** `feat(client): move types, utilities, reducer, tool system, schema, and MCP code`

Verify: `npm run check-types -w packages/client && npm test -w packages/client`

---

### Phase 3: TamboStream and TamboClient

Implement the two new classes that form the public API.

**Files:**

- `packages/client/src/tambo-stream.ts` (NEW)
- `packages/client/src/tambo-client.ts` (NEW)
- `packages/client/src/utils/send-message.ts` (NEW) - core run logic extracted from use-tambo-v1-send-message.ts
- `packages/client/src/index.ts` (NEW) - public API surface

**Key Implementation Details — TamboStream:**

- Extract non-React functions from `use-tambo-v1-send-message.ts`: `createRunStream`, `dispatchUserMessage`, `dispatchToolResults`, `executeToolsAndContinue` → `send-message.ts`.
- Processing loop runs in constructor (fire-and-forget via `void this.processLoop()`).
- Loop processes events, dispatches to client state, handles tool execution if `autoExecuteTools`.
- `.thread` is a deferred promise that resolves when the loop completes. No auto-consume — the loop always runs.
- `[Symbol.asyncIterator]` yields `{ event, snapshot }` pairs by observing events as the loop emits them.
- Stitchable stream: when `awaiting_input` is detected and `autoExecuteTools` is on, tools execute, results submit, continuation stream is appended to the outer iterable seamlessly.

**Key Implementation Details — TamboClient:**

- Creates typescript-sdk client internally (`new TamboAI({...})`)
- State management: private `state: ClientState`, `listeners: Set<() => void>`. Public `getState()` and `subscribe()` methods directly on the class — useSyncExternalStore-compatible.
- `run()` is synchronous and returns a `TamboStream` immediately
- The stream's internal processing loop awaits `beforeRun` (and context helpers) before the first network call
- Thread management: `switchThread`, `startNewThread`, `getThread` operate on internal state
- Tool registration: internal `Record<string, TamboTool>`
- Auth: `getAuthState()` computes from config on each call (pure function, not stored in state)
- MCP: `connectMcpServer()`, `disconnectMcpServer()`, `getMcpClients()`, `getMcpToken()`
- Suggestions: `listSuggestions()`, `generateSuggestions()` — thin wrappers around typescript-sdk
- Thread naming: `updateThreadName()`, `generateThreadName()` — API wrappers only. Auto-naming decision logic stays in react-sdk.
- `dispatch(action)` is private: `this.state = streamReducer(this.state, action); this.notifyListeners()`

**Public API Surface (packages/client/src/index.ts):**

```typescript
// Core classes
export {
  TamboClient,
  type TamboClientOptions,
  type RunOptions,
} from "./tambo-client";
export { TamboStream } from "./tambo-stream";

// Types consumers actually reference
export type { TamboThread, RunStatus, StreamingState } from "./types/thread";
export type {
  TamboThreadMessage,
  Content,
  TextContent,
  TamboComponentContent,
  TamboToolUseContent,
  ToolResultContent,
  ResourceContent,
  InputMessage,
  MessageRole,
} from "./types/message";
export type { TamboAuthState } from "./types/auth";
export type { ToolChoice } from "./types/tool-choice";
export type { TamboTool } from "./model/component-metadata";
export type { ClientState } from "./tambo-client";

// MCP (for consumers connecting to MCP servers)
export { MCPClient } from "./mcp/mcp-client";
export type { McpServerInfo } from "./model/mcp-server-info";
export { MCPTransport } from "./model/mcp-server-info";
```

Everything else (reducer, schema utils, keyed-throttle, tool-call-tracker, etc.) is internal. The react-sdk imports from deep paths if needed.

**Research Insights: Phase 3**

- **Fire-and-forget error handling**: The `void this.processLoop()` pattern requires a top-level `.catch()` on the promise — otherwise unhandled rejections crash Node.js. The `.catch()` handler must: (1) store the error, (2) reject the `.thread` deferred, (3) close the event queue for the async iterator. This is belt-and-suspenders with the try/catch inside the loop.
- **Stitchable stream pattern (from Vercel AI SDK)**: Use a resolvable promise + pull-based queue. The outer async iterator pulls from a shared queue. When a continuation stream starts, its events are pushed into the same queue. The iterator doesn't know about stream boundaries. Implementation: `class EventQueue { push(event), close(), [Symbol.asyncIterator]() }` shared between initial and continuation streams.
- **`send-message.ts` extraction scope**: Extract `createRunStream`, `dispatchUserMessage`, `dispatchToolResults`, `executeToolsAndContinue`. Leave `useTamboSendMessage` in react-sdk as a thin wrapper that calls `client.run()` + React Query invalidation. The extracted functions should accept a `dispatch: (action) => void` callback instead of calling `useReducer` dispatch directly.
- **`run()` must be synchronous**: Returns `TamboStream` immediately (not a Promise). The `beforeRun` callback is awaited inside the processing loop. This means the TamboStream constructor kicks off an async process but `run()` itself is sync. Consumers who need to wait for `beforeRun` completion can observe the first event from the iterator.
- **AbortSignal propagation**: `RunOptions.signal` should be wired through to the typescript-sdk's fetch call AND to tool execution. When aborted: the fetch stream closes, tool execution is cancelled (if possible), `.thread` rejects with `AbortError`, iterator ends cleanly.

**Commit:** `feat(client): implement TamboClient and TamboStream`

Verify: `npm run build -w packages/client && npm run check-types -w packages/client && npm test -w packages/client`

---

### Phase 4: React SDK Refactor

Refactor react-sdk to depend on `@tambo-ai/client` and become a thin adapter layer.

**Files:**

All files listed in the File Structure above under `react-sdk/` that are marked MODIFIED or DELETED.

**Key Implementation Details:**

- `react-sdk/package.json`: add `@tambo-ai/client` as dependency
- `TamboProvider` creates a `TamboClient` instance and provides it via React context
- `useSyncExternalStore(client.subscribe, client.getState)` bridges client state to React rendering
- Thread sync (fetching messages on switch) moves from `ThreadSyncManager` to `client.switchThread()`
- `useTamboSendMessage` becomes: call `client.run()`, await `stream.thread`, handle React Query cache invalidation on success
- Auto thread naming stays in react-sdk (depends on React Query cache invalidation)
- Component rendering (`renderedComponent` on `TamboComponentContent`) stays in react-sdk's `useTambo()` hook
- Re-export backward compatibility: react-sdk's `index.ts` re-exports types from `@tambo-ai/client` so `import { TamboThread } from '@tambo-ai/react'` still works
- **MCP refactor**: `TamboMcpProvider` calls `client.connectMcpServer()` / `client.disconnectMcpServer()`. Provider still handles React lifecycle, handler updates, tool registration with React registry.
- **Suggestions refactor**: `useTamboSuggestions` calls `client.listSuggestions()` / `client.generateSuggestions()`. React Query caching and auto-generation stay in the hook.
- Existing tests update to mock client state instead of `useReducer`. Tests move alongside source. All existing react-sdk tests must still pass.

```pseudo
// tambo-v1-provider.tsx (simplified)
function TamboProvider({ apiKey, tools, components, ... }):
  const client = useMemo(() =>
    new TamboClient({ apiKey, tools, userKey, ... }), [apiKey])

  return (
    <TamboClientContext.Provider value={client}>
      <TamboRegistryProvider ...>  // still needed for React component registry
        {children}
      </TamboRegistryProvider>
    </TamboClientContext.Provider>
  )

// use-tambo-v1.ts (simplified)
const SERVER_SNAPSHOT: ClientState = { threadMap: {}, currentThreadId: "" }

function useTambo():
  const client = useContext(TamboClientContext)

  const state = useSyncExternalStore(
    client.subscribe,
    client.getState,
    () => SERVER_SNAPSHOT
  )

  const threadState = state.threadMap[state.currentThreadId]
  // ... add renderedComponent to component content (React-specific)
  // ... return messages, streaming state, etc.

// use-tambo-v1-send-message.ts (simplified)
function useTamboSendMessage():
  const client = useContext(TamboClientContext)
  const queryClient = useTamboQueryClient()

  return useTamboMutation({
    mutationFn: async (options) => {
      const stream = client.run(options.message, {
        autoExecuteTools: true,
        threadId: currentThreadId,
        ...options,
      })
      return await stream.thread
    },
    onSuccess: (thread) => {
      queryClient.invalidateQueries(["v1-threads", thread.id])
    },
  })
```

**Research Insights: Phase 4 (CRITICAL — most reviewer attention)**

- **`useMemo` dependency array must include ALL config props**: The `new TamboClient(...)` call in `TamboProvider` must depend on every prop that affects client behavior: `apiKey`, `tamboUrl`, `environment`, `userKey`, `userToken`. However, `tools` and `mcpServers` are arrays — use a ref + effect pattern to avoid recreating the client on every render:

```pseudo
// CORRECT: Stable client, dynamic tool registration
const client = useMemo(() =>
  new TamboClient({ apiKey, tamboUrl, environment, userKey, userToken }),
  [apiKey, tamboUrl, environment, userKey, userToken]
);

useEffect(() => {
  client.registerTools(tools ?? []);
}, [client, tools]);
```

- **`getServerSnapshot` is REQUIRED for SSR**: `useSyncExternalStore` takes 3 arguments: `(subscribe, getSnapshot, getServerSnapshot)`. The third argument is called during server rendering and hydration. Without it, SSR throws. Return a static empty state:

```pseudo
const SERVER_SNAPSHOT: ClientState = { threadMap: {}, currentThreadId: "" };
useSyncExternalStore(client.subscribe, client.getState, () => SERVER_SNAPSHOT);
```

- **Selector-based hooks preserve split-context performance**: The current react-sdk uses split contexts to avoid re-rendering the entire tree. With `useSyncExternalStore`, achieve the same via selectors. `useSyncExternalStore` does `Object.is` comparison on the return value — if the selector returns the same reference (structural sharing from the reducer), no re-render occurs.

- **Component rendering cache stays in React**: The `renderedComponent` field on `TamboComponentContent` is created by looking up React components in the registry and calling `React.createElement`. This MUST stay in the React layer. The client's `TamboComponentContent` type does not include `renderedComponent`. The react-sdk's `useTambo()` hook maps over messages and attaches `renderedComponent` using `useMemo`.

- **`TamboStubProvider` must also wrap a stub `TamboClient`**: Testing utilities need a mock client that returns predictable state. Either create a `TamboClient.createStub(state)` factory or let `TamboStubProvider` create a minimal mock internally.

**Commit:** `refactor(react-sdk): consume @tambo-ai/client for core business logic`

Verify: `npm run build && npm run check-types && npm run lint && npm test`

This is the most critical verification step — all existing react-sdk tests must pass after the refactor.

---

### Phase 5: New Tests + Documentation

Add tests for new code (TamboClient, TamboStream) and update docs.

**Key Implementation Details:**

- New tests for `TamboClient`: run, switchThread, startNewThread, registration, auth, MCP connect/disconnect, suggestions
- New tests for `TamboStream`: async iteration, `.thread` promise, abort, multi-step tool execution stitching
- Integration test: create a `TamboClient`, register tools, call `run()` with `autoExecuteTools: true`, verify tool loop completes
- Update `packages/client/AGENTS.md` and `packages/client/README.md`
- Update root `AGENTS.md` to document the new package

**Research Insights: Phase 5**

**Critical edge case tests identified by spec-flow-analyzer and security-sentinel:**

- **Mid-stream error recovery**: Stream fails mid-way (e.g., network drop after 5 events). Verify: `.thread` rejects, iterator throws, thread state shows error, messages accumulated before failure are preserved.
- **Tool execution timeout**: A tool hangs forever. Verify: `AbortSignal` propagation terminates the tool, stream transitions to error state.
- **maxSteps exhaustion**: Tool loop reaches maxSteps limit. Verify: stream resolves normally (not error), warning is logged, thread has pending tool calls.
- **Concurrent run rejection**: Call `run()` twice on the same thread. Verify: second call throws immediately, first stream is unaffected.
- **Abort during tool execution**: Call `abort()` while a tool is running. Verify: tool execution is cancelled, `.thread` rejects with `AbortError`, iterator ends cleanly.
- **Stitchable stream error in continuation**: First stream completes, tool executes, continuation stream fails. Verify: error propagates through the outer iterator, `.thread` rejects.
- **Empty tool results**: Tool returns `undefined`/`null`. Verify: continuation stream still fires with empty content.
- **State snapshot immutability**: After `getState()`, mutate the returned object. Verify: next `getState()` returns unmodified state (Object.freeze or deep-copy in tests).
- **Subscribe/unsubscribe during notification**: Unsubscribe inside a listener callback. Verify: no crash, remaining listeners still fire.
- **`beforeRun` throws**: Verify: `.thread` rejects, no API call is made, thread state unchanged.

**Commit:** `test(client): add tests for TamboClient and TamboStream`

Verify: `npm run build && npm run check-types && npm run lint && npm test`

---

**Final commit:** `docs: update AGENTS.md and README for @tambo-ai/client package`

## Changes from Review

The following changes were made based on review feedback:

1. **Collapsed from 10 phases to 5.** Phases 2-4 (types, utils, tools) merged into one "move all files" phase. MCP and Suggestions folded into the TamboClient phase. Tests accompany each phase instead of a separate phase at the end.
2. **Simplified TamboStream** from 5 consumption modes to 2. Dropped `.events()`, `.snapshots()`, `.messages`, `.threadId`. Just `[Symbol.asyncIterator]` + `.thread`.
3. **No pluggable store interface.** State lives directly on `TamboClient` with `getState()` + `subscribe()`. No `TamboStore<T>` interface, no `InMemoryStore` class in public API.
4. **Minimal public API.** ~15 exports instead of ~40. Internal utilities (reducer, schema, throttle, etc.) are not public.
5. **`Map<string, string>` → `Record<string, string>`** in `ThreadState.accumulatingToolArgs`.
6. **`TamboTool` defaults from `any` to `unknown`**, dropped unused `Rest` type parameter.
7. **`@tambo-ai/typescript-sdk` as regular dependency** (not devDep) since its types leak through re-exports.
8. **No auto-consume on `.thread`** — the processing loop always runs; deferred promise resolves naturally.
9. **Class only, no interface** for `TamboClient`.
10. **Removed `destroy()`** — nothing to destroy.
11. **Auth state computed on access** (`getAuthState()`), not stored in reactive state.
12. **Auto thread naming stays in react-sdk** — the client only exposes `generateThreadName()` / `updateThreadName()` as API wrappers.
13. **Use typescript-sdk types directly** for component metadata — no new `AvailableComponent` type.

## Out of Scope (v1)

- **Interactable components** - The `withTamboInteractable` HOC and `TamboInteractableProvider` are deeply React-specific. Not extractable.
- **Component state management** - `useTamboComponentState` (AI-managed component state with JSON patches) remains React-only for now.
- **Context attachments** - `TamboContextAttachmentProvider` for single-message file/image attachments stays in react-sdk.
- **Voice input** - `useTamboVoice` is a React hook using browser APIs. Stays in react-sdk.
- **React Query cache integration** - Cache invalidation stays in react-sdk since it's specific to the React Query layer.
- **Streaming component rendering** - The `ComponentRenderer`, `ComponentContentProvider`, and `useTamboCurrentMessage` are inherently React-specific.
- **defineTool overload types** - The complex `DefineToolFn` / `RegisterToolFn` overload interfaces stay in react-sdk for now; the client exports a simpler `defineTool`.
- **Server-Sent Events transport layer** - The typescript-sdk handles SSE. No need to duplicate.
- **Backwards-compatible import paths** - We will add re-exports from react-sdk so `import { X } from '@tambo-ai/react'` still works. But we won't add `@tambo-ai/react/client` subpath or similar.
- **MCP React hooks** - `useTamboMcpPromptList`, `useTamboMcpResource`, etc. stay as React Query hooks in react-sdk. The client only provides the underlying `MCPClient` class.
- **MCP React lifecycle** - `TamboMcpProvider` stays in react-sdk (manages mount/unmount, React effects for handler updates). The client provides `connectMcpServer()`/`disconnectMcpServer()` primitives.
- **Suggestions React hook** - `useTamboSuggestions` (auto-generation, React Query caching, input management) stays in react-sdk. The client provides `listSuggestions()`/`generateSuggestions()` API methods.
- **Auto thread naming logic** - The "should I generate a name?" decision + React Query cache invalidation stays in react-sdk. Client exposes `generateThreadName()` as a plain API wrapper.

### Research Insights: Out of Scope

**Items flagged by agent-native reviewer for future consideration (v2):**

- **MCP data access primitives**: `MCPClient` should eventually expose `listPrompts()`, `getPrompt()`, `listResources()`, `readResource()` as data-access methods (not just tool discovery). Agent consumers connecting to MCP servers need these. Added to Phase 2 as a note, but full implementation can wait for v2 if time-constrained.
- **Component state without React**: `useTamboComponentState` uses JSON patches to update component props. The patching logic itself is framework-agnostic — only the hook wrapper is React-specific. A future `client.getComponentState(key)` + `client.setComponentState(key, value)` could serve non-React consumers. Not blocking for v1.
- **Context attachments**: File/image attachment staging could be extracted to the client as `client.stageAttachment(file)` / `client.clearAttachments()`. The current implementation uses React state. Low priority for v1.
- **Thread export/import**: CLI agents may want to serialize a thread to JSON and restore it later. `client.exportThread(id)` / `client.importThread(json)` would enable this. Not in scope for v1 but worth noting as a natural extension.
