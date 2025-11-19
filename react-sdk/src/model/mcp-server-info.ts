import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type {
  ClientNotification,
  ClientRequest,
  CreateMessageRequest,
  CreateMessageResult,
  ElicitRequest,
  ElicitResult,
} from "@modelcontextprotocol/sdk/types.js";

/**
 * The transport protocol to use for MCP connections.
 */
export enum MCPTransport {
  SSE = "sse",
  HTTP = "http",
}

/**
 * User-provided configuration for an MCP server.
 *
 * This type is accepted by `TamboProvider` / `TamboRegistryProvider` via the
 * `mcpServers` prop. It captures connection metadata (URL, headers, transport,
 * serverKey) plus optional MCP request handlers.
 *
 * The `handlers` field is a `Partial<MCPHandlers>` whose callbacks correspond
 * to the MCP protocol types (`ElicitRequest`, `CreateMessageRequest`, etc.)
 * and are consumed directly by the MCP client/provider layer.
 */
export interface McpServerInfo {
  /** Optional name for the MCP server */
  name?: string;
  /** The URL of the MCP server to connect to */
  url: string;
  /** Optional description of the MCP server */
  description?: string;
  /** The transport type to use (SSE or HTTP). Defaults to HTTP for string URLs */
  transport?: MCPTransport;
  /** Optional custom headers to include in requests */
  customHeaders?: Record<string, string>;
  /**
   * Optional short name for namespacing MCP resources, prompts, and tools.
   * When multiple MCP servers are configured, this key is used to prefix:
   * - prompts: `<serverKey>:<promptName>`
   * - resources: `<serverKey>:<resourceUrl>`
   * - tools: `<serverKey>__<toolName>`
   *
   * Inline resource parsing uses the `@<serverKey>:<uri>` syntax in user text,
   * so `serverKey` must match `/^[a-zA-Z0-9_-]+$/`. If you change how keys are
   * derived, update both this documentation and the parser in
   * `react-sdk/src/util/message-builder.ts` to keep them in sync.
   *
   * If not provided, a key will be derived from the URL hostname.
   * For example, "https://mcp.linear.app/mcp" becomes "linear".
   */
  serverKey?: string;
  /**
   * Optional per-server handlers for MCP `elicitation` and `sampling`
   * requests.
   *
   * When provided, these override any provider-level handlers configured on
   * `TamboMcpProvider` for this server. If omitted, only the provider-level
   * handlers (if any) are used.
   *
   * Handlers should be referentially stable (for example, wrapped in
   * `useCallback` or defined outside the component) to avoid re-registering
   * servers on every render.
   */
  handlers?: Partial<MCPHandlers>;
}

/**
 * Strongly-typed handlers for MCP requests.
 *
 * These mirror the MCP protocol:
 * - `elicitation` handles `ElicitRequest` / `ElicitResult`.
 * - `sampling` handles `CreateMessageRequest` / `CreateMessageResult`.
 *
 * Both callbacks receive a `RequestHandlerExtra` whose `signal` is used for
 * cancellation.
 */
export interface MCPHandlers {
  elicitation: MCPElicitationHandler;
  sampling: MCPSamplingHandler;
}

/**
 * Handler for MCP elicitation requests.
 * Receives the elicit request and a RequestHandlerExtra containing an AbortSignal that fires when the request is cancelled.
 * @param request - The elicitation request from the server
 * @param extra - Additional context including AbortSignal for cancellation
 * @returns Promise resolving to the elicitation result
 * @example
 * ```typescript
 * const handler: MCPElicitationHandler = async (request, extra) => {
 *   // Listen for cancellation
 *   extra.signal.addEventListener('abort', () => {
 *     console.log('Request cancelled');
 *   });
 *
 *   // Return user's response
 *   return {
 *     action: 'accept',
 *     content: { name: 'John' }
 *   };
 * };
 * ```
 */
export type MCPElicitationHandler = (
  e: ElicitRequest,
  extra: RequestHandlerExtra<ClientRequest, ClientNotification>,
) => Promise<ElicitResult>;

/**
 * Handler for MCP sampling requests (create_message).
 * Receives the sampling request and a RequestHandlerExtra containing an AbortSignal that fires when the request is cancelled.
 * @param request - The sampling/create_message request from the server
 * @param extra - Additional context including AbortSignal for cancellation
 * @returns Promise resolving to the sampling result
 */
export type MCPSamplingHandler = (
  e: CreateMessageRequest,
  extra: RequestHandlerExtra<ClientRequest, ClientNotification>,
) => Promise<CreateMessageResult>;

/**
 * Normalized MCP server metadata used internally by the registry and MCP
 * provider.
 *
 * This is equivalent to `McpServerInfo` except that:
 * - `serverKey` is guaranteed to be present
 * - `transport` is resolved to a concrete value (defaults to HTTP)
 */
export interface NormalizedMcpServerInfo extends McpServerInfo {
  transport: MCPTransport;
  serverKey: string;
}

/**
 * Creates a stable identifier for an MCP server based on its connection properties.
 * Two servers with the same URL, transport, and headers will have the same key.
 *
 * This is used by both the registry and MCP provider to deduplicate servers,
 * so it lives alongside the shared server metadata type.
 * @returns A stable string key identifying the server
 */
export function getMcpServerUniqueKey(
  serverInfo: Pick<McpServerInfo, "url" | "transport" | "customHeaders">,
): string {
  const headerStr = serverInfo.customHeaders
    ? JSON.stringify(
        Object.entries(serverInfo.customHeaders)
          .map(([k, v]) => [k.toLowerCase(), v] as const)
          .sort(([a], [b]) => a.localeCompare(b)),
      )
    : "";

  return `${serverInfo.url}|${serverInfo.transport ?? MCPTransport.HTTP}|${headerStr}`;
}
