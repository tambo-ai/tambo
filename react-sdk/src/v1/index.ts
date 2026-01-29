/**
 * `@tambo-ai/react/v1` - React SDK for Tambo v1 API
 *
 * Provides React hooks and providers for building AI-powered applications
 * using the v1 streaming API with AG-UI protocol.
 *
 * ## Authentication & Thread Ownership
 *
 * All thread operations require user identification. Provide ONE of:
 * - `userKey` - Direct user identifier (for server-side or trusted environments)
 * - `userToken` - OAuth bearer token containing the userKey (for client-side apps)
 *
 * Threads are scoped to the userKey - each user only sees their own threads.
 *
 * ## Quick Start
 *
 * ```tsx
 * import {
 *   TamboV1Provider,
 *   useTamboV1,
 *   useTamboV1ThreadInput,
 * } from '@tambo-ai/react/v1';
 *
 * function App() {
 *   return (
 *     <TamboV1Provider
 *       apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
 *       userKey={currentUserId} // Required: identifies thread owner
 *       components={[WeatherCard]}
 *       tools={[searchTool]}
 *     >
 *       <ChatInterface />
 *     </TamboV1Provider>
 *   );
 * }
 *
 * function ChatInterface() {
 *   const [threadId, setThreadId] = useState<string>();
 *   const { messages, isStreaming } = useTamboV1(threadId);
 *   const { value, setValue, submit, isPending } = useTamboV1ThreadInput(threadId);
 *
 *   const handleSubmit = async (e: React.FormEvent) => {
 *     e.preventDefault();
 *     const result = await submit();
 *     if (!threadId) setThreadId(result.threadId);
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       {messages.map(msg => <Message key={msg.id} message={msg} />)}
 *       {isStreaming && <LoadingIndicator />}
 *       <input value={value} onChange={(e) => setValue(e.target.value)} />
 *       <button disabled={isPending}>Send</button>
 *     </form>
 *   );
 * }
 * ```
 *
 * ## Type Imports
 *
 * Types are imported directly from specific files:
 * - Thread state: `import type { TamboV1Thread } from '@tambo-ai/react/v1/types/thread'`
 * - Messages: `import type { TamboV1Message } from '@tambo-ai/react/v1/types/message'`
 * - Custom events: `import type { ComponentStartEvent } from '@tambo-ai/react/v1/types/event'`
 *
 * SDK types: `import type { ... } from '@tambo-ai/typescript-sdk'`
 * AG-UI events: `import { EventType, type BaseEvent } from '@ag-ui/core'`
 */

// =============================================================================
// Providers
// =============================================================================

export {
  TamboV1Provider,
  type TamboV1ProviderProps,
  useTamboV1Config,
  type TamboV1Config,
} from "./providers/tambo-v1-provider";

// Re-export registry provider from beta SDK (works with v1)
export { TamboRegistryProvider } from "../providers/tambo-registry-provider";

// Re-export context helpers from beta SDK (works with v1)
export {
  TamboContextHelpersProvider,
  useTamboContextHelpers,
} from "../providers/tambo-context-helpers-provider";

// =============================================================================
// Hooks
// =============================================================================

export { useTamboV1 } from "./hooks/use-tambo-v1";

export { useTamboV1ThreadInput } from "./hooks/use-tambo-v1-thread-input";

export { useTamboV1Thread } from "./hooks/use-tambo-v1-thread";

export { useTamboV1ThreadList } from "./hooks/use-tambo-v1-thread-list";

export { useTamboV1ComponentState } from "./hooks/use-tambo-v1-component-state";

// Re-export client hook from beta SDK (works with v1)
export { useTamboClient } from "../providers/tambo-client-provider";

// =============================================================================
// Re-exports from Beta SDK (compatible with v1)
// =============================================================================

// Tool definition helper
export { defineTool } from "../util/registry";

// Built-in context helpers
export {
  currentPageContextHelper,
  currentTimeContextHelper,
} from "../context-helpers";

// Context helper types
export type {
  AdditionalContext,
  ContextHelperFn,
  ContextHelpers,
} from "../context-helpers";

// Component and tool types
export type {
  ComponentContextToolMetadata,
  ComponentRegistry,
  ParameterSpec,
  RegisteredComponent,
  TamboTool,
  ToolAnnotations,
} from "../model/component-metadata";

// MCP server types
export { MCPTransport } from "../model/mcp-server-info";
export type {
  McpServerInfo,
  NormalizedMcpServerInfo,
} from "../model/mcp-server-info";

// Resource types
export type {
  ListResourceItem,
  ReadResourceResult,
  ResourceSource,
} from "../model/resource-info";
