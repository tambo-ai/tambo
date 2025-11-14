/**
 * MCP server metadata type used by TamboRegistryProvider.
 * This is a minimal interface that doesn't depend on MCP implementation details.
 */

/**
 * The transport protocol to use for MCP connections.
 */
export enum MCPTransport {
  SSE = "sse",
  HTTP = "http",
}

/**
 * User-provided configuration for an MCP server.
 * This type is used by TamboRegistryProvider to store MCP server metadata.
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
   * Note: These callbacks should be stable (e.g., wrapped in useCallback or defined outside the component)
   * to avoid constant re-registration of the MCP server on every render.
   */
  handlers?: unknown; // Keep as unknown to avoid importing MCP-specific types
}
