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
 * `elicitation` / `sampling` callbacks). The `@modelcontextprotocol/sdk` is
 * included automatically with `@tambo-ai/react`. See the React SDK README for
 * any additional optional peer dependencies needed for MCP features.
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
   * In the MCP subpackage this is interpreted as `Partial<MCPHandlers>`,
   * i.e. `{ elicitation?: MCPElicitationHandler; sampling?: MCPSamplingHandler }`.
   *
   * Note: These callbacks should be stable (e.g., wrapped in useCallback or
   * defined outside the component) to avoid constant re-registration of the
   * MCP server on every render.
   */
  handlers?: unknown;
}

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
