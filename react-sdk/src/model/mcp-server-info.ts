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
 * This is the type accepted by `TamboProvider` / `TamboRegistryProvider` in
 * the `mcpServers` prop.
 *
 * The `handlers` field is intentionally typed as `unknown` here so the core
 * SDK does not depend on the MCP subpackage. In the `@tambo-ai/react/mcp`
 * subpackage this is treated as `Partial<MCPHandlers>` (with
 * `elicitation` / `sampling` callbacks).
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
   * If not provided, a key will be derived from the URL hostname.
   * For example, "https://mcp.linear.app/mcp" becomes "linear".
   */
  serverKey?: string;
  /**
   * Optional handlers for elicitation and sampling requests from the server.
   *
   * Note: These callbacks should be stable (e.g., wrapped in useCallback or
   * defined outside the component) to avoid constant re-registration of the
   * MCP server on every render.
   */
  handlers?: Partial<MCPHandlers>;
}

/**
 * Handlers for MCP requests - these are only used if the server supports the corresponding capabilities
 * @param elicitation - Handler for elicitation requests (receives request and RequestHandlerExtra with AbortSignal)
 * @param sampling - Handler for sampling requests (receives request and RequestHandlerExtra with AbortSignal)
 * @example
 * ```typescript
 * const mcp = await MCPClient.create(
 *     'https://api.example.com/mcp',
 *     MCPTransport.HTTP,
 *     {},
 *     undefined,
 *     undefined,
 *     {
 *       elicitation: (e, extra) => Promise.resolve({...}),
 *     },
 * );
 * ```
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
