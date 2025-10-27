import React, {
  createContext,
  FC,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { TamboTool } from "../model/component-metadata";
import { useTamboMcpToken } from "../providers/tambo-mcp-token-provider";
import { useTamboRegistry } from "../providers/tambo-registry-provider";
import { isContentPartArray, toText } from "../util/content-parts";
import { MCPClient, MCPHandlers, MCPTransport } from "./mcp-client";

/**
 * Extracts error message from MCP tool result content.
 * Handles both array and string content formats.
 * Always returns a string, even for invalid/null inputs.
 * @returns The extracted error message as a string
 */
export function extractErrorMessage(content: unknown): string {
  if (content === undefined || content === null) {
    return "Unknown error occurred";
  }

  if (Array.isArray(content)) {
    const textItems = content
      .filter(
        (item) => item && item.type === "text" && typeof item.text === "string",
      )
      .map((item) => item.text);

    return textItems.length > 0
      ? textItems.join(" ")
      : "Error occurred but no details provided";
  }

  if (typeof content === "object") {
    return JSON.stringify(content);
  }

  return `${content}`;
}

/**
 * Configuration for connecting to an MCP server.
 */
export interface McpServerInfo {
  /** Optional name for the MCP server */
  name?: string;
  /** The URL of the MCP server to connect to */
  url: string;
  /** Optional description of the MCP server */
  description?: string;
  /** The transport type to use (SSE or HTTP). Defaults to SSE for string URLs */
  transport?: MCPTransport;
  /** Optional custom headers to include in requests */
  customHeaders?: Record<string, string>;
  /**
   * Optional handlers for elicitation and sampling requests from the server.
   * Note: These callbacks should be stable (e.g., wrapped in useCallback or defined outside the component)
   * to avoid constant re-registration of the MCP server on every render.
   */
  handlers?: Partial<MCPHandlers>;
}

export interface ConnectedMcpServer extends McpServerInfo {
  client: MCPClient;
}

export interface FailedMcpServer extends McpServerInfo {
  client?: never;
  connectionError: Error;
}

export type McpServer = ConnectedMcpServer | FailedMcpServer;

/**
 * Provider-level MCP handlers that receive the McpServerInfo as context in addition to the request.
 * These handlers are applied to all MCP servers unless overridden by per-server handlers.
 */
export interface ProviderMCPHandlers {
  elicitation?: (
    request: Parameters<MCPHandlers["elicitation"]>[0],
    serverInfo: McpServerInfo,
  ) => ReturnType<MCPHandlers["elicitation"]>;
  sampling?: (
    request: Parameters<MCPHandlers["sampling"]>[0],
    serverInfo: McpServerInfo,
  ) => ReturnType<MCPHandlers["sampling"]>;
}

const McpProviderContext = createContext<McpServer[]>([]);

// Constant for the internal Tambo MCP server name
const TAMBO_INTERNAL_MCP_SERVER_NAME = "__tambo_internal_mcp_server__";

/**
 * This provider is used to register tools from MCP servers.
 * It automatically includes an internal Tambo MCP server when an MCP access token is available.
 * @param props - The provider props
 * @param props.mcpServers - Array of MCP server configurations
 * @param props.handlers - Optional handlers applied to all MCP servers unless overridden per-server
 * @param props.children - The children to wrap
 * @returns The TamboMcpProvider component
 */
export const TamboMcpProvider: FC<{
  mcpServers: (McpServerInfo | string)[];
  handlers?: ProviderMCPHandlers;
  children: React.ReactNode;
}> = ({ mcpServers, handlers, children }) => {
  const { registerTool } = useTamboRegistry();
  const { mcpAccessToken, tamboBaseUrl } = useTamboMcpToken();
  const providerElicitationHandler = handlers?.elicitation;
  const providerSamplingHandler = handlers?.sampling;

  // Stable reference to track active clients by server key
  const clientMapRef = useRef<Map<string, McpServer>>(new Map());
  // Track tool ownership to prevent duplicate registrations across servers
  // toolOwnerRef: tool name -> server key; keyToToolsRef: server key -> set of tool names
  const toolOwnerRef = useRef<Map<string, string>>(new Map());
  const keyToToolsRef = useRef<Map<string, Set<string>>>(new Map());

  // State for exposing connected servers to consumers
  const [connectedMcpServers, setConnectedMcpServers] = useState<McpServer[]>(
    [],
  );

  // Stable map of current server configurations keyed by server key
  const currentServersMap = useMemo(() => {
    const servers = [...mcpServers];

    // Add internal Tambo MCP server if we have an access token and a base URL
    if (mcpAccessToken && tamboBaseUrl) {
      const base = new URL(tamboBaseUrl);
      base.pathname = `${base.pathname.replace(/\/+$/, "")}/mcp`;
      const tamboMcpUrl = base.toString();
      servers.push({
        name: TAMBO_INTERNAL_MCP_SERVER_NAME,
        url: tamboMcpUrl,
        transport: MCPTransport.HTTP,
        customHeaders: {
          Authorization: `Bearer ${mcpAccessToken}`,
        },
      });
    }

    // Create a map of server key -> server info for efficient lookups
    const serverMap = new Map<string, McpServerInfo>();
    servers.forEach((server) => {
      const serverInfo = normalizeServerInfo(server);
      const key = getServerKey(serverInfo);
      serverMap.set(key, serverInfo);
    });

    return serverMap;
  }, [mcpServers, mcpAccessToken, tamboBaseUrl]);

  // Main effect: manage client lifecycle (create/remove)
  useEffect(() => {
    const clientMap = clientMapRef.current;
    const currentKeys = new Set(currentServersMap.keys());
    const existingKeys = new Set(clientMap.keys());

    // 1. Remove clients that are no longer in the current server list
    const keysToRemove = Array.from(existingKeys).filter(
      (key) => !currentKeys.has(key),
    );
    keysToRemove.forEach((key) => {
      const server = clientMap.get(key);
      if (server?.client) {
        try {
          server.client.close();
        } catch (error) {
          // Avoid logging sensitive data embedded in the key (headers)
          const url = (server as McpServer).url ?? "(unknown url)";
          console.error(`Error closing MCP client for ${url}:`, error);
        }
      }
      // Release tool ownership for this server
      const owned = keyToToolsRef.current.get(key);
      if (owned) {
        for (const name of owned) toolOwnerRef.current.delete(name);
        keyToToolsRef.current.delete(key);
      }
      clientMap.delete(key);
    });

    // 2. Add new clients for servers that don't exist yet
    const keysToAdd = Array.from(currentKeys).filter(
      (key) => !existingKeys.has(key),
    );

    if (keysToAdd.length > 0) {
      // Async initialization of new clients
      Promise.allSettled(
        keysToAdd.map(async (key) => {
          const serverInfo = currentServersMap.get(key)!;

          try {
            // Build effective handlers (per-server overrides provider)
            const effectiveHandlers: Partial<MCPHandlers> = {};

            if (serverInfo.handlers?.elicitation) {
              effectiveHandlers.elicitation = serverInfo.handlers.elicitation;
            } else if (providerElicitationHandler) {
              effectiveHandlers.elicitation = async (request) =>
                await providerElicitationHandler(request, serverInfo);
            }

            if (serverInfo.handlers?.sampling) {
              effectiveHandlers.sampling = serverInfo.handlers.sampling;
            } else if (providerSamplingHandler) {
              effectiveHandlers.sampling = async (request) =>
                await providerSamplingHandler(request, serverInfo);
            }

            const client = await MCPClient.create(
              serverInfo.url,
              serverInfo.transport,
              serverInfo.customHeaders,
              undefined,
              undefined,
              effectiveHandlers,
            );

            const connectedServer: ConnectedMcpServer = {
              ...serverInfo,
              client,
            };

            clientMap.set(key, connectedServer);
            setConnectedMcpServers(Array.from(clientMap.values()));

            // Register tools from this server (deduplicated by ownership)
            try {
              const tools = await client.listTools();
              tools.forEach((tool) => {
                // Skip if another server already owns this tool
                const currentOwner = toolOwnerRef.current.get(tool.name);
                if (currentOwner && currentOwner !== key) {
                  return;
                }

                // Record ownership for this server key
                if (!currentOwner) {
                  toolOwnerRef.current.set(tool.name, key);
                  if (!keyToToolsRef.current.has(key)) {
                    keyToToolsRef.current.set(key, new Set());
                  }
                  keyToToolsRef.current.get(key)!.add(tool.name);
                }

                registerTool({
                  description: tool.description ?? "",
                  name: tool.name,
                  tool: async (args: Record<string, unknown>) => {
                    const server = clientMap.get(key);
                    if (!server?.client) {
                      throw new Error(
                        `MCP server for tool ${tool.name} is not connected`,
                      );
                    }
                    const result = await server.client.callTool(
                      tool.name,
                      args,
                    );
                    if (result.isError) {
                      const errorMessage = extractErrorMessage(result.content);
                      throw new Error(errorMessage);
                    }
                    return result.content;
                  },
                  toolSchema: tool.inputSchema as TamboTool["toolSchema"],
                  transformToContent: (content: unknown) => {
                    if (isContentPartArray(content)) {
                      return content;
                    }
                    return [{ type: "text", text: toText(content) }];
                  },
                });
              });
            } catch (error) {
              console.error(
                `Failed to register tools from MCP server ${serverInfo.url}:`,
                error,
              );
            }
          } catch (error) {
            const failedServer: FailedMcpServer = {
              ...serverInfo,
              connectionError: error as Error,
            };
            clientMap.set(key, failedServer);
            setConnectedMcpServers(Array.from(clientMap.values()));
            console.error(
              `Failed to connect to MCP server ${serverInfo.url}:`,
              error,
            );
          }
        }),
      );
    }

    // Update state after removals (additions update state asynchronously above)
    if (keysToRemove.length > 0) {
      setConnectedMcpServers(Array.from(clientMap.values()));
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentServersMap, registerTool]);

  // Update handlers when they change (without recreating clients)
  useEffect(() => {
    const clientMap = clientMapRef.current;

    clientMap.forEach((server, key) => {
      if (!server.client) {
        return; // Skip failed servers
      }

      const serverInfo = currentServersMap.get(key);
      if (!serverInfo) {
        return; // Server was removed, handled by main effect
      }

      // Determine effective handlers
      const effectiveElicitationHandler =
        serverInfo.handlers?.elicitation ??
        (providerElicitationHandler
          ? async (request) =>
              await providerElicitationHandler(request, serverInfo)
          : undefined);

      const effectiveSamplingHandler =
        serverInfo.handlers?.sampling ??
        (providerSamplingHandler
          ? async (request) =>
              await providerSamplingHandler(request, serverInfo)
          : undefined);

      // Update handlers unconditionally (allows removal by passing undefined)
      server.client.updateElicitationHandler?.(effectiveElicitationHandler);
      server.client.updateSamplingHandler?.(effectiveSamplingHandler);
    });
  }, [currentServersMap, providerElicitationHandler, providerSamplingHandler]);

  // Cleanup on unmount: close all clients
  useEffect(() => {
    const clientMap = clientMapRef.current;
    const ownerMapAtMount = toolOwnerRef.current;
    const keyToToolsAtMount = keyToToolsRef.current;
    return () => {
      clientMap.forEach((server, _key) => {
        if (server.client) {
          try {
            server.client.close();
          } catch (error) {
            const url = (server as McpServer).url ?? "(unknown url)";
            console.error(
              `Error closing MCP client on unmount for ${url}:`,
              error,
            );
          }
        }
      });
      clientMap.clear();
      ownerMapAtMount.clear();
      keyToToolsAtMount.clear();
    };
  }, []);

  return (
    <McpProviderContext.Provider value={connectedMcpServers}>
      {children}
    </McpProviderContext.Provider>
  );
};

/**
 * Hook to access the actual MCP servers, as they are connected (or fail to
 * connect).
 *
 * You can call methods on the MCP client that is included in the MCP server
 * object.
 *
 * If the server fails to connect, the `client` property will be `undefined` and
 * the `connectionError` property will be set.
 *
 * For example, to forcibly disconnect and reconnect all MCP servers:
 *
 * ```tsx
 * const mcpServers = useTamboMcpServers();
 * mcpServers.forEach((mcpServer) => {
 *   mcpServer.client?.reconnect();
 * });
 * ```
 *
 * Note that the MCP servers are not guaranteed to be in the same order as the
 * input array, because they are added as they are connected.
 * @returns The MCP servers
 */
export const useTamboMcpServers = () => {
  return useContext(McpProviderContext);
};

/**
 * Creates a stable identifier for an MCP server based on its connection properties.
 * Two servers with the same URL, transport, and headers will have the same key.
 * @returns A stable string key identifying the server
 */
function getServerKey(serverInfo: McpServerInfo): string {
  const headerStr = serverInfo.customHeaders
    ? JSON.stringify(
        Object.entries(serverInfo.customHeaders)
          .map(([k, v]) => [k.toLowerCase(), v] as const)
          .sort(([a], [b]) => a.localeCompare(b)),
      )
    : "";
  return `${serverInfo.url}|${serverInfo.transport ?? "SSE"}|${headerStr}`;
}

/**
 * Normalizes a server definition (string or object) into a McpServerInfo.
 * @returns The normalized McpServerInfo object
 */
function normalizeServerInfo(server: McpServerInfo | string): McpServerInfo {
  return typeof server === "string"
    ? { url: server, transport: MCPTransport.SSE }
    : server;
}
