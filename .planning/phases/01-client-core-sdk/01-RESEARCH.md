# Phase 1: Client Core SDK - Research

**Researched:** 2026-02-11
**Domain:** TypeScript SDK for Tambo Cloud API
**Confidence:** HIGH

## Summary

Phase 1 builds `@tambo-ai/client-core`, a headless TypeScript SDK enabling non-React code (specifically the CLI) to interact with the Tambo Cloud API. This involves thread management, streaming SSE responses, tool registration with Zod schemas, automatic tool execution loops, retry logic with exponential backoff, and connection recovery.

The existing codebase already has `@tambo-ai/typescript-sdk` (external dependency at v0.92.0) that provides API client functionality and `@tambo-ai/react` which wraps it with React-specific hooks. This phase creates a parallel non-React package that can eventually replace or augment the API layer in react-sdk while giving the CLI immediate access to Tambo's API capabilities.

**Primary recommendation:** Build client-core as a pure TypeScript package with dual ESM/CJS output, reuse patterns from the existing typescript-sdk for API communication, adopt SSE streaming with fetch API (Node 18+), implement exponential backoff retry with the `exponential-backoff` library, and handle tool execution loops similar to the react-sdk's v1 implementation.

## Standard Stack

### Core

| Library                    | Version             | Purpose                                | Why Standard                                     |
| -------------------------- | ------------------- | -------------------------------------- | ------------------------------------------------ |
| TypeScript                 | ^5.9.3              | Type safety + compilation              | Repo standard, strict mode enforced              |
| Zod                        | ^3.25.76 or ^4      | Schema definition + runtime validation | Already used across SDK packages, tool schemas   |
| `@tambo-ai/typescript-sdk` | ^0.92.0             | Tambo API types + client patterns      | Existing official SDK, source of truth for types |
| fetch API                  | Built-in (Node 18+) | HTTP requests + SSE streaming          | Native in Node 18+, no extra deps needed         |

### Supporting

| Library             | Version | Purpose                       | When to Use                                      |
| ------------------- | ------- | ----------------------------- | ------------------------------------------------ |
| exponential-backoff | ^3.x    | Retry logic with backoff      | Failed requests, dropped connections             |
| type-fest           | ^5.4.3  | Advanced TypeScript utilities | Complex type manipulation (repo already uses it) |

### Alternatives Considered

| Instead of   | Could Use           | Tradeoff                                                                       |
| ------------ | ------------------- | ------------------------------------------------------------------------------ |
| fetch API    | eventsource package | fetch is native in Node 18+, eventsource adds dependency and only supports GET |
| Custom retry | p-retry             | exponential-backoff is lighter and more focused                                |
| Manual build | tsup/tshy           | tsc gives more control, matches react-sdk patterns                             |

**Installation:**

```bash
# Package will be workspace package, no external install needed
# Dependencies in client-core package.json:
npm install exponential-backoff type-fest zod
```

## Architecture Patterns

### Recommended Project Structure

```
packages/client-core/
├── src/
│   ├── client.ts           # Main TamboClient class
│   ├── threads.ts          # Thread management
│   ├── streaming.ts        # SSE stream handling
│   ├── tools.ts            # Tool registry + execution
│   ├── retry.ts            # Exponential backoff helpers
│   ├── types.ts            # Core types + interfaces
│   └── index.ts            # Public exports
├── dist/                   # CJS output
├── esm/                    # ESM output
├── tsconfig.json           # Base config
├── tsconfig.cjs.json       # CJS build config
├── tsconfig.esm.json       # ESM build config
└── package.json
```

### Pattern 1: Client Instantiation with Options Bag

**What:** TamboClient accepts configuration object with API key, base URL, optional settings
**When to use:** Following Azure SDK guidelines and existing typescript-sdk patterns
**Example:**

```typescript
// Follows Azure SDK pattern - options bag for constructor
interface TamboClientOptions {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

class TamboClient {
  constructor(options: TamboClientOptions) {
    // Validate required fields up-front
    if (!options.apiKey) {
      throw new Error("API key is required");
    }
    // Store config, initialize sub-clients
  }
}
```

### Pattern 2: SSE Streaming with Fetch + ReadableStream

**What:** Use native fetch API with response.body.getReader() for SSE streams
**When to use:** All streaming endpoints (thread runs, message streams)
**Example:**

```typescript
// Source: Node.js Fetch API (built-in since v18)
async function* streamEvents(url: string, headers: Record<string, string>) {
  const response = await fetch(url, {
    headers,
    method: "POST", // SSE supports POST with fetch, unlike EventSource
  });

  if (!response.body) throw new Error("No response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        yield JSON.parse(data);
      }
    }
  }
}
```

### Pattern 3: Tool Execution Loop with Zod Validation

**What:** Register tools with Zod schemas, execute on TOOL_CALL_ARGS events, send results back
**When to use:** Automatic tool handling (mirrors react-sdk v1 behavior)
**Example:**

```typescript
// Based on react-sdk/src/v1/hooks/use-tambo-v1-send-message.test.tsx patterns
import { z } from "zod";

interface Tool {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
  execute: (args: unknown) => Promise<unknown>;
}

async function handleToolCalls(
  toolCalls: Array<{ id: string; name: string; args: string }>,
  registry: Map<string, Tool>,
) {
  const results = await Promise.all(
    toolCalls.map(async (call) => {
      const tool = registry.get(call.name);
      if (!tool) {
        return {
          toolUseId: call.id,
          isError: true,
          content: [{ type: "text", text: `Tool "${call.name}" not found` }],
        };
      }

      try {
        // Parse and validate args with Zod
        const parsedArgs = JSON.parse(call.args);
        const validatedArgs = tool.inputSchema.parse(parsedArgs);
        const result = await tool.execute(validatedArgs);

        return {
          toolUseId: call.id,
          content: [{ type: "text", text: JSON.stringify(result) }],
        };
      } catch (error) {
        return {
          toolUseId: call.id,
          isError: true,
          content: [{ type: "text", text: error.message }],
        };
      }
    }),
  );

  return results;
}
```

### Pattern 4: Exponential Backoff Retry

**What:** Retry failed requests with exponential delay + jitter
**When to use:** All API calls, especially for transient network errors
**Example:**

```typescript
// Using exponential-backoff library (npm package)
import { backOff } from "exponential-backoff";

async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  options?: {
    numOfAttempts?: number;
    startingDelay?: number;
    maxDelay?: number;
    jitter?: "full" | "none";
  },
): Promise<T> {
  return backOff(fn, {
    numOfAttempts: options?.numOfAttempts ?? 3,
    startingDelay: options?.startingDelay ?? 1000,
    maxDelay: options?.maxDelay ?? 30000,
    jitter: options?.jitter ?? "full",
    retry: (error, attemptNumber) => {
      // Only retry on network/5xx errors, not client errors
      if (error.status && error.status < 500) return false;
      console.log(`Retry attempt ${attemptNumber} after error:`, error);
      return true;
    },
  });
}
```

### Anti-Patterns to Avoid

- **Creating duplicate type definitions** - Import from `@tambo-ai/typescript-sdk` for API types
- **Silent fallbacks in error handling** - Throw errors explicitly, don't mask failures
- **Using EventSource library** - fetch API is native and more flexible
- **Stateful client instances** - Keep client immutable after construction, state lives in returned objects
- **Deep nesting in streaming logic** - Extract event handlers into separate functions

## Don't Hand-Roll

| Problem             | Don't Build                | Use Instead                             | Why                                                       |
| ------------------- | -------------------------- | --------------------------------------- | --------------------------------------------------------- |
| Exponential backoff | Custom retry with timers   | `exponential-backoff` npm package       | Handles jitter, max attempts, delay capping correctly     |
| SSE parsing         | Custom event stream parser | fetch + ReadableStream + line buffering | Native support in Node 18+, handles chunked reads         |
| Schema validation   | Manual type checking       | Zod parse/safeParse                     | Runtime validation with type inference                    |
| Type utilities      | Complex mapped types       | type-fest library                       | Battle-tested utilities (PartialDeep, ReadonlyDeep, etc.) |
| Dual ESM/CJS build  | Custom bundler config      | Separate tsconfig files + tsc           | Matches react-sdk pattern, predictable output             |

**Key insight:** SDK infrastructure (retry, streaming, validation) has well-tested solutions. Don't reinvent these - they handle edge cases you'll miss (reconnection headers, partial JSON parsing, jitter distribution, Node/browser compatibility).

## Common Pitfalls

### Pitfall 1: SSE Reconnection Without Last-Event-ID

**What goes wrong:** Connection drops, stream restarts from beginning, duplicate events processed
**Why it happens:** Browser EventSource sends Last-Event-ID automatically, but fetch doesn't
**How to avoid:** Track last received event ID, send in headers on reconnect
**Warning signs:** Duplicate messages after reconnection, inconsistent state

### Pitfall 2: Partial JSON in Streamed Tool Args

**What goes wrong:** TOOL_CALL_ARGS events are chunked, JSON.parse fails on incomplete data
**Why it happens:** SSE streams can split JSON mid-object across multiple events
**How to avoid:** Buffer args per tool call ID, use `partial-json` library or accumulate until TOOL_CALL_END
**Warning signs:** JSON parse errors in tool execution, missing tool arguments

### Pitfall 3: Retry on Non-Idempotent Operations

**What goes wrong:** Creating threads retried = duplicate threads created
**Why it happens:** Network timeout doesn't mean request didn't reach server
**How to avoid:** Only retry on connection errors before response, not after partial response; use idempotent APIs
**Warning signs:** Duplicate resources after "failed" operations

### Pitfall 4: Missing Timeout on Streaming Connections

**What goes wrong:** Hung connections never close, resources leak
**Why it happens:** SSE streams can stall without explicit timeouts
**How to avoid:** Set AbortController with timeout, close reader on timeout
**Warning signs:** Memory usage growth, "zombie" connections in monitoring

### Pitfall 5: Type Assertions Without Runtime Validation

**What goes wrong:** API returns unexpected shape, runtime errors in type-safe code
**Why it happens:** Trusting API types without validating actual data
**How to avoid:** Use Zod schemas for API responses, not just inputs
**Warning signs:** Runtime errors on valid-looking TypeScript code

### Pitfall 6: Forgetting Node.js vs Browser Differences

**What goes wrong:** Works in Node, fails in browser (or vice versa)
**Why it happens:** fetch/Headers/AbortController have subtle differences
**How to avoid:** Test in both environments, avoid Node-specific APIs (Buffer, process)
**Warning signs:** Environment-specific test failures

## Code Examples

Verified patterns from official sources:

### Thread Creation with Retry

```typescript
// Based on @tambo-ai/typescript-sdk + exponential-backoff pattern
import { backOff } from "exponential-backoff";

interface CreateThreadParams {
  projectId: string;
  contextKey?: string;
  initialMessages?: Array<{ role: string; content: string }>;
}

class TamboClient {
  async createThread(params: CreateThreadParams) {
    return backOff(
      async () => {
        const response = await fetch(`${this.baseUrl}/threads`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          throw new Error(`Failed to create thread: ${response.status}`);
        }

        return response.json();
      },
      {
        numOfAttempts: 3,
        startingDelay: 1000,
        jitter: "full",
      },
    );
  }
}
```

### Streaming Messages with Recovery

```typescript
// Based on react-sdk patterns + MDN SSE documentation
async function* streamRun(
  threadId: string,
  message: { role: string; content: Array<unknown> },
  options: {
    apiKey: string;
    baseUrl: string;
    lastEventId?: string;
  },
) {
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount <= maxRetries) {
    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${options.apiKey}`,
        "Content-Type": "application/json",
      };

      // Send Last-Event-ID for recovery
      if (options.lastEventId) {
        headers["Last-Event-ID"] = options.lastEventId;
      }

      const response = await fetch(
        `${options.baseUrl}/threads/${threadId}/runs`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ message }),
        },
      );

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let lastId: string | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("id: ")) {
            lastId = line.slice(4);
          } else if (line.startsWith("data: ")) {
            const data = line.slice(6);
            const event = JSON.parse(data);
            yield event;
          }
        }
      }

      return; // Successful completion
    } catch (error) {
      retryCount++;
      if (retryCount > maxRetries) throw error;

      // Exponential backoff
      const delay = 1000 * Math.pow(2, retryCount - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
```

### Tool Registration Pattern

```typescript
// Based on react-sdk tool registration + Zod validation
import { z } from "zod";

interface ToolDefinition<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  inputSchema: z.ZodSchema<TInput>;
  outputSchema?: z.ZodSchema<TOutput>;
  execute: (input: TInput) => Promise<TOutput>;
}

class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  register<TInput, TOutput>(tool: ToolDefinition<TInput, TOutput>) {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" already registered`);
    }
    this.tools.set(tool.name, tool);
  }

  async execute(name: string, args: unknown): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool "${name}" not found in registry`);
    }

    // Runtime validation with Zod
    const validatedInput = tool.inputSchema.parse(args);
    const result = await tool.execute(validatedInput);

    // Optional output validation
    if (tool.outputSchema) {
      return tool.outputSchema.parse(result);
    }

    return result;
  }

  toApiFormat(): Array<{
    name: string;
    description: string;
    inputSchema: unknown;
  }> {
    return Array.from(this.tools.values()).map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
  }
}
```

## State of the Art

| Old Approach              | Current Approach             | When Changed   | Impact                                            |
| ------------------------- | ---------------------------- | -------------- | ------------------------------------------------- |
| EventSource library       | fetch + ReadableStream       | Node 18 (2022) | Native SSE support, POST requests, custom headers |
| Request library           | fetch API                    | Node 18 (2022) | No extra dependency, standard API                 |
| Separate CJS/ESM packages | Dual exports in package.json | 2023+          | Single package, conditional imports               |
| Manual retry loops        | exponential-backoff library  | 2020+          | Standard implementation with jitter               |
| any types in SDKs         | Strict TypeScript + Zod      | 2024+          | Runtime safety + compile-time types               |

**Deprecated/outdated:**

- `request` library: Deprecated, use fetch
- `eventsource` package: Unnecessary in Node 18+, fetch handles SSE
- Separate type packages: Use Zod schemas with inference instead
- Default exports: Use named exports for better tree-shaking

## Open Questions

1. **How does the CLI access the API key after login?**
   - What we know: CLI already has `tambo login` flow that provisions keys
   - What's unclear: Storage location, retrieval mechanism
   - Recommendation: Research CLI auth implementation before building client-core integration

2. **Should client-core handle MCP connections like react-sdk?**
   - What we know: react-sdk has MCP integration via `@modelcontextprotocol/sdk`
   - What's unclear: Whether CLI needs MCP server capabilities
   - Recommendation: Defer MCP to future phase; Phase 1 focuses on core HTTP/SSE

3. **Error recovery strategy for multi-round tool loops?**
   - What we know: Tool calls can chain (tool→AI→tool→AI)
   - What's unclear: Best retry strategy when mid-loop network failure occurs
   - Recommendation: Store loop state, resume from last successful tool result

4. **Package naming convention?**
   - What we know: Current packages use `@tambo-ai/react`, `@tambo-ai/typescript-sdk`
   - What's unclear: Should it be `@tambo-ai/client-core` or `@tambo-ai/client`?
   - Recommendation: Use `@tambo-ai/client-core` to distinguish from typescript-sdk

## Sources

### Primary (HIGH confidence)

- Existing codebase:
  - `react-sdk/src/v1/hooks/use-tambo-v1-send-message.test.tsx` - Tool execution patterns
  - `react-sdk/package.json` - Dual build configuration
  - `apps/api/src/threads/threads.controller.ts` - API endpoint patterns
  - `node_modules/@tambo-ai/typescript-sdk/package.json` - Official SDK structure
- Zod documentation: https://zod.dev/
- MDN SSE guide: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events

### Secondary (MEDIUM confidence)

- [Azure SDK TypeScript Guidelines](https://azure.github.io/azure-sdk/typescript_design.html) - SDK design patterns
- [TypeScript Dual ESM/CJS Publishing 2026](https://lirantal.com/blog/typescript-in-2025-with-esm-and-cjs-npm-publishing) - Build configuration
- [exponential-backoff npm](https://www.npmjs.com/package/exponential-backoff) - Retry implementation
- [Node.js Fetch SSE Tutorial](https://www.putzisan.com/articles/server-sent-events-via-native-fetch) - Streaming patterns

### Tertiary (LOW confidence - requires verification)

- [Server-Sent Events React Implementation](https://oneuptime.com/blog/post/2026-01-15-server-sent-events-sse-react/view) - General SSE patterns
- [Zod Tutorial Medium](https://medium.com/@a1guy/zod-tutorial-validate-api-data-in-typescript-auto-generate-zod-schemas-902252ec7aea) - Validation examples

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - All libraries verified in current codebase or Node.js built-ins
- Architecture: HIGH - Patterns directly from react-sdk and official SDK implementations
- Pitfalls: MEDIUM-HIGH - Based on common SDK issues + codebase test coverage

**Research date:** 2026-02-11
**Valid until:** ~60 days (stable patterns, but check for typescript-sdk updates)

---

**Next steps for planner:**

1. Define package structure and build configuration
2. Create client instantiation + authentication flow
3. Implement thread management (create, list, get, delete)
4. Add SSE streaming with reconnection
5. Build tool registry + execution loop
6. Add retry logic with exponential backoff
7. Verify TypeScript inference works correctly
