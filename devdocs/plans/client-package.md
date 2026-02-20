# Feature: @tambo-ai/client Package Extraction

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
  listThreads(): Promise<ThreadListResponse>;

  // Registration
  registerTool(tool: TamboTool): void;

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
  listSuggestions(
    messageId: string,
    threadId: string,
  ): Promise<SuggestionListResponse>;
  generateSuggestions(
    messageId: string,
    threadId: string,
    options?: { maxSuggestions?: number },
  ): Promise<SuggestionGenerateResponse>;
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
  tools: Record<string, TamboTool>;
}
```

### TamboStream

Two consumption modes only. The processing loop always runs internally (fire-and-forget in constructor). The `.thread` promise resolves naturally when the loop finishes — no auto-consume trigger.

```typescript
class TamboStream {
  // Async iterable: yields { event, snapshot } pairs as they arrive
  [Symbol.asyncIterator](): AsyncIterator<{
    event: AGUIEvent;
    snapshot: TamboThread;
  }>;

  // Promise that resolves when the stream completes
  readonly thread: Promise<TamboThread>;

  // Abort the stream
  abort(): void;
}
```

### ClientState

```typescript
interface ClientState {
  threadMap: Record<string, ThreadState>;
  currentThreadId: string;
}

// ThreadState from event-accumulator.ts (Map changed to Record)
interface ThreadState {
  thread: TamboThread;
  streaming: StreamingState;
  accumulatingToolArgs: Record<string, string>; // was Map<string, string>
  lastCompletedRunId?: string;
}
```

Note: `authState` is computed on access via `getAuthState()`, not stored in `ClientState`.

### BeforeRun callback

```typescript
interface BeforeRunContext {
  threadId: string | undefined;
  message: InputMessage;
  tools: Record<string, TamboTool>;
}

// The React SDK builds named context helpers on top of this:
// beforeRun collects all context helpers and merges into additionalContext
```

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
- `run()` creates TamboStream, calls `beforeRun` callback first
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
function useTambo():
  const client = useContext(TamboClientContext)

  const state = useSyncExternalStore(
    client.subscribe,
    client.getState
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
