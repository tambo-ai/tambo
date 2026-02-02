# AGENTS.md

Detailed guidance for Claude Code agents working with the Svelte SDK package.

## Project Overview

This is the **@tambo-ai/svelte** package - the core Svelte SDK for building AI-powered generative UI applications with SvelteKit. It provides stores, providers, hooks, and utilities that enable AI to dynamically generate and manage Svelte components through natural language interaction.

## Essential Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build the package for distribution
npm run check            # Svelte type checking
npm run check:watch      # Svelte type checking in watch mode
npm test                 # Run Vitest tests
npm run test:watch       # Run tests in watch mode
npm run lint             # ESLint code checking
npm run lint:fix         # Auto-fix lint issues
npm run format           # Prettier formatting
npm run clean            # Remove build artifacts
```

## Architecture Overview

### Core Design Principles

1. **SSR-Safe**: No module-level singletons. Client instances are created per-context via factory functions.
2. **Svelte 5 Runes**: All state management uses `$state`, `$derived`, and `$effect` for automatic reactivity.
3. **Proper Abort Handling**: AbortController signals are wired through to advanceStream for real cancellation.
4. **Context-Based**: All shared state is passed through Svelte context, not module-level variables.

### Package Structure

```
src/
├── index.ts                      # Main exports
├── lib/
│   ├── client.ts                 # SSR-safe client factory
│   ├── context.ts                # Context keys
│   └── types.ts                  # TypeScript types
├── stores/
│   ├── thread.svelte.ts          # Thread + streaming state
│   ├── registry.svelte.ts        # Component/tool registration
│   ├── input.svelte.ts           # Input state management
│   ├── stream-status.svelte.ts   # Stream status tracking
│   ├── interactable.svelte.ts    # Interactable components
│   └── component-state.svelte.ts # Component state sync
├── providers/
│   ├── TamboProvider.svelte      # Main provider
│   ├── TamboMessageProvider.svelte
│   └── TamboMcpProvider.svelte   # MCP support
├── hooks/
│   ├── useTambo.ts               # Combined context hook
│   ├── useTamboThread.ts
│   ├── useTamboClient.ts
│   └── ... (other hook functions)
├── mcp/
│   ├── index.ts
│   └── client.ts                 # MCP client wrapper
├── util/
│   ├── registry.ts               # defineTool helper
│   ├── tool-caller.ts            # Tool execution
│   ├── debounce.ts               # Debounce with flush
│   └── deep-equal.ts
└── context-helpers/
    ├── index.ts
    ├── current-page.ts
    └── current-time.ts
```

### Provider Hierarchy

The SDK uses a nested provider hierarchy:

1. **TamboProvider** - Main entry point, composes all sub-providers
2. **TamboClientProvider** - API client via context
3. **TamboRegistryProvider** - Component and tool registration
4. **TamboThreadProvider** - Thread and message management
5. **TamboInteractableProvider** - Interactive component tracking
6. **TamboMcpProvider** - Model Context Protocol support

### Key Patterns

#### Store Creation (SSR-Safe)

```typescript
// WRONG - Module-level singleton
let client: TamboAI | null = null;
export function getClient() {
  if (client) return client;
  client = new TamboAI({ apiKey });
  return client;
}

// CORRECT - Factory function, instance per context
export function createTamboClient(options: ClientOptions): TamboAI {
  return new TamboAI({ apiKey: options.apiKey, ... });
}
```

#### Svelte 5 Runes Pattern

```typescript
export function createThreadStore(client: TamboAI) {
  let thread = $state<TamboThread | null>(null);
  let generationStage = $state<GenerationStage>("idle");

  const isIdle = $derived(generationStage === "idle");
  const messages = $derived(thread?.messages ?? []);

  return {
    get thread() {
      return thread;
    },
    get generationStage() {
      return generationStage;
    },
    get isIdle() {
      return isIdle;
    },
    get messages() {
      return messages;
    },
    // ... methods
  };
}
```

#### Proper Abort Handling

```typescript
let currentAbortController = $state<AbortController | null>(null);

async function sendMessage(content: string) {
  currentAbortController?.abort();
  currentAbortController = new AbortController();

  const stream = await advanceStream(
    client,
    params,
    threadId,
    { signal: currentAbortController.signal }, // Pass signal!
  );
  // ...
}
```

## Development Guidelines

### TypeScript Standards

- Use strict TypeScript, no `any` types
- Use `$state<Type>()` for typed reactive state
- Use `$derived()` for computed values
- Let TypeScript infer return types where obvious

### Testing

- Unit tests for all stores and hooks
- Use `@testing-library/svelte` for component tests
- Test SSR safety by verifying no module-level state

### Adding New Features

1. Add types to `lib/types.ts`
2. Implement store in `stores/` using runes
3. Create hook in `hooks/` as context getter
4. Export from `index.ts`
5. Write tests

## Dependencies

- **@tambo-ai/typescript-sdk** - Core API client
- **fast-equals** - Deep equality checks
- **@standard-schema/spec** - Schema validation spec
- **type-fest** - TypeScript utilities

## Peer Dependencies

- **svelte** ^5.0.0 - Required
- **zod** ^3.25.0 || ^4.0.0 - Optional, for schema validation
