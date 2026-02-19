# Feature: @tambo-ai/client Package Extraction

## Overview

Extract all framework-agnostic business logic from `@tambo-ai/react` (react-sdk) into a new `@tambo-ai/client` package at `packages/client/`. This gives non-React consumers (Node.js scripts, Vue, Svelte, etc.) access to Tambo's streaming, tool execution, and thread management without React dependencies. The react-sdk is then refactored to become a thin React adapter layer on top of `@tambo-ai/client`.

## Key Design Decisions

- **Wraps @tambo-ai/typescript-sdk internally**: The REST client is an implementation detail. Consumers only install `@tambo-ai/client`. The typescript-sdk is NOT re-exported.
- **Pluggable state store**: Uses a `subscribe/getState/setState` interface (Zustand-compatible). Ships with `InMemoryStore` for Node.js. React adapter uses `useSyncExternalStore` to bridge reactivity.
- **TamboStream dual interface**: The stream returned by `run()` is both an async iterable (for event-by-event consumption) AND exposes promise-like properties (`stream.thread`, `stream.messages`) that auto-consume the stream when awaited. Follows the Vercel AI SDK pattern of deferred promise properties rather than making the object itself PromiseLike.
- **Stitchable stream for tool loops**: Multi-step tool execution uses a single outer `AsyncIterable` that appends inner continuation streams dynamically, so consumers see one unbroken stream.
- **Component types are framework-agnostic**: The client package defines `AvailableComponent` (metadata-only, no React `ComponentType`). The react-sdk extends this with the actual React component reference.

## Architecture

```
Consumer Code
     |
     v
+------------------+        +---------------------+
| @tambo-ai/react  |------->| @tambo-ai/client    |
| (thin adapter)   |        | (business logic)    |
|                  |        |                     |
| - useTambo()     |        | - TamboClient class |
| - TamboProvider  |        | - TamboStream       |
| - Component      |        | - TamboStore        |
|   rendering      |        | - Event accumulator |
| - useSyncExternalStore    | - Tool executor     |
| - MCP React hooks|        | - MCPClient         |
| - Suggestions RQ |        | - Suggestions API   |
+------------------+        | - Auth state        |
                            +--------|------------+
                                     |
                                     v
                            +---------------------+
                            | @tambo-ai/typescript-sdk |
                            | (internal, not exported) |
                            +---------------------+
```

**Data Flow (run)**:

1. `client.run("hello")` -> creates API stream via typescript-sdk
2. Stream events flow through `handleEventStream` -> `streamReducer`
3. Reducer updates `TamboStore` state (threadMap, currentThreadId)
4. If `autoExecuteTools: true`, awaiting_input triggers tool execution + continuation stream (stitched into outer stream)
5. React: `useSyncExternalStore(store.subscribe, () => store.getState().threadMap[id])` triggers re-renders

## Component Schema/Interface

### TamboClient (main entry point)

```typescript
interface TamboClientOptions {
  apiKey: string;
  tamboUrl?: string;
  environment?: "production" | "staging";
  userKey?: string;
  userToken?: string;
  store?: TamboStore<ClientState>;

  // Tool & component registration
  tools?: TamboTool[];
  components?: AvailableComponent[];

  // MCP servers to connect on init
  mcpServers?: McpServerInfo[];

  // Callbacks
  beforeRun?: (context: BeforeRunContext) => MaybeAsync<void>;

  // Thread naming
  autoGenerateThreadName?: boolean;
  autoGenerateNameThreshold?: number;
}

interface TamboClient {
  // Core operations
  run(message: string | InputMessage, options?: RunOptions): TamboStream;

  // Thread management
  switchThread(threadId: string): Promise<void>;
  startNewThread(): string;
  getThread(threadId: string): TamboThread | undefined;
  listThreads(): Promise<ThreadListResponse>;

  // Registration
  registerTool(tool: TamboTool): void;
  registerComponent(component: AvailableComponent): void;

  // State access
  getStore(): TamboStore<ClientState>;

  // Auth
  getAuthState(): TamboAuthState;

  // Run control
  cancelRun(threadId?: string): Promise<void>;

  // Thread naming
  updateThreadName(threadId: string, name: string): Promise<void>;

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

  // Cleanup
  destroy(): void;
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
```

### TamboStream

```typescript
interface TamboStream {
  // Default iteration: yields { event, snapshot } pairs
  [Symbol.asyncIterator](): AsyncIterator<{
    event: AGUIEvent;
    snapshot: TamboThread;
  }>;

  // Specialized iterators
  events(): AsyncIterable<AGUIEvent>;
  snapshots(): AsyncIterable<TamboThread>;

  // Promise-like properties (auto-consume stream when accessed)
  readonly thread: Promise<TamboThread>;
  readonly messages: Promise<TamboThreadMessage[]>;
  readonly threadId: Promise<string>;

  // Abort
  abort(): void;
}
```

### TamboStore

```typescript
interface TamboStore<T> {
  getState(): T;
  setState(next: T | ((prev: T) => T)): void;
  subscribe(listener: () => void): () => void;
}

interface ClientState {
  threadMap: Record<string, ThreadState>;
  currentThreadId: string;
  authState: TamboAuthState;
}

// ThreadState is the existing type from event-accumulator.ts
interface ThreadState {
  thread: TamboThread;
  streaming: StreamingState;
  accumulatingToolArgs: Map<string, string>;
  lastCompletedRunId?: string;
}
```

### BeforeRun callback

```typescript
interface BeforeRunContext {
  threadId: string | undefined;
  message: InputMessage;
  tools: Record<string, TamboTool>;
  components: Record<string, AvailableComponent>;
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
    index.ts (NEW) - public API exports
    tambo-client.ts (NEW) - TamboClient class
    tambo-stream.ts (NEW) - TamboStream class
    store/
      types.ts (NEW) - TamboStore interface
      in-memory-store.ts (NEW) - InMemoryStore implementation
    types/
      thread.ts (MOVED from react-sdk, remove ReactElement dep)
      message.ts (MOVED, split: base types here, React-specific stays)
      event.ts (MOVED as-is)
      auth.ts (MOVED as-is)
      component.ts (NEW) - AvailableComponent (metadata-only, no React)
      tool-choice.ts (MOVED as-is)
    utils/
      event-accumulator.ts (MOVED as-is)
      stream-handler.ts (MOVED as-is)
      tool-executor.ts (MOVED, remove React dep from TamboTool import)
      tool-call-tracker.ts (MOVED as-is)
      keyed-throttle.ts (MOVED as-is)
      registry-conversion.ts (MOVED, use client-local types)
      unstrictify.ts (MOVED as-is)
      json-patch.ts (MOVED as-is)
      thread-utils.ts (MOVED as-is)
      auth.ts (NEW) - computeAuthState() pure function
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
    suggestions.ts (NEW) - Suggestions API methods

react-sdk/
  src/v1/
    types/
      message.ts (MODIFIED - re-export from client + add renderedComponent)
      thread.ts (MODIFIED - re-export from client)
      event.ts (MODIFIED - re-export from client)
      auth.ts (MODIFIED - re-export from client)
      component.ts (MODIFIED - extends client's AvailableComponent with React ComponentType)
    utils/
      event-accumulator.ts (DELETED - re-export from client)
      stream-handler.ts (DELETED - re-export from client)
      tool-executor.ts (DELETED - re-export from client)
      tool-call-tracker.ts (DELETED - re-export from client)
      keyed-throttle.ts (DELETED - re-export from client)
      registry-conversion.ts (DELETED - re-export from client)
      unstrictify.ts (DELETED - re-export from client)
      json-patch.ts (DELETED - re-export from client)
      thread-utils.ts (DELETED - re-export from client)
    hooks/
      use-tambo-v1-send-message.ts (MODIFIED - thin wrapper calling client.run())
      use-tambo-v1.ts (MODIFIED - reads from client store via useSyncExternalStore)
      use-tambo-v1-auth-state.ts (MODIFIED - delegates to client.getAuthState())
    providers/
      tambo-v1-provider.tsx (MODIFIED - creates TamboClient, provides via context)
      tambo-v1-stream-context.tsx (MODIFIED - replaced by useSyncExternalStore on client store)
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
- `turbo.json` (MODIFIED) - Add `@tambo-ai/client` tasks

**Key Implementation Details:**

- Copy build setup from react-sdk, removing all React/JSX related config
- Dependencies: `@tambo-ai/typescript-sdk`, `@ag-ui/core`, `fast-json-patch`, `partial-json`, `@standard-community/standard-json`, `@standard-schema/spec`, `type-fest`
- Peer dependencies: `zod` (optional, for schema conversion), `zod-to-json-schema` (optional)
- No `react`, `react-dom`, or `@tanstack/react-query` dependencies
- Package name: `@tambo-ai/client`
- Add `@tambo-ai/client` as dependency of `react-sdk`
- Dependencies also include `@modelcontextprotocol/sdk` (for MCP client)

**Commit:** `chore(client): scaffold @tambo-ai/client package with build config`

Verify: `npm install && npm run build -w packages/client && npm run check-types -w packages/client`

---

### Phase 2: Core Types and State Store

Move all framework-agnostic types and implement the pluggable state store.

**Files:**

- `packages/client/src/types/thread.ts` (NEW) - TamboThread, StreamingState, RunStatus
- `packages/client/src/types/message.ts` (NEW) - Base message/content types (no ReactElement)
- `packages/client/src/types/event.ts` (NEW) - Custom event types (moved as-is)
- `packages/client/src/types/auth.ts` (NEW) - TamboAuthState union
- `packages/client/src/types/tool-choice.ts` (NEW) - ToolChoice type
- `packages/client/src/types/component.ts` (NEW) - AvailableComponent (metadata-only)
- `packages/client/src/store/types.ts` (NEW) - TamboStore interface
- `packages/client/src/store/in-memory-store.ts` (NEW) - InMemoryStore class

**Key Implementation Details:**

- Split `TamboComponentContent` into base (client) and extended (react-sdk). The base type has all fields except `renderedComponent?: ReactElement`. React-sdk re-exports and extends with the React field.
- `TamboToolUseContent` moves entirely to client (no React dependency).
- Auth state computation becomes a pure function `computeAuthState(config)` instead of a React hook.

```pseudo
class InMemoryStore<T>:
  private state: T
  private listeners: Set<() => void>

  constructor(initialState: T):
    this.state = initialState
    this.listeners = new Set()

  getState(): return this.state

  setState(next):
    const prev = this.state
    this.state = typeof next === "function" ? next(prev) : next
    if (!Object.is(prev, this.state)):
      for listener of this.listeners:
        listener()

  subscribe(listener):
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
```

**Commit:** `feat(client): add core types and pluggable state store`

Verify: `npm run check-types -w packages/client`

---

### Phase 3: Event Accumulator and Utilities

Move the reducer and all pure utility modules to the client package.

**Files:**

- `packages/client/src/utils/event-accumulator.ts` (NEW) - Moved as-is (already framework-agnostic)
- `packages/client/src/utils/stream-handler.ts` (NEW) - Moved as-is
- `packages/client/src/utils/keyed-throttle.ts` (NEW) - Moved as-is
- `packages/client/src/utils/json-patch.ts` (NEW) - Moved as-is
- `packages/client/src/utils/unstrictify.ts` (NEW) - Moved as-is
- `packages/client/src/utils/thread-utils.ts` (NEW) - Moved as-is
- `packages/client/src/utils/auth.ts` (NEW) - Pure `computeAuthState()` function
- `packages/client/src/schema/schema.ts` (NEW) - Schema conversion utilities
- `packages/client/src/schema/json-schema.ts` (NEW) - JSON schema helpers
- `packages/client/src/schema/standard-schema.ts` (NEW) - Standard Schema detection

**Key Implementation Details:**

- The event-accumulator reducer is already pure (no React imports). Its `StreamState`, `ThreadState`, `StreamAction` types and `streamReducer` function move directly.
- Adapt the reducer to work with `TamboStore`: instead of being called via `useReducer`, it will be called by `store.setState(prev => streamReducer(prev, action))`.
- The `dispatch` concept becomes a method on TamboClient that calls `store.setState`.
- Move `model/component-metadata.ts` types that don't depend on React `ComponentType`. The `TamboTool` interface stays mostly the same (it doesn't actually use React types). The `TamboComponent` interface splits: client gets `AvailableComponent`, react-sdk keeps `TamboComponent extends AvailableComponent`.

**Commit:** `feat(client): move event accumulator, reducer, and pure utilities`

Verify: `npm run check-types -w packages/client && npm test -w packages/client` (moved tests should pass)

---

### Phase 4: Tool System

Move tool tracking, execution, and registry conversion to the client package.

**Files:**

- `packages/client/src/utils/tool-call-tracker.ts` (NEW) - Moved from react-sdk
- `packages/client/src/utils/tool-executor.ts` (NEW) - Moved, adapted imports
- `packages/client/src/utils/registry-conversion.ts` (NEW) - Moved, uses client-local types
- `packages/client/src/model/component-metadata.ts` (NEW) - TamboTool, SupportedSchema, etc.

**Key Implementation Details:**

- `TamboTool` import chain: currently `tool-executor.ts` imports from `../../model/component-metadata` which has `ComponentType<any>` from React. Split: the `TamboTool` interface and related tool types move to client (they don't actually reference React). The `TamboComponent` and `RegisteredComponent` interfaces that use `ComponentType<any>` stay in react-sdk.
- `tool-executor.ts` needs the `TamboTool` type -- this is fine since `TamboTool.tool` is just `(params) => MaybeAsync<Returns>`, no React.
- `registry-conversion.ts` references `RegisteredComponent` which has `ComponentType`. The conversion functions will accept the base `AvailableComponent` interface instead. React-sdk passes its `RegisteredComponent` (which extends `AvailableComponent`).

**Commit:** `feat(client): move tool system (tracker, executor, registry conversion)`

Verify: `npm run check-types -w packages/client && npm test -w packages/client`

---

### Phase 5: TamboStream

Implement the dual async-iterable/promise-property stream class.

**Files:**

- `packages/client/src/tambo-stream.ts` (NEW) - TamboStream class
- `packages/client/src/utils/send-message.ts` (NEW) - Core run logic extracted from use-tambo-v1-send-message.ts

**Key Implementation Details:**

- Extract the non-React functions from `use-tambo-v1-send-message.ts`: `createRunStream`, `dispatchUserMessage`, `dispatchToolResults`, `shouldGenerateThreadName`, `executeToolsAndContinue`. These become standalone functions in `send-message.ts`.
- TamboStream wraps the core streaming loop (the `while(true)` from the mutation function).

```pseudo
class TamboStream:
  private controller: ReadableStreamController
  private consumed = false
  private threadDeferred = createDeferredPromise<TamboThread>()
  private messagesDeferred = createDeferredPromise<TamboThreadMessage[]>()
  private threadIdDeferred = createDeferredPromise<string>()
  private eventQueue: AGUIEvent[] = []
  private snapshotFn: () => TamboThread  // reads from store

  // Start processing in constructor (fire-and-forget)
  constructor(streamPromise, store, dispatch, options):
    void this.processStream(streamPromise, store, dispatch, options)

  private async processStream(...):
    // The while(true) loop from use-tambo-v1-send-message.ts
    // On each event: dispatch to store, push to eventQueue
    // On awaiting_input + autoExecuteTools: execute tools, stitch continuation
    // On completion: resolve deferred promises

  // Default iterator: { event, snapshot } pairs
  async *[Symbol.asyncIterator]():
    yield* this.iteratePairs()

  events(): return async iterable filtering to just events
  snapshots(): return async iterable filtering to just snapshots

  get thread(): Promise<TamboThread>:
    // Auto-consume stream if not already consumed
    if !this.consumed: void this.consumeStream()
    return this.threadDeferred.promise

  get messages(): ...similar...
  get threadId(): ...similar...
```

**Commit:** `feat(client): implement TamboStream with dual async-iterable/promise interface`

Verify: `npm run check-types -w packages/client && npm test -w packages/client`

---

### Phase 6: MCP Integration

Move the framework-agnostic MCP business logic to the client package. The MCP client, server utilities, elicitation types, and tool discovery are all pure TypeScript with zero React dependencies.

**Files:**

- `packages/client/src/mcp/mcp-client.ts` (MOVED) - MCPClient class (zero React deps)
- `packages/client/src/mcp/mcp-constants.ts` (MOVED) - Constants + ServerType enum
- `packages/client/src/mcp/elicitation.ts` (MOVED) - Elicitation types + pure helpers
- `packages/client/src/mcp/index.ts` (NEW) - MCP module exports
- `packages/client/src/utils/mcp-server-utils.ts` (MOVED) - deriveServerKey, normalizeServerInfo, deduplicateMcpServers
- `packages/client/src/model/mcp-server-info.ts` (MOVED) - McpServerInfo, NormalizedMcpServerInfo, MCPTransport

**Key Implementation Details:**

- `MCPClient` class is completely framework-agnostic: `listTools()`, `callTool()`, handler management, lifecycle
- All MCP types move: `MCPElicitationHandler`, `MCPSamplingHandler`, `MCPHandlers`, `MCPToolSpec`, `MCPToolCallResult`, `MCPTransport`, `ServerType`
- Pure utility functions move: `deriveServerKey()`, `normalizeServerInfo()`, `deduplicateMcpServers()`, `getMcpServerUniqueKey()`
- Elicitation types + type guards move: `TamboElicitationRequest`, `TamboElicitationResponse`, `ElicitationContextState`, `toElicitationRequestedSchema()`, `hasRequestedSchema()`
- Add `@modelcontextprotocol/sdk` as dependency of `@tambo-ai/client`
- `TamboClient` gains MCP methods:
  - `connectMcpServer(serverInfo: McpServerInfo): Promise<MCPClient>` - connect and discover tools
  - `disconnectMcpServer(serverKey: string): Promise<void>` - disconnect and unregister tools
  - `getMcpClients(): Record<string, MCPClient>` - access connected clients
- MCP token exchange logic (the API call `client.beta.auth.getMcpToken()`) moves to TamboClient as `getMcpToken(contextKey)`
- React-sdk keeps: `TamboMcpProvider` (React lifecycle), `mcp-hooks.ts` (React Query wrappers for prompts/resources), `useElicitation()` (React state hook), `TamboMcpTokenProvider` (React context)
- React-sdk's `TamboMcpProvider` refactored to use `client.connectMcpServer()` instead of managing `MCPClient` instances directly

**Commit:** `feat(client): move MCP client, server utilities, and elicitation types`

Verify: `npm run check-types -w packages/client && npm test -w packages/client`

---

### Phase 7: Suggestions API

Add suggestions support to the generic client. While the `useTamboSuggestions` React hook is heavily React-coupled, the underlying API operations are simple REST calls that belong in the client.

**Files:**

- `packages/client/src/suggestions.ts` (NEW) - Suggestions methods on TamboClient

**Key Implementation Details:**

- `TamboClient` gains suggestions methods:
  - `listSuggestions(messageId: string, threadId: string): Promise<SuggestionListResponse>` - list existing suggestions for a message
  - `generateSuggestions(messageId: string, threadId: string, options?: { maxSuggestions?: number }): Promise<SuggestionGenerateResponse>` - generate new suggestions
- These wrap `sdk.threads.suggestions.list()` and `sdk.threads.suggestions.create()` with proper auth params
- Re-export suggestion types from typescript-sdk: `Suggestion`, `SuggestionListResponse`, `SuggestionGenerateResponse`
- React-sdk's `useTamboSuggestions` hook refactored to call `client.listSuggestions()` / `client.generateSuggestions()` instead of using the raw typescript-sdk client
- The hook's React Query caching, auto-generation logic, and input management stay in react-sdk

**Commit:** `feat(client): add suggestions API (list and generate)`

Verify: `npm run check-types -w packages/client && npm test -w packages/client`

---

### Phase 8: TamboClient Class

The main entry point that orchestrates all the pieces: REST client, store, streaming, tools, MCP, suggestions, auth.

**Files:**

- `packages/client/src/tambo-client.ts` (NEW) - TamboClient class
- `packages/client/src/index.ts` (NEW) - Public API surface

**Key Implementation Details:**

- Creates and holds the `@tambo-ai/typescript-sdk` client internally
- Creates InMemoryStore by default (or accepts user-provided store)
- `run()` method returns TamboStream, handles beforeRun callback
- Thread management: `switchThread`, `startNewThread`, `getThread` operate on the store
- Tool/component registration: maintains internal registries as `Record<string, TamboTool>`
- Auth: computes auth state from config, handles token exchange lifecycle
- Auto thread naming: calls `client.beta.threads.generateName()` on run completion

```pseudo
class TamboClient:
  private sdk: TamboAI        // typescript-sdk client
  private store: TamboStore<ClientState>
  private toolRegistry: Record<string, TamboTool>
  private componentRegistry: Record<string, AvailableComponent>
  private options: TamboClientOptions

  constructor(options):
    this.sdk = new TamboAI({ apiKey, baseURL, ... })
    this.store = options.store ?? new InMemoryStore(createInitialState())
    this.toolRegistry = indexByName(options.tools ?? [])
    this.componentRegistry = indexByName(options.components ?? [])

  run(message, options?):
    // 1. Compute auth state, throw if not identified
    // 2. Call beforeRun callback if provided
    // 3. Gather additionalContext from beforeRun
    // 4. Create TamboStream that internally:
    //    a. Calls createRunStream (new thread or existing)
    //    b. Processes events via streamReducer + store.setState
    //    c. Handles tool execution loop if autoExecuteTools
    //    d. Auto-generates thread name on completion
    return new TamboStream(...)

  dispatch(action: StreamAction):
    this.store.setState(prev => streamReducer(prev, action))

  switchThread(threadId):
    this.dispatch({ type: "SET_CURRENT_THREAD", threadId })
    // Fetch thread messages if not loaded
    const threadState = this.store.getState().threadMap[threadId]
    if (!threadState?.thread.messages.length):
      const messages = await this.sdk.threads.messages.list(threadId)
      this.dispatch({ type: "LOAD_THREAD_MESSAGES", threadId, messages })

  // MCP
  connectMcpServer(serverInfo): Promise<MCPClient>
  disconnectMcpServer(serverKey): Promise<void>
  getMcpClients(): Record<string, MCPClient>
  getMcpToken(contextKey): Promise<{ mcpAccessToken, tamboBaseUrl }>

  // Suggestions
  listSuggestions(messageId, threadId): Promise<SuggestionListResponse>
  generateSuggestions(messageId, threadId, options?): Promise<SuggestionGenerateResponse>

  getStore(): return this.store
```

**Public API Surface (packages/client/src/index.ts):**

```typescript
// Core class
export { TamboClient, type TamboClientOptions } from "./tambo-client";

// Stream
export { TamboStream } from "./tambo-stream";

// Store
export { type TamboStore } from "./store/types";
export { InMemoryStore } from "./store/in-memory-store";

// Types - thread, message, event, auth
export type { TamboThread, RunStatus, StreamingState } from "./types/thread";
export type {
  TamboThreadMessage, Content, TextContent, TamboToolUseContent,
  ToolResultContent, TamboComponentContent, ComponentStreamingState,
  MessageRole, InputMessage, InitialInputMessage, ResourceContent,
  TamboToolDisplayProps,
} from "./types/message";
export type { TamboCustomEvent, ... } from "./types/event";
export type { TamboAuthState } from "./types/auth";
export type { ToolChoice } from "./types/tool-choice";
export type { AvailableComponent } from "./types/component";

// Tool types
export type {
  TamboTool, SupportedSchema, ToolAnnotations,
} from "./model/component-metadata";

// State types
export type { ClientState, ThreadState, StreamState, StreamAction } from "./utils/event-accumulator";

// Utility (for advanced consumers)
export { streamReducer } from "./utils/event-accumulator";
export { defineTool } from "./util/define-tool";

// Schema utilities
export { schemaToJsonSchema, safeSchemaToJsonSchema } from "./schema/schema";

// MCP
export { MCPClient } from "./mcp/mcp-client";
export type {
  MCPElicitationHandler, MCPSamplingHandler, MCPHandlers,
  MCPToolSpec, MCPToolCallResult,
} from "./mcp/mcp-client";
export { MCPTransport, type McpServerInfo, type NormalizedMcpServerInfo } from "./model/mcp-server-info";
export type { TamboElicitationRequest, TamboElicitationResponse } from "./mcp/elicitation";

// Suggestions (re-exported from typescript-sdk types)
export type { Suggestion, SuggestionListResponse, SuggestionGenerateResponse } from "./suggestions";
```

**Commit:** `feat(client): implement TamboClient class with full API surface`

Verify: `npm run build -w packages/client && npm run check-types -w packages/client && npm test -w packages/client`

---

### Phase 9: React SDK Refactor

Refactor react-sdk to depend on `@tambo-ai/client` and become a thin adapter layer.

**Files:**

- `react-sdk/package.json` (MODIFIED) - Add `@tambo-ai/client` dependency
- `react-sdk/src/v1/providers/tambo-v1-provider.tsx` (MODIFIED) - Create TamboClient, provide via context
- `react-sdk/src/v1/providers/tambo-v1-stream-context.tsx` (MODIFIED) - Replace useReducer with useSyncExternalStore on client store
- `react-sdk/src/v1/hooks/use-tambo-v1-send-message.ts` (MODIFIED) - Thin wrapper calling client.run()
- `react-sdk/src/v1/hooks/use-tambo-v1.ts` (MODIFIED) - Reads from client store via useSyncExternalStore
- `react-sdk/src/v1/hooks/use-tambo-v1-auth-state.ts` (MODIFIED) - Delegates to client.getAuthState()
- `react-sdk/src/v1/hooks/use-tambo-v1-thread.ts` (MODIFIED) - Uses client.switchThread()
- `react-sdk/src/v1/hooks/use-tambo-v1-thread-list.ts` (MODIFIED) - Uses client.listThreads()
- `react-sdk/src/v1/hooks/use-tambo-v1-suggestions.ts` (MODIFIED) - Uses client.listSuggestions()/generateSuggestions()
- `react-sdk/src/v1/types/message.ts` (MODIFIED) - Re-export from client + extend with renderedComponent
- All `src/v1/utils/` files (MODIFIED) - Re-export from `@tambo-ai/client`
- `react-sdk/src/mcp/tambo-mcp-provider.tsx` (MODIFIED) - Uses client.connectMcpServer()/disconnectMcpServer()
- `react-sdk/src/mcp/mcp-client.ts` (DELETED) - Re-export from client
- `react-sdk/src/mcp/mcp-constants.ts` (DELETED) - Re-export from client
- `react-sdk/src/mcp/elicitation.ts` (MODIFIED) - Types re-exported from client, React hook stays
- `react-sdk/src/util/mcp-server-utils.ts` (DELETED) - Re-export from client
- `react-sdk/src/model/mcp-server-info.ts` (DELETED) - Re-export from client
- `react-sdk/src/providers/tambo-mcp-token-provider.tsx` (MODIFIED) - Uses client.getMcpToken()
- `react-sdk/src/v1/index.ts` (MODIFIED) - Update imports

**Key Implementation Details:**

- TamboProvider creates a `TamboClient` instance and provides it via React context
- The client's store replaces React's useReducer for stream state
- `useSyncExternalStore(client.getStore().subscribe, () => client.getStore().getState())` bridges the store to React's rendering cycle
- Thread sync (fetching messages on switch) moves from `ThreadSyncManager` component to `client.switchThread()`
- `useTamboSendMessage` becomes: call `client.run()`, await the TamboStream, handle React Query cache invalidation on success
- Component rendering (`renderedComponent` on `TamboComponentContent`) stays entirely in react-sdk's `useTambo()` hook -- this is the React-specific transform layer
- Re-export backward compatibility: react-sdk's `index.ts` re-exports types from `@tambo-ai/client` so existing consumers don't break
- **MCP refactor**: `TamboMcpProvider` calls `client.connectMcpServer()` / `client.disconnectMcpServer()` instead of managing `MCPClient` instances directly. The provider still handles React lifecycle (mount/unmount cleanup), handler updates via effects, and tool registration with the React registry. `TamboMcpTokenProvider` calls `client.getMcpToken()` instead of using the raw typescript-sdk client.
- **Suggestions refactor**: `useTamboSuggestions` calls `client.listSuggestions()` / `client.generateSuggestions()` instead of the raw typescript-sdk client. React Query caching, auto-generation, and input management stay in the hook.

```pseudo
// tambo-v1-provider.tsx (simplified)
function TamboProvider({ apiKey, tools, components, ... }):
  const client = useMemo(() =>
    new TamboClient({ apiKey, tools, components, userKey, ... }), [apiKey])

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
  const store = client.getStore()

  // This is the key bridge: React re-renders when store state changes
  const state = useSyncExternalStore(
    store.subscribe,
    () => store.getState()
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
      // Await completion
      return await stream.thread
    },
    onSuccess: (thread) => {
      queryClient.invalidateQueries(["v1-threads", thread.id])
    },
  })
```

**Commit:** `refactor(react-sdk): consume @tambo-ai/client for core business logic`

Verify: `npm run build && npm run check-types && npm run lint && npm test`

This is the most critical verification step - all existing react-sdk tests must pass after the refactor.

---

### Phase 10: Testing

Ensure both packages work correctly independently and together.

**Files:**

- `packages/client/src/**/*.test.ts` (NEW) - Unit tests for all client modules
- `react-sdk/src/v1/**/*.test.tsx` (MODIFIED) - Update existing tests for new architecture

**Key Implementation Details:**

- Move existing test files alongside their source files (e.g., `event-accumulator.test.ts` moves to `packages/client/src/utils/`)
- Tests for the reducer, tool executor, tool-call-tracker, stream-handler already exist and should pass with minimal changes (update import paths)
- New tests needed for:
  - `InMemoryStore` (subscribe/setState/getState lifecycle)
  - `TamboClient` (run, switchThread, startNewThread, registration, auth)
  - `TamboStream` (iteration modes, promise properties, auto-consume, abort, stitching)
  - `computeAuthState()` pure function
- React-sdk tests: existing tests should pass after refactor. Key risk is `TamboStreamProvider` tests that mock `useReducer` -- these need updating to mock the client store instead.
- Integration test: create a `TamboClient`, register tools, call `run()`, verify tool execution loop completes and state is correct.
- MCP tests: connect to mock MCP server, discover tools, call tools
- Suggestions tests: list and generate suggestions via client methods

**Commit:** `test(client): add comprehensive tests for @tambo-ai/client`

Verify: `npm run build && npm run check-types && npm run lint && npm test` (full workspace verification)

---

**Final commit:** `chore(react-sdk): update AGENTS.md and README.md for @tambo-ai/client dependency`

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
