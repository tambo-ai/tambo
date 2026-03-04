---
title: "Rebase on main and replace client-core with @tambo-ai/client in CLI"
type: refactor
status: completed
date: 2026-03-04
deepened: 2026-03-04
---

# Rebase on main and replace client-core with @tambo-ai/client in CLI

## Enhancement Summary

**Deepened on:** 2026-03-04
**Research agents used:** architecture-strategist, kieran-typescript-reviewer, pattern-recognition-specialist, code-simplicity-reviewer, TamboStream deep-dive, react-sdk pattern analysis

### Key Improvements

1. **Critical fix**: Use `wrapTool()` helper instead of embedding side effects in tool functions — preserves separation of concerns
2. **Soft round limit**: Use `autoExecuteTools: false` with manual tool dispatch loop instead of AbortController — preserves pause/resume/prompt behavior
3. **Removed YAGNI**: Drop `outputSchema` addition from plan — unnecessary
4. **Event type mapping**: Documented exact TamboStream event types and `tambo.run.awaiting_input` for round counting
5. **Thread creation**: Confirmed `client.run()` auto-creates threads when no `threadId` — simplifies code

### New Considerations Discovered

- The `as any` cast in current code (line 234) is a symptom of the wrapping pattern fighting generics — the `wrapTool()` helper fixes this
- Event type casing may differ between client-core (UPPER_SNAKE_CASE) and @tambo-ai/client (AG-UI EventType enum) — verify at implementation time
- TamboStream yields `{ event, snapshot }` objects, not raw events — iteration code must destructure
- Tests are tightly coupled to mock call signatures and must be rewritten against behavior, not implementation

---

## Overview

The `lachieh/magic-cli` branch created a lightweight `@tambo-ai/client-core` package for the CLI's magic-init feature. Meanwhile, `main` extracted `@tambo-ai/client` (v1.0.1) from the react-sdk as the official framework-agnostic client. This branch is 42 commits behind main. We need to:

1. Rebase on main to pick up `@tambo-ai/client` and other changes
2. Replace all `@tambo-ai/client-core` imports in the CLI with `@tambo-ai/client`
3. Remove the `packages/client-core` package entirely (it only exists on this branch)

## Problem Statement

Two competing client packages exist across branches:

- `@tambo-ai/client-core` (v0.0.1, this branch only) — lightweight SDK wrapper with `createTamboClient`, `createToolRegistry`, `executeRun`
- `@tambo-ai/client` (v1.0.1, main) — full framework-agnostic client with `TamboClient` class, `TamboStream`, tool execution

After rebase, `@tambo-ai/client` will be available and `client-core` should be deleted.

## API Migration Mapping

### Type Changes

| client-core                       | @tambo-ai/client             | Notes                                  |
| --------------------------------- | ---------------------------- | -------------------------------------- |
| `ToolDefinition<TInput, TOutput>` | `TamboTool<TInput, TOutput>` | `execute` → `tool`, same `inputSchema` |

### Function/Class Changes

| client-core                                        | @tambo-ai/client                                               | Notes                                         |
| -------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------- |
| `createTamboClient({ apiKey, userKey, baseUrl })`  | `new TamboClient({ apiKey, userKey, tamboUrl })`               | Factory → constructor, `baseUrl` → `tamboUrl` |
| `createToolRegistry()` + `registry.register(tool)` | Pass `TamboTool[]` to `TamboClient` constructor `tools` option | No separate registry object                   |
| `executeRun(client, threadId, message, opts)`      | `client.run(message, { threadId, ...opts })` → `TamboStream`   | Returns async iterable stream                 |
| `client.threads.create({ metadata })`              | Thread auto-created by `client.run()` when no `threadId`       | No explicit thread creation needed            |

### Stream Event Handling

TamboStream yields `StreamEvent` objects:

```typescript
interface StreamEvent {
  event: BaseEvent; // AG-UI event (TEXT_MESSAGE_CONTENT, TOOL_CALL_START, etc.)
  snapshot: TamboThread; // Complete thread state after this event
}
```

Key events for CLI migration:

- `TEXT_MESSAGE_CONTENT` — text deltas (for collecting response text)
- `TOOL_CALL_START` / `TOOL_CALL_ARGS` / `TOOL_CALL_END` — tool call lifecycle
- `tambo.run.awaiting_input` (CUSTOM event) — marks end of a tool round, signals tools need execution
- `RUN_STARTED` / `RUN_FINISHED` / `RUN_ERROR` — run lifecycle

### Research Insights: TamboStream Internals

**autoExecuteTools loop:**

1. Streams events until `tambo.run.awaiting_input`
2. If `autoExecuteTools: true` and `stepCount < maxSteps`: executes pending tools, dispatches results, creates continuation stream, loops
3. `maxSteps` counts tool execution rounds, not events
4. Tools executed **sequentially** (not parallel) to prevent race conditions

**AbortSignal support:**

- Constructor accepts `signal?: AbortSignal`
- On abort: dispatches `RUN_ERROR` with `"Stream aborted"`, async iterator ends cleanly
- `.thread` promise rejects with `AbortError`

**Thread auto-creation:**

- `threadId: undefined` → calls `client.threads.runs.create()` (new thread)
- `threadId: string` → calls `client.threads.runs.run()` (existing thread)
- Thread ID extracted from first `RUN_STARTED` event

## Files to Change

### 1. `cli/package.json`

- Remove `"@tambo-ai/client-core": "*"` dependency
- Add `"@tambo-ai/client": "*"` dependency

### 2. `cli/src/utils/code-execution/agent-tools.ts`

- Change `import type { ToolDefinition } from "@tambo-ai/client-core"` → `import type { TamboTool } from "@tambo-ai/client"`
- Change all `ToolDefinition<TInput, TOutput>` type annotations → `TamboTool<TInput, TOutput>`
- Rename `execute` property → `tool` on each tool definition
- **Do NOT add `outputSchema`** — YAGNI, the LLM doesn't use it for tool selection

### 3. `cli/src/utils/code-execution/index.ts` (most complex)

**Client creation:**

- Replace `createTamboClient(...)` → `new TamboClient({ apiKey, userKey, tamboUrl })`
- Remove explicit `client.threads.create()` — let `client.run()` auto-create

**Tool wrapping (critical — use `wrapTool()` helper):**

Do NOT embed spinner/tracking logic in tool functions. Keep `agentTools` pure. Create a `wrapTool()` helper that preserves separation of concerns:

```typescript
function wrapTool<TInput, TOutput>(
  tool: TamboTool<TInput, TOutput>,
  callbacks: {
    onExecute: (name: string, input: TInput) => void;
    onSuccess: (name: string, input: TInput, result: TOutput) => void;
    onError: (name: string, input: TInput, err: Error) => void;
  },
): TamboTool<TInput, TOutput> {
  return {
    ...tool,
    tool: async (input: TInput) => {
      callbacks.onExecute(tool.name, input);
      try {
        const result = await tool.tool(input);
        callbacks.onSuccess(tool.name, input, result);
        return result;
      } catch (err) {
        callbacks.onError(
          tool.name,
          input,
          err instanceof Error ? err : new Error(String(err)),
        );
        throw err;
      }
    },
  };
}
```

Then in `executeCodeChanges()`:

```typescript
const wrappedTools = agentTools.map((tool) =>
  wrapTool(tool, {
    onExecute: (name, input) => {
      // spinner updates, file tracking, retry check
    },
    onSuccess: (name, input, result) => {
      // reset consecutive failures, plan step tracking
    },
    onError: (name, input, err) => {
      // increment consecutive failures
    },
  }),
);
```

This eliminates the `as any` cast and preserves generic type safety.

**Agentic loop (use `autoExecuteTools: false` with manual dispatch):**

The soft round limit requires pause/prompt/resume which `autoExecuteTools: true` + AbortController cannot support. Instead, use `autoExecuteTools: false` and manually handle tool execution:

```typescript
import {
  TamboClient,
  type TamboTool,
  type StreamEvent,
  asTamboCustomEvent,
} from "@tambo-ai/client";

const client = new TamboClient({
  apiKey: options.apiKey,
  userKey: options.userKey ?? "cli",
  tamboUrl: options.baseUrl,
  tools: wrappedTools,
});

const stream = client.run(prompt, {
  autoExecuteTools: false,
  maxSteps: 200,
});

let roundCount = 0;
let responseText = "";

for await (const { event, snapshot } of stream) {
  switch (event.type) {
    case "TEXT_MESSAGE_CONTENT":
      responseText += event.delta;
      options.onProgress?.(event.delta);
      setStatus("Agent is working...");
      break;
    case "TOOL_CALL_START":
      setStatus(`Calling ${event.toolCallName ?? "tool"}...`);
      break;
    case "TOOL_CALL_ARGS":
      setStatus(`Receiving ${event.toolCallName ?? "tool"} data...`);
      break;
    case "CUSTOM": {
      const custom = asTamboCustomEvent(event);
      if (custom?.name === "tambo.run.awaiting_input") {
        roundCount++;
        // Soft round limit check
        if (roundCount === SOFT_ROUND_LIMIT && !extendedLimit) {
          spinner.stop();
          // ... prompt user, set extendedLimit or abort
        }
        // Execute pending tools manually
        // ... dispatch results, continue stream
      }
      break;
    }
    case "RUN_ERROR":
      setStatus(chalk.red(`Agent error: ${event.message ?? "unknown"}`));
      break;
  }
}
```

**Alternative: If manual tool dispatch is too complex**, use `autoExecuteTools: true` with `maxSteps: SOFT_ROUND_LIMIT`, then on completion check if there are pending tool calls. If so, prompt the user and start a new `client.run()` on the same thread to continue. This is simpler but changes the single-stream model.

### 4. `cli/src/utils/plan-generation/index.ts` (simple)

This is straightforward — just iterate stream and collect text:

```typescript
const client = new TamboClient({
  apiKey: options.apiKey,
  userKey: options.userKey ?? "cli",
  tamboUrl: options.baseUrl,
});

const stream = client.run(prompt, {
  autoExecuteTools: false, // no tools needed
});

let responseText = "";
for await (const { event } of stream) {
  if (event.type === "TEXT_MESSAGE_CONTENT" && event.delta) {
    responseText += event.delta;
    options.onProgress?.(event.delta);
  }
}
```

No AbortController, no round tracking, no tool wrapping. ~10 lines changed.

### 5. Delete `packages/client-core/` entirely

- Remove the directory after rebase (it won't exist on main anyway, but clean up any remnants)

### 6. Update tests

Current tests mock `@tambo-ai/client-core` as a module with exact call signatures. All mocks must be rewritten:

**Key changes:**

- Mock `TamboClient` constructor instead of `createTamboClient`
- Mock `client.run()` to return a mock async iterable instead of `executeRun` returning text
- Remove assertions on `mockRegistry.register` call count
- Test observable behavior (files tracked, spinner states, text collected) not mock call counts

**Test files affected:**

- `cli/src/utils/code-execution/index.test.ts` — full rewrite of mocking strategy
- `cli/src/utils/plan-generation/index.test.ts` — simpler, just mock stream iteration

## Acceptance Criteria

- [ ] Branch rebased on main with no conflicts (or conflicts resolved)
- [ ] All `@tambo-ai/client-core` imports replaced with `@tambo-ai/client`
- [ ] `packages/client-core/` deleted if any remnants remain after rebase
- [ ] `cli/package.json` depends on `@tambo-ai/client`, not `client-core`
- [ ] `wrapTool()` helper used — no side effects in tool definitions
- [ ] No `as any` casts in tool wrapping code
- [ ] Soft round limit still prompts user interactively
- [ ] `npm run check-types` passes (cli workspace at minimum)
- [ ] `npm run lint` passes
- [ ] `npm test` passes (tests updated for new API)
- [ ] Code execution flow still works: tool registration, agentic loop, progress tracking, soft round limit
- [ ] Plan generation flow still works: text collection from stream

## Implementation Strategy

### Phase 1: Rebase

```bash
git fetch origin main
git rebase origin/main
# Resolve conflicts — client-core won't exist on main, so conflicts are additions-only
```

### Phase 2: Update CLI dependency

Update `cli/package.json`: remove `@tambo-ai/client-core`, add `@tambo-ai/client`.

### Phase 3: Migrate agent-tools.ts (lowest risk)

Rename `ToolDefinition` → `TamboTool` and `execute` → `tool`. Keep tools pure — no side effects.

### Phase 4: Migrate plan-generation/index.ts (simple)

Replace client creation and `executeRun` with `TamboClient` + stream iteration to collect text. ~10 lines changed.

### Phase 5: Migrate code-execution/index.ts (most complex)

1. Create `wrapTool()` helper for side-effect injection
2. Replace `createToolRegistry()` + `registry.register()` with `agentTools.map(t => wrapTool(t, callbacks))`
3. Replace `createTamboClient()` with `new TamboClient()`
4. Replace `executeRun()` with `client.run()` + stream iteration
5. Implement soft round limit via either:
   - a) `autoExecuteTools: false` + manual tool dispatch (full control, more code)
   - b) `autoExecuteTools: true` + `maxSteps: SOFT_ROUND_LIMIT` + re-run on same thread (simpler, less control)

### Phase 6: Update tests

Rewrite mocks for new API. Test behavior, not implementation details.

### Phase 7: Cleanup & verify

Delete `packages/client-core/` remnants, run `npm run lint`, `npm run check-types`, `npm test`.

## Technical Considerations

### TamboStream vs executeRun

`executeRun` was a convenience that ran the full agentic loop and returned text. `TamboStream` is an async iterable yielding `{ event, snapshot }` pairs. The stream handles tool execution internally when `autoExecuteTools: true`.

**Key difference:** `executeRun` returned `Promise<string>` (collected text). With `TamboStream`, text must be accumulated from `TEXT_MESSAGE_CONTENT` events manually. This is simple but must not be forgotten.

### Tool Wrapping Architecture (Critical Decision)

**Do NOT embed side effects in tool functions.** The architecture review found this would violate Single Responsibility and couple pure filesystem tools to CLI presentation concerns.

Use the `wrapTool()` helper pattern:

- `agent-tools.ts` stays pure (filesystem operations only)
- `code-execution/index.ts` wraps tools with callbacks for tracking/progress
- Generic types preserved — no `as any` casts needed
- Each wrapper owns its own retry counter (no shared Map)

### Soft Round Limit (Critical Decision)

**Option A: `autoExecuteTools: false` + manual dispatch** (recommended for full control)

- Iterate stream, detect `tambo.run.awaiting_input` events
- Execute tools manually, dispatch results, continue
- Can pause mid-loop to prompt user
- More code (~30 lines of loop management)

**Option B: `autoExecuteTools: true` + `maxSteps: SOFT_ROUND_LIMIT`** (simpler)

- Let TamboStream handle the loop up to the soft limit
- When stream ends, check if there are pending tool calls
- If so, prompt user, then start new `client.run()` on same thread with `previousRunId`
- Simpler but changes single-stream assumption

**Option B is recommended** for simplicity. The `previousRunId` parameter links continuation runs correctly.

### Event Type Casing

Verify at implementation time whether events use:

- AG-UI's `EventType` enum (e.g., `EventType.TEXT_MESSAGE_CONTENT`)
- String literals (e.g., `"TEXT_MESSAGE_CONTENT"`)
- Different casing from client-core

Mismatched casing on event types is a silent runtime bug with no type error.

### Thread Metadata

The current code creates threads with `metadata: { purpose: "magic-init-execution" }`. `TamboClient.run()` auto-creates threads without metadata. If metadata is needed, access the underlying SDK via the client instance. If not needed (likely), just drop it.

## Sources

- `packages/client/src/index.ts` (main branch) — client exports
- `packages/client/src/tambo-client.ts` (main branch) — TamboClient class, RunOptions
- `packages/client/src/tambo-stream.ts` (main branch) — TamboStream internals, event loop, AbortSignal
- `packages/client/src/model/component-metadata.ts` (main branch) — TamboTool type
- `packages/client/src/utils/send-message.ts` (main branch) — createRunStream, executeToolsAndContinue
- `packages/client/src/utils/tool-executor.ts` (main branch) — executeAllPendingTools, executeClientTool
- `cli/src/utils/code-execution/index.ts` — current client-core usage
- `cli/src/utils/plan-generation/index.ts` — current client-core usage
- `cli/src/utils/code-execution/agent-tools.ts` — current ToolDefinition usage
