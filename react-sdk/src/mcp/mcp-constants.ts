/**
 * Server type enum for distinguishing different kinds of MCP servers.
 * Used to determine how resources should be resolved.
 */
export const ServerType = {
  /** Client-side MCP server passed via mcpServers prop */
  BROWSER_SIDE: "browser-side",
  /** Internal Tambo MCP server at /mcp endpoint (server-side MCP) */
  TAMBO_INTERNAL: "tambo-internal",
  /** Virtual server representing browser-only registry resources */
  TAMBO_REGISTRY: "tambo-registry",
} as const;

export type ServerType = (typeof ServerType)[keyof typeof ServerType];

/**
 * Synthetic server key for local registry resources.
 * Used to give registry resources the same `@serverKey:uri` format as MCP resources.
 */
export const REGISTRY_SERVER_KEY = "registry";
