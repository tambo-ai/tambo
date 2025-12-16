import { createContext, useContext } from "react";
import type { ServerType } from "./mcp-constants";

/**
 * Type for MCP client. We use a structural type here to avoid importing
 * the heavy mcp-client module which pulls in `@modelcontextprotocol/sdk`.
 */
interface MCPClientLike {
  client: {
    readResource: (params: { uri: string }) => Promise<unknown>;
    listResources: () => Promise<unknown>;
    listTools: () => Promise<unknown>;
    listPrompts: () => Promise<unknown>;
    getPrompt: (params: {
      name: string;
      arguments?: Record<string, string>;
    }) => Promise<unknown>;
    callTool: (params: {
      name: string;
      arguments?: Record<string, unknown>;
    }) => Promise<unknown>;
  };
  close: () => Promise<void>;
}

/**
 * Configuration for an MCP server at runtime.
 * Only used by the provider internally for managing server connections.
 */
export interface McpServerConfig {
  url: string;
  name: string;
  transport: "sse" | "http";
}

/**
 * Represents an active MCP server being tracked by TamboMcpProvider.
 * This unified type covers all server origins: user-passed MCP servers,
 * virtual servers (like registry), and internal Tambo servers.
 * The client field is null while the server is connecting, errored, or virtual.
 */
export interface ActiveMcpServer {
  /**
   * Stable key for the server, based on the server config hash.
   * Used for React keys and cache invalidation.
   */
  key: string;
  /**
   * User-facing key for the server, based on the server URL/name.
   * Used for prefixing resource URIs.
   */
  serverKey: string;
  url: string;
  name: string;
  status: "connecting" | "connected" | "error";
  error?: Error;
  /**
   * The type of server - determines how resources are resolved.
   */
  serverType: ServerType;
  /**
   * The MCP client for this server.
   * May be null if the server is still connecting, errored, or a virtual server (registry).
   */
  client: MCPClientLike | null;
}

/**
 * An active MCP server with a non-null client (fully connected).
 */
export type ConnectedActiveMcpServer = ActiveMcpServer & {
  client: MCPClientLike;
};

/**
 * Context value for MCP server list (without elicitation).
 * This is a lightweight context used by components that just need
 * access to the list of MCP servers without pulling in the full
 * MCP client implementation.
 */
interface McpServerContextValue {
  servers: ActiveMcpServer[];
}

/**
 * Context for accessing MCP servers.
 * Separated from the full MCP provider context to avoid importing
 * heavy MCP client dependencies in components that only need
 * the server list.
 */
export const McpServerContext = createContext<McpServerContextValue>({
  servers: [],
});

/**
 * Hook to get the list of active MCP servers from the nearest TamboMcpProvider.
 * Returns an empty array if not wrapped in a TamboMcpProvider.
 *
 * This hook provides lightweight access to MCP servers without pulling
 * in the full MCP client implementation.
 * @returns The array of active MCP servers (connected, connecting, and virtual)
 */
export const useTamboMcpServers = (): ActiveMcpServer[] => {
  return useContext(McpServerContext).servers;
};
