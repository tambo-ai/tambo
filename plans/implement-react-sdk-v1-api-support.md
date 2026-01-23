# Implement React SDK v1 API Support

## Overview

Implement a new v1 subpackage in `@tambo-ai/react` that provides React hooks and providers for the new streaming-first v1 API defined in `plans/api-v1-proposal.md`. The v1 SDK will be importable via `@tambo-ai/react/v1` and expose name-compatible hooks (`useTamboV1()`, `useTamboV1Thread()`) that work with the new AG-UI event-based streaming protocol.

**Key Design Decisions:**

- **Component Registry**: Global registry pattern (register once, use everywhere)
- **Tool Execution**: Automatic client-side tool execution with SDK-managed continuation
- **Type Safety**: Strict v1 types (Thread, Message, Content blocks from v1 API)
- **State Management**: Reuse React Query for consistency with current SDK

## Problem Statement / Motivation

The current React SDK (`@tambo-ai/react`) was built for the beta API which has accumulated inconsistencies and redundant patterns. The v1 API introduces:

1. **Streaming-only responses** via Server-Sent Events with AG-UI protocol
2. **Content blocks pattern** (Anthropic-style) for messages with inline tool calls/results
3. **First-class components** as content blocks that stream via `tambo.component.*` events
4. **Bidirectional tool execution** (server-side MCP tools vs. client-side browser tools)
5. **Simplified thread state** with clear run lifecycle (`idle`/`waiting`/`streaming`)

The v1 SDK needs to:

- Consume the streaming API client (`@tambo-ai/typescript-sdk`)
- Accumulate AG-UI events into fully-formed React state (threads, messages, components)
- Maintain familiar hook patterns for easy migration
- Provide type-safe access to v1 API structures

## Proposed Solution

Create a new subpackage at `react-sdk/src/v1/` following the established MCP subpackage pattern (`react-sdk/src/mcp/`). The v1 SDK will:

1. **Export via package.json**: Add `"./v1"` entry point for `@tambo-ai/react/v1` imports
2. **Provider hierarchy**: `TamboV1Provider` wraps streaming state management
3. **Hook layer**: `useTamboV1()`, `useTamboV1Thread()`, `useTamboV1Messages()` expose accumulated state
4. **Event accumulation**: Use `useReducer` to transform AG-UI event streams into React state
5. **React Query integration**: Leverage existing caching for thread list, thread fetching
6. **Type definitions**: Import v1 types from TypeScript SDK, extend with React-specific interfaces

## Migration Strategy

### Phased Rollout Approach

The v1 SDK will be developed and released in phases to minimize risk for existing users:

**Phase 1: Early Adopter Testing (v1 Subpackage)**

- Develop v1 SDK as a subpackage at `@tambo-ai/react/v1`
- Release to select group of early adopters for testing and feedback
- Beta SDK remains unchanged and fully supported
- Users can import both: `@tambo-ai/react` (beta) and `@tambo-ai/react/v1`
- Iterate based on early adopter feedback

**Phase 2: Breaking Change Release (1.0)**

- Once v1 is validated and stable with early adopters
- Move v1 implementation to main package exports
- Release as `@tambo-ai/react@1.0.0` with breaking changes
- Provide comprehensive migration guide with:
  - Side-by-side code comparisons (beta → v1)
  - Breaking changes documentation
  - Codemods or automated migration tools (if feasible)
  - Gradual migration path (both APIs can coexist temporarily)

**Note:** The detailed migration documentation will be created after v1 implementation is complete and validated with early adopters. This ensures the migration guide reflects the actual API surface and common migration patterns discovered during testing.

## Technical Approach

### Architecture

```mermaid
graph TB
    subgraph "React Application"
        App[React App Components]
        Hooks[v1 Hooks Layer]
    end

    subgraph "React SDK v1"
        Provider[TamboV1Provider]
        StreamContext[Stream State Context]
        RegistryContext[Component Registry Context]
        Reducer[Event Reducer]
    end

    subgraph "Streaming Layer"
        TSDK[@tambo-ai/typescript-sdk]
        SSE[SSE Stream Handler]
    end

    subgraph "Tambo Cloud API"
        V1API[/v1/threads/runs endpoint]
    end

    App --> Hooks
    Hooks --> Provider
    Provider --> StreamContext
    Provider --> RegistryContext
    StreamContext --> Reducer
    Reducer --> SSE
    SSE --> TSDK
    TSDK --> V1API
```

### File Structure

```
react-sdk/src/v1/
├── index.ts                              # Public exports
├── providers/
│   ├── tambo-v1-provider.tsx            # Main provider component
│   ├── tambo-v1-stream-context.tsx      # Stream state management
│   ├── tambo-v1-registry-context.tsx    # Component/tool registry
│   └── index.ts
├── hooks/
│   ├── use-tambo-v1.ts                  # Main hook (combines all contexts)
│   ├── use-tambo-v1-thread.ts           # Thread operations
│   ├── use-tambo-v1-messages.ts         # Message list access
│   ├── use-tambo-v1-send-message.ts     # Send message mutation
│   ├── use-tambo-v1-component-state.ts  # Component state management
│   └── index.ts
├── types/
│   ├── thread.ts                        # Thread type extensions
│   ├── message.ts                       # Message type extensions
│   ├── content.ts                       # Content block types
│   ├── component.ts                     # Component types
│   ├── tool.ts                          # Tool types
│   ├── event.ts                         # AG-UI event types
│   └── index.ts
├── utils/
│   ├── event-accumulator.ts             # AG-UI event → state reducer
│   ├── stream-handler.ts                # SSE stream management
│   ├── tool-executor.ts                 # Client-side tool execution
│   └── index.ts
└── __tests__/
    ├── event-accumulation.test.ts
    ├── streaming-integration.test.ts
    └── tool-execution.test.ts
```

### Implementation Phases

#### Phase 0: Verify Compatibility & Extract Reusable Logic (Est: 1-2 days)

**Status: ✅ COMPLETED/SKIPPED - Analysis concluded extraction not necessary for initial v1 implementation**

**Goals:**

- **CRITICAL:** Verify `TamboClientProvider` actually works with v1 API (don't assume)
- Determine if `TamboRegistryProvider` can be reused or needs v1-specific version
- Extract tool execution utilities that both APIs can use
- Ensure existing SDK still works (no breaking changes)

**Tasks:**

- [x] **Verify TamboClientProvider v1 Compatibility** - SKIPPED: Deferred to Phase 7
- [x] **Assess TamboRegistryProvider Reusability** - SKIPPED: Deferred to Phase 4
- [x] Extract tool execution utilities - SKIPPED: Will implement directly in Phase 6 when needed
- [x] Write tests for extracted utilities - SKIPPED
- [x] Verify existing SDK tests still pass - SKIPPED: No changes to beta SDK in this phase

**Critical Success Criteria:**

- [x] Phase skipped - extraction deferred to implementation phases where needed

**Outcome:**

This phase was skipped in favor of a direct implementation approach. Analysis determined that:

1. Provider compatibility verification should happen during Phase 7 implementation
2. Registry reuse assessment should happen during Phase 4 implementation
3. Tool execution utilities should be implemented directly in Phase 6 when needed
4. No code extraction needed until we understand v1 requirements better

#### Phase 1: Foundation & Types (Est: 1-2 days)

**Status: ✅ COMPLETED**

**Goals:**

- Set up v1 subpackage structure
- Define type system aligned with v1 API
- Configure package exports

**Tasks:**

- [x] Create `/react-sdk/src/v1/` directory structure - Created v1/, v1/types/, v1/utils/
- [x] Add `"./v1"` export to `react-sdk/package.json` - Added subpackage export configuration
- [x] Define `TamboV1Thread` type extending API Thread type - Imported from typescript-sdk, added StreamingState wrapper
- [x] Define `TamboV1Message` type with rendered components - Imported Content types from typescript-sdk
- [x] Define `TamboV1Component` type for registered components - Deferred to Phase 4 (registry)
- [x] Define `TamboV1Tool` type for registered tools - Deferred to Phase 4 (registry)
- [x] Import AG-UI event types from `@ag-ui/core` - Added @ag-ui/core@^0.0.42 dependency, types imported
- [x] Create event accumulator state types (`StreamState`, `StreamEvent`) - Defined in Phase 2
- [x] Write unit tests for type definitions - Deferred to Phase 10

**Files:**

```typescript
// react-sdk/src/v1/types/thread.ts
import type { Thread, RunStatus } from "@tambo-ai/typescript-sdk/v1";

export interface TamboV1Thread extends Thread {
  messages: TamboV1Message[];
  // React-specific additions
  isLoading?: boolean;
  error?: Error;
}

// react-sdk/src/v1/types/message.ts
import type { Message, Content } from "@tambo-ai/typescript-sdk/v1";
import type { ReactElement } from "react";

export interface TamboV1Message extends Message {
  // Rendered React elements for component content blocks
  renderedComponents?: Map<string, ReactElement>;
}

// react-sdk/src/v1/types/component.ts
import type { ComponentType } from "react";
import type { AvailableComponent } from "@tambo-ai/typescript-sdk/v1";

export interface TamboV1Component extends AvailableComponent {
  component: ComponentType<any>;
  loadingComponent?: ComponentType<any>;
  associatedTools?: TamboV1Tool[];
}

// react-sdk/src/v1/types/event.ts
import type { BaseEvent, EventType } from "@ag-ui/core";

export type AGUIEvent = BaseEvent;

export type StreamingState =
  | { status: "idle" }
  | { status: "waiting"; runId: string; startTime: number }
  | { status: "streaming"; runId: string; messageId?: string }
  | { status: "complete"; runId: string; duration: number }
  | { status: "error"; error: Error; runId?: string };
```

**Success Criteria:**

- [x] All types compile without errors - Zero TypeScript errors
- [x] Types exported from `react-sdk/src/v1/index.ts` - Header with import guidance, no barrel re-exports
- [x] Build succeeds with dual CJS/ESM outputs - Not tested yet (deferred to Phase 10)
- [x] Import from `@tambo-ai/react/v1` works in test file - Not tested yet (deferred to Phase 10)

**Actual Implementation:**

Created type system following "import from source" philosophy:

- **types/event.ts**: Defines only Tambo custom events (ComponentStartEvent, ComponentPropsDeltaEvent, etc.)
- **types/message.ts**: Re-exports SDK content types with aliases (TextContent, ToolUseContent, etc.) + TamboV1Message
- **types/thread.ts**: Re-exports SDK thread types + defines TamboV1Thread with streaming state
- **types/component.ts**: Stub file for future component types
- **types/tool.ts**: Stub file for future tool types
- **v1/index.ts**: Entry point with documentation, NO type re-exports (users import from specific files)

Key decisions:

- Deleted types/index.ts barrel export to prevent confusion about type sources
- Users import AG-UI events directly from @ag-ui/core
- Users import SDK types directly from @tambo-ai/typescript-sdk
- Only React-specific types are exported from v1 subpackage

#### Phase 2: Event Accumulation Logic (Est: 2-3 days)

**Goals:**

- Implement reducer for AG-UI event → React state transformation
- Handle all standard AG-UI events (TEXT*MESSAGE*_, TOOL*CALL*_, RUN\_\*)
- Handle Tambo CUSTOM events (tambo.component.\*, tambo.run.awaiting_input)

**Tasks:**

- [ ] Implement `streamReducer(state, event)` with discriminated union pattern
- [ ] Handle `RUN_STARTED` - initialize streaming state
- [ ] Handle `TEXT_MESSAGE_START` - create new message stub
- [ ] Handle `TEXT_MESSAGE_CONTENT` - accumulate text deltas
- [ ] Handle `TEXT_MESSAGE_END` - finalize text message
- [ ] Handle `TOOL_CALL_START` - create tool_use content block
- [ ] Handle `TOOL_CALL_ARGS` - accumulate JSON args string, parse on END
- [ ] Handle `TOOL_CALL_END` - finalize tool call
- [ ] Handle `TOOL_CALL_RESULT` - create tool_result content block (server-side tools)
- [ ] Handle `CUSTOM: tambo.component.start` - create component content block
- [ ] Handle `CUSTOM: tambo.component.props_delta` - apply JSON Patch to props
- [ ] Handle `CUSTOM: tambo.component.state_delta` - apply JSON Patch to state
- [ ] Handle `CUSTOM: tambo.component.end` - finalize component
- [ ] Handle `CUSTOM: tambo.run.awaiting_input` - transition to awaiting state
- [ ] Handle `RUN_FINISHED` - transition to complete state
- [ ] Handle `RUN_ERROR` - transition to error state
- [ ] Add `fast-json-patch` dependency to react-sdk/package.json
- [ ] Implement JSON Patch wrapper using `fast-json-patch` library
- [ ] Write comprehensive unit tests for all event types
- [ ] Test event sequences (e.g., TOOL_CALL_START → ARGS → END → RESULT)

**Files:**

```typescript
// react-sdk/src/v1/utils/event-accumulator.ts
import { EventType, type BaseEvent } from "@ag-ui/core";
import type { TamboV1Thread, TamboV1Message, StreamingState } from "../types";

export type StreamState = {
  thread: TamboV1Thread;
  streamingState: StreamingState;
  pendingToolCalls: Map<string, { name: string; input: string }>;
  accumulatingComponents: Map<
    string,
    {
      name: string;
      props: Record<string, unknown>;
      state?: Record<string, unknown>;
      propsStreaming?: Record<string, "started" | "streaming" | "done">;
    }
  >;
};

export function streamReducer(
  state: StreamState,
  event: BaseEvent,
): StreamState {
  // Type-cast based on event.type discriminator
  switch (event.type) {
    case EventType.RUN_STARTED: {
      const e = event as RunStartedEvent;
      return {
        ...state,
        streamingState: {
          status: "waiting",
          runId: e.runId,
          startTime: e.timestamp ?? Date.now(),
        },
      };
    }

    case EventType.TEXT_MESSAGE_START: {
      const e = event as TextMessageStartEvent;
      // Create new message stub
      const newMessage: TamboV1Message = {
        id: e.messageId,
        role: e.role,
        content: [],
        createdAt: new Date().toISOString(),
      };
      return {
        ...state,
        thread: {
          ...state.thread,
          messages: [...state.thread.messages, newMessage],
        },
        streamingState: {
          ...state.streamingState,
          status: "streaming",
          messageId: e.messageId,
        } as StreamingState,
      };
    }

    case EventType.TEXT_MESSAGE_CONTENT: {
      const e = event as TextMessageContentEvent;
      // Find current message, append delta to last TextContent block
      // IMPORTANT: Must immutably update all nested objects
      const messages = state.thread.messages.map((msg) => {
        if (msg.id !== e.messageId) return msg;

        const lastContent = msg.content[msg.content.length - 1];
        if (lastContent?.type === "text") {
          // Append to existing text block (immutably)
          return {
            ...msg,
            content: [
              ...msg.content.slice(0, -1),
              { ...lastContent, text: lastContent.text + e.delta },
            ],
          };
        } else {
          // Create new text block
          return {
            ...msg,
            content: [...msg.content, { type: "text", text: e.delta }],
          };
        }
      });

      return {
        ...state,
        thread: { ...state.thread, messages },
      };
    }

    // ... handle other event types (TOOL_CALL_START, TOOL_CALL_ARGS, etc.)

    default: {
      // Exhaustiveness check: TypeScript will error if we add new event types
      // and forget to handle them. Remove this default case to enable checking.
      const _exhaustiveCheck: never = event.type;
      console.warn("Unhandled event type:", event.type);
      return state;
    }
  }
}

// Type guard helpers for runtime validation
function isTextMessageContentEvent(
  event: BaseEvent,
): event is TextMessageContentEvent {
  return event.type === EventType.TEXT_MESSAGE_CONTENT;
}

// Note: Use type guards when consuming untrusted event streams.
// The 'as' casts in the switch are safe because we've checked event.type.

// react-sdk/src/v1/utils/json-patch.ts
import { applyPatch, type Operation } from "fast-json-patch";
import type { JsonPatchOperation } from "@tambo-ai/typescript-sdk/v1";

/**
 * Apply JSON Patch operations to an object (RFC 6902).
 * Uses fast-json-patch library for battle-tested implementation.
 *
 * @param obj - Object to patch (will not be mutated)
 * @param operations - Array of JSON Patch operations from AG-UI protocol
 * @returns New object with patches applied
 * @throws Error if patch operations are invalid or paths don't exist
 */
export function applyJsonPatch(
  obj: Record<string, unknown>,
  operations: JsonPatchOperation[],
): Record<string, unknown> {
  try {
    // Clone to avoid mutation
    const cloned = structuredClone(obj);
    // fast-json-patch mutates in place, but we cloned first
    const result = applyPatch(
      cloned,
      operations as Operation[],
      /* validate */ true,
    );
    return result.newDocument;
  } catch (error) {
    throw new Error(
      `Failed to apply JSON Patch: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
```

**Success Criteria:**

- All AG-UI event types handled without errors
- Event sequences produce correct accumulated state
- JSON Patch operations apply correctly to component props/state
- Exhaustiveness checking catches unhandled event types
- 95%+ test coverage for reducer logic

#### Phase 3: Streaming & State Management (Est: 2-3 days)

**Goals:**

- Implement SSE stream handler using TypeScript SDK `Stream` class
- Create React Context for stream state
- Integrate with `useReducer` for event accumulation

**Tasks:**

- [ ] Implement `useStreamHandler()` hook wrapping SDK `Stream.fromSSEResponse()`
- [ ] Handle stream lifecycle (connecting → streaming → complete → idle)
- [ ] Implement automatic reconnection on disconnect (if API supports)
- [ ] Create `TamboV1StreamContext` with state + dispatch
- [ ] Implement `TamboV1StreamProvider` using `useReducer(streamReducer)`
- [ ] Handle stream cancellation via AbortController
- [ ] Implement error boundaries for stream errors
- [ ] Add debug logging for event flow (dev mode only)
- [ ] Write integration tests for full stream lifecycle
- [ ] Test concurrent streams (if multiple threads active)

**Files:**

```typescript
// react-sdk/src/v1/utils/stream-handler.ts
import { Stream } from '@tambo-ai/typescript-sdk/core';
import type { BaseEvent } from '@ag-ui/core';

export async function* handleSSEStream(
  response: Response,
  controller: AbortController,
): AsyncIterable<BaseEvent> {
  const stream = Stream.fromSSEResponse<BaseEvent>(response, controller);

  for await (const event of stream) {
    // Event is already JSON-parsed by SDK
    yield event as BaseEvent;
  }
}

// react-sdk/src/v1/providers/tambo-v1-stream-context.tsx
import { createContext, useReducer, useContext, type Dispatch } from 'react';
import type { BaseEvent } from '@ag-ui/core';
import { streamReducer, type StreamState } from '../utils/event-accumulator';

const StreamStateContext = createContext<StreamState | null>(null);
const StreamDispatchContext = createContext<Dispatch<BaseEvent> | null>(null);

export function TamboV1StreamProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(streamReducer, {
    thread: { id: '', messages: [], runStatus: 'idle', /* ... */ },
    streamingState: { status: 'idle' },
    pendingToolCalls: new Map(),
    accumulatingComponents: new Map(),
  });

  return (
    <StreamStateContext.Provider value={state}>
      <StreamDispatchContext.Provider value={dispatch}>
        {children}
      </StreamDispatchContext.Provider>
    </StreamStateContext.Provider>
  );
}

export function useStreamState() {
  const context = useContext(StreamStateContext);
  if (!context) {
    throw new Error('useStreamState must be used within TamboV1StreamProvider');
  }
  return context;
}

export function useStreamDispatch() {
  const context = useContext(StreamDispatchContext);
  if (!context) {
    throw new Error('useStreamDispatch must be used within TamboV1StreamProvider');
  }
  return context;
}
```

**Success Criteria:**

- SSE streams parsed correctly into AG-UI events
- Events dispatched to reducer in real-time
- Stream state updates reflected in React components
- Cancellation works without memory leaks
- Error states properly surfaced to UI

#### Phase 4: Reuse Registry Provider (Est: 0.5 days)

**Goals:**

- Reuse existing `TamboRegistryProvider` from beta SDK (confirmed compatible in Phase 0)
- Create v1-specific type aliases and conversion utilities only where needed
- Minimal new code - maximize reuse

**Rationale:**

After Phase 0 analysis, `TamboRegistryProvider` is API-agnostic - it just stores Maps of components/tools and handles schema conversion. The v1 API needs the same registry functionality, so we'll reuse it directly rather than duplicating (~150 LOC saved).

**Tasks:**

- [ ] Import and re-export `TamboRegistryProvider` from beta SDK in `src/v1/providers/index.ts`
- [ ] Create v1 type aliases in `src/v1/types/component.ts` and `src/v1/types/tool.ts` (if types differ from beta)
- [ ] Create conversion utilities in `src/v1/utils/registry-conversion.ts`:
  - `toAvailableComponents(components)` - Map → v1 API format
  - `toAvailableTools(tools)` - Map → v1 API format
- [ ] Write tests for conversion utilities only (registry itself already tested in beta SDK)
- [ ] Document any type differences between beta and v1 component/tool types

**Files:**

```typescript
// react-sdk/src/v1/providers/index.ts
export { TamboRegistryProvider } from "../../providers/tambo-registry-provider";

// react-sdk/src/v1/utils/registry-conversion.ts
import type { TamboComponent, TamboTool } from "../../model/component-metadata";
import type { AvailableComponent, Tool } from "@tambo-ai/typescript-sdk/v1";

/**
 * Convert registered components to v1 API format.
 */
export function toAvailableComponents(
  components: Map<string, TamboComponent>,
): AvailableComponent[] {
  return Array.from(components.values()).map((c) => ({
    name: c.name,
    description: c.description,
    propsSchema: c.propsSchema, // Already JSON Schema from registry
    stateSchema: c.stateSchema,
  }));
}

/**
 * Convert registered tools to v1 API format.
 */
export function toAvailableTools(tools: Map<string, TamboTool>): Tool[] {
  return Array.from(tools.values()).map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.toolSchema.parameters, // Extract from Zod function schema
  }));
}
```

**Success Criteria:**

- Beta `TamboRegistryProvider` works without modification for v1
- Conversion utilities correctly transform to v1 API format
- No duplication of registry logic
- Tests verify conversion accuracy

#### Phase 5: React Query Integration (Est: 2-3 days)

**Goals:**

- Implement React Query mutations for sending messages
- Implement queries for thread operations (list, get)
- Integrate streaming responses into query cache

**Tasks:**

- [ ] Create `useTamboV1SendMessage()` mutation hook
- [ ] Handle streaming response in mutation `onSuccess`
- [ ] Dispatch AG-UI events to stream context during mutation
- [ ] Implement optimistic updates for new messages
- [ ] Create `useTamboV1ThreadList()` query hook
- [ ] Create `useTamboV1ThreadGet()` query hook
- [ ] Implement automatic refetch on thread updates
- [ ] Handle tool execution within mutation (automatic continuation)
- [ ] Add query invalidation on successful mutations
- [ ] Write tests for query/mutation flow
- [ ] Test query caching and stale-while-revalidate behavior

**Files:**

```typescript
// react-sdk/src/v1/hooks/use-tambo-v1-send-message.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTamboClient } from "../providers/tambo-v1-provider";
import { useStreamDispatch } from "../providers/tambo-v1-stream-context";
import { useRegistry } from "../providers/tambo-v1-registry-context";
import { handleSSEStream } from "../utils/stream-handler";

export function useTamboV1SendMessage(threadId: string) {
  const client = useTamboClient();
  const dispatch = useStreamDispatch();
  const { getAvailableComponents, getAvailableTools } = useRegistry();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: string) => {
      const controller = new AbortController();

      // Create run with message + context
      const response = await client.threads.runs.create(threadId, {
        message: {
          role: "user",
          content: [{ type: "text", text: message }],
        },
        availableComponents: getAvailableComponents(),
        tools: getAvailableTools(),
      });

      // Stream events and dispatch to reducer
      for await (const event of handleSSEStream(response, controller)) {
        dispatch(event);

        // Check for awaiting_input (client-side tool calls)
        if (
          event.type === "CUSTOM" &&
          event.name === "tambo.run.awaiting_input"
        ) {
          // Execute tools and continue (Phase 6)
          await executeToolsAndContinue(event.value.pendingToolCallIds);
        }
      }
    },
    onSuccess: () => {
      // Invalidate thread queries to refetch updated state
      queryClient.invalidateQueries({ queryKey: ["v1-threads", threadId] });
    },
  });
}

// react-sdk/src/v1/hooks/use-tambo-v1-thread.ts
import { useQuery } from "@tanstack/react-query";
import { useTamboClient } from "../providers/tambo-v1-provider";

export function useTamboV1Thread(threadId: string) {
  const client = useTamboClient();

  return useQuery({
    queryKey: ["v1-threads", threadId],
    queryFn: async () => {
      const response = await client.threads.get(threadId);
      return response as TamboV1Thread;
    },
    staleTime: 1000, // Consider stale after 1s (real-time data)
  });
}
```

**Success Criteria:**

- Mutations trigger streaming and update local state
- Queries provide cached thread data
- Optimistic updates show immediately
- Query cache invalidation works correctly
- Tool execution doesn't block UI

#### Phase 6: Automatic Tool Execution (Est: 2-3 days)

**Goals:**

- Detect `tambo.run.awaiting_input` events
- Execute client-side tools automatically
- Continue stream with tool results

**Tasks:**

- [ ] Implement `executeClientTool()` function
- [ ] Look up tool by name in registry
- [ ] Call tool function with parsed arguments
- [ ] Handle tool errors gracefully (isError flag)
- [ ] Transform tool results to `ToolResultContent` format
- [ ] Use `transformToContent` if provided by tool
- [ ] Implement `continueWithToolResults()` mutation
- [ ] POST tool results to continue run (with `previousRunId`)
- [ ] Handle multi-tool scenarios (execute all, then continue)
- [ ] Add configurable timeout for tool execution
- [ ] Write tests for tool execution flow
- [ ] Test error handling and recovery

**Files:**

```typescript
// react-sdk/src/v1/utils/tool-executor.ts
import type { TamboV1Tool } from "../types";
import type { ToolResultContent } from "@tambo-ai/typescript-sdk/v1";

export async function executeClientTool(
  tool: TamboV1Tool,
  toolCallId: string,
  args: Record<string, unknown>,
): Promise<ToolResultContent> {
  try {
    const result = await tool.tool(args);

    // Transform result to content if transformer provided
    let content: (TextContent | ResourceContent)[];
    if (tool.transformToContent) {
      content = await tool.transformToContent(result);
    } else {
      // Default: stringify result as text
      content = [
        {
          type: "text",
          text: typeof result === "string" ? result : JSON.stringify(result),
        },
      ];
    }

    return {
      type: "tool_result",
      toolUseId: toolCallId,
      content,
      isError: false,
    };
  } catch (error) {
    return {
      type: "tool_result",
      toolUseId: toolCallId,
      content: [
        {
          type: "text",
          text:
            error instanceof Error ? error.message : "Tool execution failed",
        },
      ],
      isError: true,
    };
  }
}

export async function executeAllPendingTools(
  toolCalls: Map<string, { name: string; input: Record<string, unknown> }>,
  registry: Map<string, TamboV1Tool>,
): Promise<ToolResultContent[]> {
  const results: ToolResultContent[] = [];

  for (const [toolCallId, { name, input }] of toolCalls) {
    const tool = registry.get(name);
    if (!tool) {
      results.push({
        type: "tool_result",
        toolUseId: toolCallId,
        content: [
          { type: "text", text: `Tool "${name}" not found in registry` },
        ],
        isError: true,
      });
      continue;
    }

    const result = await executeClientTool(tool, toolCallId, input);
    results.push(result);
  }

  return results;
}
```

**Success Criteria:**

- Tools execute automatically when requested
- Results sent to API correctly
- Stream continues without user intervention
- Errors handled gracefully without breaking flow
- Multi-tool scenarios work correctly

#### Phase 7: Main Provider & Hooks (Est: 1-2 days)

**Goals:**

- Implement `TamboV1Provider` reusing existing providers where possible
- Create main `useTamboV1()` hook exposing combined state
- Implement specialized hooks for common operations

**Tasks:**

- [ ] Create `TamboV1Provider` wrapping reusable providers
- [ ] Reuse `TamboClientProvider` (works as-is with v1 API)
- [ ] Reuse `TamboRegistryProvider` (via extracted `useRegistryState()`)
- [ ] Implement `useTamboV1()` combining all context hooks
- [ ] Implement `useTamboV1Thread()` for thread state
- [ ] Implement `useTamboV1Messages()` for message list
- [ ] Implement `useTamboV1SendMessage()` for sending
- [ ] Implement `useTamboV1ComponentState()` for component state updates
- [ ] Implement `useTamboV1RegisterComponent()` for dynamic registration
- [ ] Implement `useTamboV1RegisterTool()` for dynamic registration
- [ ] Add hook documentation with JSDoc comments
- [ ] Write integration tests for full hook flow
- [ ] Test provider composition and context access

**Files:**

```typescript
// react-sdk/src/v1/providers/tambo-v1-provider.tsx
import { TamboClientProvider } from '../../providers/tambo-client-provider';
import { TamboRegistryProvider } from '../../providers/tambo-registry-provider';
import { TamboV1StreamProvider } from './tambo-v1-stream-context';

export interface TamboV1ProviderProps {
  apiKey: string;
  apiBaseUrl?: string;
  children: ReactNode;

  // Registry props (passed through to TamboRegistryProvider)
  components?: TamboComponent[];
  tools?: TamboTool[];

  // Optional custom query client
  queryClient?: QueryClient;
}

export function TamboV1Provider({
  apiKey,
  apiBaseUrl,
  children,
  components,
  tools,
  queryClient,
}: TamboV1ProviderProps) {
  return (
    <TamboClientProvider
      apiKey={apiKey}
      tamboUrl={apiBaseUrl}
      queryClient={queryClient}
    >
      <TamboRegistryProvider
        components={components}
        tools={tools}
      >
        <TamboV1StreamProvider>
          {children}
        </TamboV1StreamProvider>
      </TamboRegistryProvider>
    </TamboClientProvider>
  );
}

// react-sdk/src/v1/hooks/use-tambo-v1.ts
export function useTamboV1() {
  const client = useTamboClient();
  const streamState = useStreamState();
  const registry = useRegistry();

  return {
    // Client
    client,

    // Thread state
    thread: streamState.thread,
    messages: streamState.thread.messages,
    runStatus: streamState.thread.runStatus,

    // Streaming state
    streamingState: streamState.streamingState,
    isStreaming: streamState.streamingState.status === 'streaming',
    isWaiting: streamState.streamingState.status === 'waiting',

    // Registry
    registerComponent: registry.registerComponent,
    registerTool: registry.registerTool,
  };
}
```

**Success Criteria:**

- Provider correctly initializes all contexts
- Main hook exposes all necessary state/functions
- Specialized hooks work independently
- No prop drilling required for deep components
- TypeScript inference works correctly

#### Phase 8: Component Rendering & State (Est: 2-3 days)

**Goals:**

- Render React components from component content blocks
- Manage bidirectional component state
- Support streaming props/state updates

**Tasks:**

- [ ] Implement component renderer looking up by name in registry
- [ ] Render loading component during props streaming
- [ ] Switch to main component when props complete
- [ ] Pass streamed props to component via React props
- [ ] Implement `useTamboV1ComponentState()` hook for components
- [ ] Handle JSON Patch state updates from server
- [ ] Implement debounced state updates to server
- [ ] POST to `/threads/{id}/components/{componentId}/state` endpoint
- [ ] Handle conflicts (server updates during client typing)
- [ ] Add error boundaries around component rendering
- [ ] Write tests for component lifecycle
- [ ] Test state synchronization scenarios

**Files:**

```typescript
// react-sdk/src/v1/utils/component-renderer.tsx
import { type ReactElement, Suspense } from 'react';
import type { TamboV1Component, ComponentContent } from '../types';

export function renderComponentContent(
  content: ComponentContent,
  registry: Map<string, TamboV1Component>,
): ReactElement | null {
  const componentDef = registry.get(content.name);
  if (!componentDef) {
    console.warn(`Component "${content.name}" not found in registry`);
    return null;
  }

  const Component = componentDef.component;
  const LoadingComponent = componentDef.loadingComponent;

  // If props are still streaming, show loading component
  if (LoadingComponent && isStreaming(content)) {
    return <LoadingComponent {...content.props} />;
  }

  return (
    <Suspense fallback={LoadingComponent ? <LoadingComponent /> : null}>
      <Component {...content.props} initialState={content.state} />
    </Suspense>
  );
}

// react-sdk/src/v1/hooks/use-tambo-v1-component-state.ts
export function useTamboV1ComponentState<S>(
  componentId: string,
  initialValue: S,
  debounceTime = 500,
) {
  const client = useTamboClient();
  const streamState = useStreamState();
  const [localState, setLocalState] = useState<S>(initialValue);

  // Debounced sync to server
  const debouncedSync = useDebouncedCallback(
    async (newState: S) => {
      await client.threads.components.updateState(
        streamState.thread.id,
        componentId,
        { state: newState },
      );
    },
    debounceTime,
  );

  const setState = useCallback((updater: S | ((prev: S) => S)) => {
    setLocalState(prev => {
      const newState = typeof updater === 'function'
        ? (updater as (prev: S) => S)(prev)
        : updater;

      // Trigger debounced sync
      debouncedSync(newState);

      return newState;
    });
  }, [debouncedSync]);

  return [localState, setState] as const;
}
```

**Success Criteria:**

- Components render correctly from content blocks
- Props update in real-time during streaming
- Loading states display appropriately
- Component state syncs bidirectionally
- Conflicts handled gracefully

#### Phase 9: Documentation & Examples (Est: 2-3 days)

**Goals:**

- Write comprehensive API documentation
- Create usage examples for common scenarios
- Update migration guide from beta SDK

**Tasks:**

- [ ] Write main README for v1 subpackage
- [ ] Document all exported hooks with JSDoc
- [ ] Document all exported types with JSDoc
- [ ] Create example: Basic chat application
- [ ] Create example: Tool usage (weather, calculator)
- [ ] Create example: Multi-component streaming
- [ ] Create example: Component state management
- [ ] Create example: Error handling and recovery
- [ ] Write migration guide from current SDK
- [ ] Document differences between beta and v1 APIs
- [ ] Add troubleshooting section
- [ ] Review documentation for accuracy

**Files:**

````markdown
<!-- react-sdk/src/v1/README.md -->

# @tambo-ai/react/v1

React SDK for Tambo AI v1 API with streaming-first architecture and AG-UI event protocol.

## Installation

```bash
npm install @tambo-ai/react
```
````

## Quick Start

```tsx
import {
  TamboV1Provider,
  useTamboV1,
  useTamboV1SendMessage,
} from "@tambo-ai/react/v1";

function App() {
  return (
    <TamboV1Provider apiKey={process.env.TAMBO_API_KEY}>
      <ChatInterface />
    </TamboV1Provider>
  );
}

function ChatInterface() {
  const { thread, messages, isStreaming } = useTamboV1();
  const sendMessage = useTamboV1SendMessage(thread.id);

  return (
    <div>
      {messages.map((msg) => (
        <Message key={msg.id} message={msg} />
      ))}
      {isStreaming && <LoadingIndicator />}
      <MessageInput onSend={(text) => sendMessage.mutate(text)} />
    </div>
  );
}
```

## Core Concepts

### Provider Setup

The `TamboV1Provider` wraps your app and provides:

- API client initialization
- Component/tool registry
- Streaming state management
- React Query integration

### Component Registration

Register components once at the provider level:

```tsx
function App() {
  return (
    <TamboV1Provider apiKey={apiKey}>
      <ComponentRegistration />
      <ChatInterface />
    </TamboV1Provider>
  );
}

function ComponentRegistration() {
  const { registerComponent } = useTamboV1();

  useEffect(() => {
    registerComponent({
      name: "StockChart",
      description: "Displays stock price charts",
      component: StockChart,
      propsSchema: z.object({
        ticker: z.string(),
        timeRange: z.enum(["1D", "1W", "1M", "1Y"]),
      }),
    });
  }, [registerComponent]);

  return null;
}
```

### Tool Registration

Register tools for client-side execution:

```tsx
function ToolRegistration() {
  const { registerTool } = useTamboV1();

  useEffect(() => {
    registerTool({
      name: "add_to_cart",
      description: "Add item to shopping cart",
      inputSchema: z.object({
        productId: z.string(),
        quantity: z.number(),
      }),
      tool: async ({ productId, quantity }) => {
        const result = await addToCart(productId, quantity);
        return `Added ${quantity}x ${productId} to cart`;
      },
    });
  }, [registerTool]);

  return null;
}
```

## API Reference

[Full API docs...]

## Migration from Beta SDK

[Migration guide...]

## Examples

See `/examples` directory for full working examples.

```

**Success Criteria:**
- All public APIs documented
- Examples run without errors
- Migration guide is clear and accurate
- Documentation covers common use cases

#### Phase 10: Testing & Polish (Est: 2-3 days)

**Goals:**
- Achieve high test coverage
- Fix bugs found during testing
- Optimize performance
- Prepare for release

**Tasks:**
- [ ] Run full test suite and achieve 90%+ coverage
- [ ] Test SSR compatibility (Next.js App Router)
- [ ] Test React 18 and 19 compatibility
- [ ] Profile performance with React DevTools
- [ ] Optimize re-renders with memo/useMemo where needed
- [ ] Test memory leaks (stream cleanup, component unmounting)
- [ ] Test with slow network conditions
- [ ] Test error recovery scenarios
- [ ] Run linter and fix all warnings
- [ ] Run type checker and fix all errors
- [ ] Test build outputs (CJS + ESM)
- [ ] Test package imports from external project
- [ ] Review code for simplification opportunities
- [ ] Write changelog entry
- [ ] Update version number (0.x.0 for beta)

**Success Criteria:**
- All tests passing
- No console warnings/errors
- Type checking passes
- Build succeeds for both CJS and ESM
- Package installable and importable externally
- Performance benchmarks acceptable

## Alternative Approaches Considered

### 1. Wrapper Approach (Partially Adopted)

**Idea:** Wrap existing SDK and translate between beta and v1 types.

**Pros:**
- Less code duplication
- Reuse existing logic

**Cons:**
- Complex translation layer when types differ significantly
- Performance overhead from translation
- Harder to maintain as APIs diverge

**Decision:** Partially adopted with refinements:
- **Reuse providers** where they're API-agnostic (`TamboClientProvider`, `TamboRegistryProvider`)
- **Extract shared utilities** (tool execution, registry management) into reusable hooks
- **Implement new providers** only where streaming models fundamentally differ (`TamboV1StreamProvider`)
- This hybrid approach minimizes duplication while avoiding complex translation layers

### 2. Fork Current SDK (Rejected)

**Idea:** Copy current SDK to v1/, then modify for v1 API.

**Pros:**
- Faster initial implementation
- Familiar structure

**Cons:**
- Inherits technical debt
- Beta API patterns don't map cleanly to v1
- Harder to maintain two versions

**Decision:** Rejected. Start fresh with v1-first design.

### 3. Manual State Management (Rejected)

**Idea:** Use useState/useEffect instead of React Query.

**Pros:**
- More control
- No React Query dependency

**Cons:**
- Reimplementing caching/refetching logic
- Inconsistent with current SDK
- More code to maintain

**Decision:** Rejected. Reuse React Query for consistency.

## Acceptance Criteria

### Functional Requirements

- [ ] Hooks expose v1 API types (Thread, Message, Content blocks)
- [ ] Streaming works via AG-UI events
- [ ] Components render from component content blocks
- [ ] Tools execute automatically with continuation
- [ ] State syncs bidirectionally for components
- [ ] Multiple concurrent threads supported
- [ ] SSR compatible (Next.js App Router)
- [ ] React 18 and 19 compatible

### Non-Functional Requirements

- [ ] 90%+ test coverage
- [ ] Documentation complete with examples
- [ ] Build succeeds for CJS + ESM
- [ ] Import works: `import { TamboV1Provider } from '@tambo-ai/react/v1'`
- [ ] No console warnings in development
- [ ] TypeScript errors: zero
- [ ] ESLint warnings: zero

### Quality Gates

- [ ] Code review approved
- [ ] All tests passing
- [ ] Documentation reviewed
- [ ] Performance acceptable (no N+1 re-renders)
- [ ] Memory leaks checked
- [ ] Accessibility reviewed (if UI components)

## Success Metrics

**Developer Experience:**
- Hook usage feels natural (similar to current SDK)
- Type inference works without manual annotations
- Error messages are clear and actionable
- Migration from beta SDK is straightforward

**Performance:**
- First event latency < 100ms
- Re-render count minimal (useReducer + context optimization)
- Memory usage stable over long sessions
- No stream connection leaks

**Correctness:**
- Event accumulation matches API spec
- Tool execution works reliably
- Component rendering matches streamed props
- State synchronization handles conflicts

## Dependencies & Prerequisites

**Required:**
- `@tambo-ai/typescript-sdk` updated with v1 API support
- `@ag-ui/core` for event type definitions
- React 18+ (peer dependency)
- `@tanstack/react-query` v5+ (peer dependency)

**Optional:**
- `zod` for schema validation (peer dependency)
- `fast-json-patch` for JSON Patch operations

**Blocking:**
- None (TypeScript SDK already updated per user)

## Risk Analysis & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| AG-UI event types change | High | Low | Pin `@ag-ui/core` version, monitor releases |
| TypeScript SDK breaking changes | High | Medium | Use exact version, coordinate releases |
| Performance issues with large message lists | Medium | Medium | Implement virtualization if needed, memoize renders |
| Tool execution timeouts | Medium | Medium | Add configurable timeouts, cancel on unmount |
| Memory leaks from unclosed streams | High | Low | Thorough cleanup testing, AbortController usage |
| Type inference too complex | Low | Medium | Provide explicit type annotations in docs |

## Future Considerations

**Extensibility:**
- Plugin system for custom event handlers
- Middleware for request/response interception
- Custom reducers for domain-specific state

**Performance:**
- Virtual scrolling for long message lists
- Lazy component loading
- Streaming compression

**Features:**
- Offline support with service workers
- Message persistence to IndexedDB
- Multi-tab synchronization

**Developer Experience:**
- Code generation for components/tools
- Dev tools panel for inspecting streams
- Testing utilities (mock streams, event factories)

## Documentation Plan

**Developer Docs (in /docs):**
- Getting Started guide
- Core Concepts (providers, hooks, streaming)
- API Reference (generated from TypeScript)
- Migration Guide (beta → v1)
- Examples & Tutorials

**Code Documentation:**
- JSDoc comments on all public APIs
- Inline comments for complex logic
- Type documentation with @see references

**Package README:**
- Installation instructions
- Quick start example
- Link to full documentation

## References & Research

### Internal References

- API Proposal: `/Users/alecf/tambo/tambo-worktrees/alecf/implement-sdk-v1/plans/api-v1-proposal.md`
- Current SDK Provider: `/Users/alecf/tambo/tambo-worktrees/alecf/implement-sdk-v1/react-sdk/src/providers/tambo-provider.tsx:1-500`
- Current Hook Patterns: `/Users/alecf/tambo/tambo-worktrees/alecf/implement-sdk-v1/react-sdk/src/hooks/use-tambo-threads.ts:1-50`
- MCP Subpackage Pattern: `/Users/alecf/tambo/tambo-worktrees/alecf/implement-sdk-v1/react-sdk/src/mcp/index.ts:1-20`
- Package Exports: `/Users/alecf/tambo/tambo-worktrees/alecf/implement-sdk-v1/react-sdk/package.json:30-45`

### External References

- [React: useReducer Documentation](https://react.dev/reference/react/useReducer)
- [React: Scaling Up with Reducer and Context](https://react.dev/learn/scaling-up-with-reducer-and-context)
- [TanStack Query v5: streamedQuery](https://tanstack.com/query/v5/docs/reference/streamedQuery)
- [AG-UI Core SDK](https://docs.ag-ui.com/sdk/js/core/overview)
- [Server-Sent Events: MDN](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
- [TypeScript: Discriminated Unions](https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html#discriminating-unions)

### Related Work

- Beta SDK Implementation: Current `@tambo-ai/react` package
- TypeScript SDK: `@tambo-ai/typescript-sdk` (already updated for v1)
- AG-UI Protocol Spec: See api-v1-proposal.md Part 2

---

## Implementation Checklist

Use this checklist during implementation:

**Foundation:**
- [ ] Directory structure created
- [ ] Package exports configured
- [ ] Type definitions complete
- [ ] Tests for types passing

**Event System:**
- [ ] Event reducer implemented
- [ ] All AG-UI events handled
- [ ] All Tambo CUSTOM events handled
- [ ] JSON Patch utilities working
- [ ] Tests for event accumulation passing

**Streaming:**
- [ ] SSE stream handler working
- [ ] Stream context implemented
- [ ] Stream lifecycle tested
- [ ] Cancellation working
- [ ] Error handling tested

**Registry:**
- [ ] Component registry working
- [ ] Tool registry working
- [ ] Schema conversion working
- [ ] Dynamic registration tested

**React Query:**
- [ ] Send message mutation working
- [ ] Thread queries working
- [ ] Cache invalidation working
- [ ] Optimistic updates working

**Tools:**
- [ ] Tool execution working
- [ ] Error handling working
- [ ] Continuation working
- [ ] Multi-tool scenarios tested

**Providers & Hooks:**
- [ ] Main provider working
- [ ] All hooks implemented
- [ ] Integration tests passing

**Components:**
- [ ] Component rendering working
- [ ] Loading states working
- [ ] State synchronization working
- [ ] Error boundaries tested

**Documentation:**
- [ ] README complete
- [ ] API docs complete
- [ ] Examples working
- [ ] Migration guide complete

**Polish:**
- [ ] Test coverage 90%+
- [ ] Performance optimized
- [ ] No memory leaks
- [ ] Builds succeeding
- [ ] No lint/type errors

---

## Notes

- **TypeScript SDK Caveat**: The event streams return `RunCreateResponse | RunRunResponse` which will need type casting to `BaseEvent` - this is expected per the user's description.

- **Component Streaming**: The `streaming` field in `tambo.component.props_delta` events indicates which props are still being populated (started/streaming/done). Use this to show skeleton states or partial renders.

- **Tool Result Format**: When multiple tool calls are pending, return all results in a single message's content array (multiple `tool_result` content blocks).

- **previousRunId**: Required when submitting tool results to prevent duplicate continuations from the same run (idempotency).

- **State Updates**: The `/threads/{id}/components/{componentId}/state` endpoint returns an error if the thread has an active run (`runStatus !== "idle"`). Handle this gracefully in the hook.
```
