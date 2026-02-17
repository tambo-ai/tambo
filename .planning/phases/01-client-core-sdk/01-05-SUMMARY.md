# Plan 01-05 Summary: Tool Registry & Execution Loop

## What was done

1. **Created `tools.ts`** — `createToolRegistry()` factory function with `ToolRegistry` interface
   - Register tools with Zod input/output schemas
   - Execute tools by name with JSON args parsing + Zod validation
   - Convert to API format (JSON Schema) via `zod-to-json-schema`
   - Error handling: unknown tools, invalid args, execution failures all return `ToolResult` with `isError`

2. **Created `run.ts`** — `executeRun()` function for streaming runs with automatic tool call loop
   - Streams SDK `runs.run()`, collects text and tool call events
   - Executes pending tool calls in parallel via registry
   - Sends results back as next round with `previousRunId` continuity
   - Max tool rounds guard (defaults to 10) prevents infinite loops
   - `onEvent` callback for streaming event observation
   - Local `StreamEventData` interface to safely cast SDK's sparse `RunRunResponse` type

3. **Added types** — `ToolDefinition<TInput, TOutput>` and `ToolResult` to `types.ts`

4. **Updated exports** — `createToolRegistry`, `ToolRegistry`, `executeRun`, `RunOptions`, `ToolDefinition`, `ToolResult`

## Tests

- `tools.test.ts`: 8 tests (register, execute, duplicate, unknown tool, invalid args, execution error, malformed JSON, has/clear/toApiFormat)
- `run.test.ts`: 7 tests (text collection, onEvent callback, tool call loop, no-registry error, max rounds, error handling, tools in API format)
- All 51 tests passing across 7 test files

## Dependencies added

- `zod-to-json-schema: ^3.24.6` (for converting Zod schemas to JSON Schema in tool API format)
