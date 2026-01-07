import React, {
  createContext,
  FC,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ServerType } from "./mcp-constants";
import {
  getMcpServerUniqueKey,
  type NormalizedMcpServerInfo,
} from "../model/mcp-server-info";
import { useTamboMcpToken } from "../providers/tambo-mcp-token-provider";
import {
  useTamboMcpServerInfos,
  useTamboRegistry,
} from "../providers/tambo-registry-provider";
import { isContentPartArray, toText } from "../util/content-parts";
import { type ElicitationContextState, useElicitation } from "./elicitation";
import {
  MCPClient,
  MCPElicitationHandler,
  MCPHandlers,
  MCPSamplingHandler,
  MCPTransport,
} from "./mcp-client";

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
      .filter((item) => item?.type === "text" && typeof item.text === "string")
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
 * Normalized MCP server information as consumed by the provider.
 *
 * Extends `NormalizedMcpServerInfo` from the core model by:
 * - narrowing `handlers` to `Partial<MCPHandlers>`
 * - adding a stable `key` derived from URL/transport/headers
 * - adding `serverType` to distinguish internal vs browser-side servers
 *
 * The registry is responsible for producing `NormalizedMcpServerInfo`
 * instances; this type adds the MCP-specific wiring needed to connect and
 * track clients.
 */
interface McpServerConfig extends NormalizedMcpServerInfo {
  /**
   * Optional handlers for elicitation and sampling requests from the server.
   * Interpreted as a partial set of MCP handlers.
   */
  handlers?: Partial<MCPHandlers>;
  /**
   * Stable identity for this server derived from its URL/transport/headers.
   * Present for all server states (connected or failed).
   */
  key: string;
  /**
   * Type of server - determines how resources are resolved.
   * Internal servers are resolved server-side, browser-side servers are resolved client-side.
   */
  serverType: ServerType;
}

/**
 * Connected MCP server with an active client.
 */
export interface ConnectedMcpServer extends McpServerConfig {
  client: MCPClient;
}

/**
 * Failed MCP server with a connection error.
 */
export interface FailedMcpServer extends McpServerConfig {
  client?: never;
  connectionError: Error;
}

/**
 * An active or failed MCP server, with access to the MCP client.
 */
export type McpServer = ConnectedMcpServer | FailedMcpServer;

/**
 * Provider-level MCP handlers that receive the McpServerInfo as context in addition to the request.
 * These handlers are applied to all MCP servers unless overridden by per-server handlers.
 *
 * Handlers receive three parameters:
 * 1. request - The MCP request
 * 2. extra - RequestHandlerExtra containing AbortSignal and other metadata
 * 3. serverInfo - Configuration of the MCP server that triggered this request
 */
export interface ProviderMCPHandlers {
  elicitation?: (
    request: Parameters<MCPElicitationHandler>[0],
    extra: Parameters<MCPElicitationHandler>[1],
    serverInfo: McpServerConfig,
  ) => ReturnType<MCPElicitationHandler>;
  sampling?: (
    request: Parameters<MCPSamplingHandler>[0],
    extra: Parameters<MCPSamplingHandler>[1],
    serverInfo: McpServerConfig,
  ) => ReturnType<MCPSamplingHandler>;
}

/**
 * Context value for MCP provider including server list and elicitation state
 */
interface McpProviderContextValue extends ElicitationContextState {
  servers: McpServer[];
}

const McpProviderContext = createContext<McpProviderContextValue>({
  servers: [],
  elicitation: null,
  resolveElicitation: null,
});

// Constant for the internal Tambo MCP server name
const TAMBO_INTERNAL_MCP_SERVER_NAME = "__tambo_internal_mcp_server__";

/**
 * Creates a stable hash of a string for use as a cache key.
 * Uses Java-style string hashing (DJB2-like) for deterministic results.
 *
 * Note: We use a synchronous hash instead of crypto.subtle.digest because:
 * - crypto.subtle.digest is async, which adds complexity in React hooks (useMemo, useEffect)
 * - This is not for security, just for creating a stable identifier to detect token changes
 * - Synchronous hashing avoids race conditions and simplifies component lifecycle
 * @param input - The string to hash
 * @returns A compact base36 hash string
 */
function hashString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (Math.imul(31, hash) + input.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

/**
 * Safely closes an MCP client, handling both sync and async close methods.
 * Logs errors but doesn't throw.
 */
function closeClientSafely(server: McpServer): void {
  if (!server?.client?.close) return;

  try {
    const closeResult = server.client.close();
    // If it returns a promise, handle errors but don't wait
    if (closeResult && typeof closeResult.catch === "function") {
      void closeResult.catch((error) => {
        const url = server.url ?? "(unknown url)";
        console.error(`Error closing MCP client for ${url}:`, error);
      });
    }
  } catch (error) {
    const url = server.url ?? "(unknown url)";
    console.error(`Error closing MCP client for ${url}:`, error);
  }
}

/**
 * Builds effective handlers for a server, with per-server overrides taking
 * precedence over provider-level handlers.
 * @returns The effective handlers with per-server overrides applied
 */
function buildEffectiveHandlers(
  serverInfo: McpServerConfig,
  providerElicitationHandler: ProviderMCPHandlers["elicitation"] | undefined,
  providerSamplingHandler: ProviderMCPHandlers["sampling"] | undefined,
): Partial<MCPHandlers> {
  const effectiveHandlers: Partial<MCPHandlers> = {};

  if (serverInfo.handlers?.elicitation) {
    effectiveHandlers.elicitation = serverInfo.handlers.elicitation;
  } else if (providerElicitationHandler) {
    effectiveHandlers.elicitation = async (
      request: Parameters<MCPElicitationHandler>[0],
      extra: Parameters<MCPElicitationHandler>[1],
    ) => await providerElicitationHandler(request, extra, serverInfo);
  }

  if (serverInfo.handlers?.sampling) {
    effectiveHandlers.sampling = serverInfo.handlers.sampling;
  } else if (providerSamplingHandler) {
    effectiveHandlers.sampling = async (
      request: Parameters<MCPSamplingHandler>[0],
      extra: Parameters<MCPSamplingHandler>[1],
    ) => await providerSamplingHandler(request, extra, serverInfo);
  }

  return effectiveHandlers;
}

/**
 * Hook to compute the stable map of server configurations from registry servers
 * and the internal Tambo MCP server (when token is available).
 * @returns A map of server key to server configuration
 */
function useServerConfigs(
  mcpServers: NormalizedMcpServerInfo[],
  mcpAccessToken: string | null | undefined,
  tamboBaseUrl: string | null | undefined,
): Map<string, McpServerConfig> {
  return useMemo(() => {
    const serverMap = new Map<string, McpServerConfig>();

    // Add user-provided MCP servers (browser-side)
    mcpServers.forEach((server) => {
      const serverInfo = normalizeServerInfo(server, ServerType.BROWSER_SIDE);
      serverMap.set(serverInfo.key, serverInfo);
    });

    // Add internal Tambo MCP server if we have an access token and a base URL
    if (mcpAccessToken && tamboBaseUrl) {
      const base = new URL(tamboBaseUrl);
      base.pathname = `${base.pathname.replace(/\/+$/, "")}/mcp`;
      const tamboMcpUrl = base.toString();
      const tokenHash = hashString(mcpAccessToken);
      const internalServer: NormalizedMcpServerInfo = {
        name: TAMBO_INTERNAL_MCP_SERVER_NAME,
        url: tamboMcpUrl,
        transport: MCPTransport.HTTP,
        serverKey: `tambo-${tokenHash}`,
        customHeaders: {
          Authorization: `Bearer ${mcpAccessToken}`,
        },
      };
      const serverInfo = normalizeServerInfo(
        internalServer,
        ServerType.TAMBO_INTERNAL,
      );
      serverMap.set(serverInfo.key, serverInfo);
    }

    return serverMap;
  }, [mcpServers, mcpAccessToken, tamboBaseUrl]);
}

interface ToolOwnershipRefs {
  toolOwnerRef: React.MutableRefObject<Map<string, string>>;
  keyToToolsRef: React.MutableRefObject<Map<string, Set<string>>>;
}

/**
 * Registers tools from a connected MCP server with deduplication.
 */
async function registerServerTools(
  client: MCPClient,
  serverInfo: McpServerConfig,
  key: string,
  shouldPrefix: boolean,
  clientMap: Map<string, McpServer>,
  ownershipRefs: ToolOwnershipRefs,
  registerTool: ReturnType<typeof useTamboRegistry>["registerTool"],
): Promise<void> {
  const { toolOwnerRef, keyToToolsRef } = ownershipRefs;

  try {
    const tools = await client.listTools();

    tools.forEach((tool) => {
      const toolName = shouldPrefix
        ? `${serverInfo.serverKey}__${tool.name}`
        : tool.name;

      // Skip if another server already owns this tool
      const currentOwner = toolOwnerRef.current.get(toolName);
      if (currentOwner && currentOwner !== key) {
        return;
      }

      // Record ownership
      if (!currentOwner) {
        toolOwnerRef.current.set(toolName, key);
        if (!keyToToolsRef.current.has(key)) {
          keyToToolsRef.current.set(key, new Set());
        }
        keyToToolsRef.current.get(key)!.add(toolName);
      }

      registerTool({
        description: tool.description ?? "",
        name: toolName,
        tool: async (args: Record<string, unknown> = {}) => {
          const server = clientMap.get(key);
          if (!server?.client) {
            throw new Error(
              `MCP server for tool ${tool.name} is not connected`,
            );
          }
          const result = await server.client.callTool(tool.name, args);
          if (result.isError) {
            const errorMessage = extractErrorMessage(result.content);
            throw new Error(errorMessage);
          }
          return result.content;
        },
        inputSchema: tool.inputSchema ?? {},
        outputSchema: {},
        transformToContent: (content: unknown) => {
          if (isContentPartArray(content)) {
            return content;
          }
          return [{ type: "text", text: toText(content) }];
        },
        ...("maxCalls" in tool && tool.maxCalls !== undefined
          ? { maxCalls: tool.maxCalls }
          : {}),
      });
    });
  } catch (error) {
    console.error(
      `Failed to register tools from MCP server ${serverInfo.url}:`,
      error,
    );
  }
}

/**
 * Releases tool ownership for a server being removed.
 */
function releaseToolOwnership(
  key: string,
  ownershipRefs: ToolOwnershipRefs,
): void {
  const { toolOwnerRef, keyToToolsRef } = ownershipRefs;
  const owned = keyToToolsRef.current.get(key);
  if (owned) {
    for (const name of owned) {
      toolOwnerRef.current.delete(name);
    }
    keyToToolsRef.current.delete(key);
  }
}

/**
 * This provider is used to register tools from MCP servers.
 * It automatically includes an internal Tambo MCP server when an MCP access token is available.
 *
 * **BREAKING CHANGE**: This provider no longer accepts `mcpServers` as a prop.
 * Instead, pass `mcpServers` to `TamboProvider` or `TamboRegistryProvider`.
 * This provider must be wrapped inside `TamboProvider` to access the MCP server registry.
 * @param props - The provider props
 * @param props.handlers - Optional handlers applied to all MCP servers unless overridden per-server
 * @param props.contextKey - Optional context key for fetching threadless MCP tokens when not in a thread
 * @param props.children - The children to wrap
 * @returns The TamboMcpProvider component
 */
export const TamboMcpProvider: FC<{
  handlers?: ProviderMCPHandlers;
  contextKey?: string;
  children: React.ReactNode;
}> = ({ handlers, contextKey, children }) => {
  const { registerTool } = useTamboRegistry();
  const { mcpAccessToken, tamboBaseUrl } = useTamboMcpToken(contextKey);
  const mcpServers = useTamboMcpServerInfos();
  const providerSamplingHandler = handlers?.sampling;

  // Elicitation state and default handler
  const { elicitation, resolveElicitation, defaultElicitationHandler } =
    useElicitation();

  // Use provided handler or fall back to default
  const providerElicitationHandler =
    handlers?.elicitation ?? defaultElicitationHandler;

  // Stable reference to track active clients by server key
  const clientMapRef = useRef<Map<string, McpServer>>(new Map());
  // Track tool ownership to prevent duplicate registrations across servers
  const toolOwnerRef = useRef<Map<string, string>>(new Map());
  const keyToToolsRef = useRef<Map<string, Set<string>>>(new Map());
  const ownershipRefs: ToolOwnershipRefs = { toolOwnerRef, keyToToolsRef };

  // State for exposing connected servers to consumers
  const [connectedMcpServers, setConnectedMcpServers] = useState<McpServer[]>(
    [],
  );

  // Compute server configurations from registry and internal server
  const currentServersMap = useServerConfigs(
    mcpServers,
    mcpAccessToken,
    tamboBaseUrl,
  );

  // Main effect: manage client lifecycle (create/remove)
  useClientLifecycle(
    currentServersMap,
    clientMapRef,
    ownershipRefs,
    providerElicitationHandler,
    providerSamplingHandler,
    registerTool,
    setConnectedMcpServers,
  );

  // Update handlers when they change (without recreating clients)
  useHandlerUpdates(
    currentServersMap,
    clientMapRef,
    providerElicitationHandler,
    providerSamplingHandler,
  );

  // Cleanup on unmount: close all clients
  useCleanupOnUnmount(clientMapRef, ownershipRefs);

  const contextValue = useMemo(
    () => ({
      servers: connectedMcpServers,
      elicitation,
      resolveElicitation,
    }),
    [connectedMcpServers, elicitation, resolveElicitation],
  );

  return (
    <McpProviderContext.Provider value={contextValue}>
      {children}
    </McpProviderContext.Provider>
  );
};

/**
 * Hook to manage client lifecycle: creating clients for new servers,
 * removing clients for servers that are no longer in the list.
 */
function useClientLifecycle(
  currentServersMap: Map<string, McpServerConfig>,
  clientMapRef: React.MutableRefObject<Map<string, McpServer>>,
  ownershipRefs: ToolOwnershipRefs,
  providerElicitationHandler: ProviderMCPHandlers["elicitation"] | undefined,
  providerSamplingHandler: ProviderMCPHandlers["sampling"] | undefined,
  registerTool: ReturnType<typeof useTamboRegistry>["registerTool"],
  setConnectedMcpServers: React.Dispatch<React.SetStateAction<McpServer[]>>,
): void {
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
      if (server) {
        closeClientSafely(server);
      }
      releaseToolOwnership(key, ownershipRefs);
      clientMap.delete(key);
    });

    // 2. Add new clients for servers that don't exist yet
    const keysToAdd = Array.from(currentKeys).filter(
      (key) => !existingKeys.has(key),
    );

    async function addClients(keys: string[]) {
      await Promise.allSettled(
        keys.map(async (key) => {
          const serverInfo = currentServersMap.get(key)!;

          try {
            const effectiveHandlers = buildEffectiveHandlers(
              serverInfo,
              providerElicitationHandler,
              providerSamplingHandler,
            );

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

            // Register tools from this server
            const shouldPrefix = currentServersMap.size > 1;
            await registerServerTools(
              client,
              serverInfo,
              key,
              shouldPrefix,
              clientMap,
              ownershipRefs,
              registerTool,
            );
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

    if (keysToAdd.length > 0) {
      addClients(keysToAdd).catch((err) => {
        console.error("Unexpected error in addClients:", err);
      });
    }

    // Update state after removals
    if (keysToRemove.length > 0) {
      setConnectedMcpServers(Array.from(clientMap.values()));
    }
    // Note: refs (clientMapRef, ownershipRefs) and setters (setConnectedMcpServers)
    // are intentionally excluded from deps as they are stable references
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentServersMap,
    providerElicitationHandler,
    providerSamplingHandler,
    registerTool,
  ]);
}

/**
 * Hook to update handlers on connected clients when provider handlers change.
 */
function useHandlerUpdates(
  currentServersMap: Map<string, McpServerConfig>,
  clientMapRef: React.MutableRefObject<Map<string, McpServer>>,
  providerElicitationHandler: ProviderMCPHandlers["elicitation"] | undefined,
  providerSamplingHandler: ProviderMCPHandlers["sampling"] | undefined,
): void {
  useEffect(() => {
    const clientMap = clientMapRef.current;

    clientMap.forEach((server, key) => {
      if (!server.client) {
        return; // Skip failed servers
      }

      const serverInfo = currentServersMap.get(key);
      if (!serverInfo) {
        return; // Server was removed, handled by lifecycle effect
      }

      // Build effective handlers and update the client
      const effectiveElicitationHandler =
        serverInfo.handlers?.elicitation ??
        (providerElicitationHandler
          ? async (
              request: Parameters<MCPElicitationHandler>[0],
              extra: Parameters<MCPElicitationHandler>[1],
            ) => await providerElicitationHandler(request, extra, serverInfo)
          : undefined);

      const effectiveSamplingHandler =
        serverInfo.handlers?.sampling ??
        (providerSamplingHandler
          ? async (
              request: Parameters<MCPSamplingHandler>[0],
              extra: Parameters<MCPSamplingHandler>[1],
            ) => await providerSamplingHandler(request, extra, serverInfo)
          : undefined);

      server.client.updateElicitationHandler?.(effectiveElicitationHandler);
      server.client.updateSamplingHandler?.(effectiveSamplingHandler);
    });
    // Note: clientMapRef is intentionally excluded from deps as it's a stable ref
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentServersMap, providerElicitationHandler, providerSamplingHandler]);
}

/**
 * Hook to cleanup all clients and tool ownership on component unmount.
 */
function useCleanupOnUnmount(
  clientMapRef: React.MutableRefObject<Map<string, McpServer>>,
  ownershipRefs: ToolOwnershipRefs,
): void {
  useEffect(() => {
    const clientMap = clientMapRef.current;
    const { toolOwnerRef, keyToToolsRef } = ownershipRefs;
    return () => {
      clientMap.forEach((server) => {
        closeClientSafely(server);
      });
      clientMap.clear();
      toolOwnerRef.current.clear();
      keyToToolsRef.current.clear();
    };
    // Only run cleanup on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

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
  return useContext(McpProviderContext).servers;
};

/**
 * Hook to access MCP elicitation state from TamboMcpProvider.
 * This provides access to the current elicitation request and methods to respond to it.
 *
 * The elicitation state is automatically managed by TamboMcpProvider when MCP servers
 * request user input through the elicitation protocol.
 * @returns The elicitation state with current request and response handler
 * @example
 * ```tsx
 * function ElicitationUI() {
 *   const { elicitation, resolveElicitation } = useTamboMcpElicitation();
 *
 *   if (!elicitation) return null;
 *
 *   return (
 *     <div>
 *       <p>{elicitation.message}</p>
 *       <button onClick={() => resolveElicitation?.({ action: "accept", content: {} })}>
 *         Accept
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export const useTamboMcpElicitation = (): ElicitationContextState => {
  const context = useContext(McpProviderContext);
  return {
    elicitation: context.elicitation,
    resolveElicitation: context.resolveElicitation,
  };
};

/**
 * @deprecated Use `useTamboMcpElicitation` instead.
 * This hook will be removed in a future version.
 */
export const useTamboElicitationContext = useTamboMcpElicitation;

/**
 * Normalizes registry server metadata into a `McpServerConfig`.
 *
 * Accepts a `NormalizedMcpServerInfo`, which already guarantees a concrete
 * `transport` and a `serverKey` derived by the registry, and narrows the
 * opaque `handlers` field to `Partial<MCPHandlers>`.
 * @param server - The normalized MCP server info from the registry
 * @param serverType - The type of server (internal vs browser-side)
 * @returns The server config with typed handlers, unique key, and server type
 */
function normalizeServerInfo(
  server: NormalizedMcpServerInfo,
  serverType: ServerType,
): McpServerConfig {
  // Always use getMcpServerUniqueKey for connection identity to ensure
  // that changes to URL, transport, or customHeaders trigger client recreation.
  // The serverKey is kept for namespacing purposes (readable short name),
  // but the connection identity key must include all connection properties.
  const key = getMcpServerUniqueKey(server);
  // Cast handlers to proper type if present
  const handlers = server.handlers as Partial<MCPHandlers> | undefined;
  return {
    ...server,
    handlers,
    key,
    serverType,
  };
}
