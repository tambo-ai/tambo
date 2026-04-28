# AGENTS.md

Detailed guidance for Claude Code agents working with the `@tambo-ai/client` package.

## Overview

Framework-agnostic client for Tambo AI. Provides streaming, tool execution, thread management, and MCP integration without React dependencies. This package is the core engine used by `@tambo-ai/react`.

## Essential Commands

```bash
pnpm build -w packages/client    # Build CJS + ESM
pnpm check-types -w packages/client  # TypeScript type checking
pnpm test -w packages/client     # Run tests
pnpm lint -w packages/client     # ESLint
pnpm clean -w packages/client    # Remove build artifacts
```

## Architecture

### Core Classes

- **`TamboClient`** (`src/tambo-client.ts`) - Main client class. Manages state via `getState()`/`subscribe()` (compatible with `useSyncExternalStore`). Handles thread management, tool registration, MCP connections, and suggestions.
- **`TamboStream`** (`src/tambo-stream.ts`) - Streaming response handler. Returns from `client.run()`. Two consumption modes: async iteration (`for await...of`) and `.thread` promise.

### State Management

`TamboClient` owns its state directly via an internal `streamReducer` (event accumulator). No separate store abstraction. State changes are batched via `queueMicrotask` and delivered to subscribers.

Key state shape (`ClientState`):

- `currentThreadId` - Active thread
- `threadMap` - Map of thread ID to `ThreadState` (thread data + streaming state + accumulating tool args)

### Streaming Pipeline

1. `client.run()` creates a `TamboStream`
2. `TamboStream` constructor fires a processing loop (fire-and-forget)
3. Processing loop calls `createRunStream()` to get an AG-UI event stream
4. Events flow through `handleEventStream()` → `streamReducer` → state updates
5. Tool calls trigger `executeToolsAndContinue()` for stitchable continuation streams
6. `.thread` promise resolves when the loop completes

### Key Directories

- `src/types/` - TypeScript interfaces (thread, message, event, auth, tool-choice)
- `src/model/` - Component and tool metadata types, MCP server info
- `src/utils/` - Event accumulator, stream handler, tool executor, send-message utilities
- `src/schema/` - JSON Schema conversion, Standard Schema support, validation
- `src/mcp/` - MCP client, elicitation types

### Relationship to react-sdk

`@tambo-ai/react` depends on this package. Most react-sdk type/utility files are thin re-exports from `@tambo-ai/client`. React-specific extensions:

- `TamboComponentContent` adds `renderedComponent?: ReactElement`
- `TamboComponent`/`RegisteredComponent` use `ComponentType<any>` instead of `unknown`
- Hooks (`useTambo`, `useTamboThreadInput`, etc.) wrap `TamboClient` with React state management

## Development Rules

- Do not add React dependencies. This package must remain framework-agnostic.
- All public types are exported from `src/index.ts`.
- Follow the same coding standards as the root `AGENTS.md`.
- The `@tambo-ai/typescript-sdk` is a regular dependency (not dev) since its types leak through re-exports.
