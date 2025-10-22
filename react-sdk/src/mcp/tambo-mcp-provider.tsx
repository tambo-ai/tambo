import { deepEqual } from "fast-equals";
import React, {
  createContext,
  FC,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { TamboTool } from "../model/component-metadata";
import { useTamboMcpToken } from "../providers/tambo-mcp-token-provider";
import { useTamboRegistry } from "../providers/tambo-registry-provider";
import { isContentPartArray, toText } from "../util/content-parts";
import { MCPClient, MCPTransport } from "./mcp-client";

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

export interface McpServerInfo {
  name?: string;
  url: string;
  description?: string;
  transport?: MCPTransport;
  customHeaders?: Record<string, string>;
}

export interface ConnectedMcpServer extends McpServerInfo {
  client: MCPClient;
}

export interface FailedMcpServer extends McpServerInfo {
  client?: never;
  connectionError: Error;
}

export type McpServer = ConnectedMcpServer | FailedMcpServer;

const McpProviderContext = createContext<McpServer[]>([]);

// Constant for the internal Tambo MCP server name
const TAMBO_INTERNAL_MCP_SERVER_NAME = "__tambo_internal_mcp_server__";

/**
 * This provider is used to register tools from MCP servers.
 * It automatically includes an internal Tambo MCP server when an MCP access token is available.
 * @param props - The provider props
 * @param props.mcpServers - Array of MCP server configurations
 * @param props.children - The children to wrap
 * @returns The TamboMcpProvider component
 */
export const TamboMcpProvider: FC<{
  mcpServers: (McpServerInfo | string)[];
  children: React.ReactNode;
}> = ({ mcpServers, children }) => {
  const { registerTool } = useTamboRegistry();
  const { mcpAccessToken, tamboBaseUrl } = useTamboMcpToken();
  const [connectedMcpServers, setConnectedMcpServers] = useState<McpServer[]>(
    [],
  );

  // Combine user-provided MCP servers with the internal Tambo MCP server
  const allMcpServers = useMemo(() => {
    const servers = [...mcpServers];

    // Add internal Tambo MCP server if we have an access token and a base URL
    if (mcpAccessToken && tamboBaseUrl) {
      const tamboMcpUrl = `${tamboBaseUrl}/mcp`;
      servers.push({
        name: TAMBO_INTERNAL_MCP_SERVER_NAME,
        url: tamboMcpUrl,
        transport: MCPTransport.HTTP,
        customHeaders: {
          Authorization: `Bearer ${mcpAccessToken}`,
        },
      });
    }

    return servers;
  }, [mcpServers, mcpAccessToken, tamboBaseUrl]);

  useEffect(() => {
    if (!allMcpServers.length) {
      return;
    }
    async function registerMcpServers(mcpServerInfos: McpServerInfo[]) {
      // Maps tool names to the MCP client that registered them
      const mcpServerMap = new Map<string, McpServer>();
      setConnectedMcpServers((prev) =>
        // remove any servers that are not in the new list
        prev.filter((s) =>
          mcpServerInfos.some((mcpServerInfo) =>
            equalsMcpServer(s, mcpServerInfo),
          ),
        ),
      );

      // initialize the MCP clients, converting McpServerInfo -> McpServer
      const mcpServers = await Promise.allSettled(
        mcpServerInfos.map(async (mcpServerInfo): Promise<McpServer> => {
          try {
            const client = await MCPClient.create(
              mcpServerInfo.url,
              mcpServerInfo.transport,
              mcpServerInfo.customHeaders,
              undefined, // no oauth support yet
              undefined, // starting with no session id at first.
            );
            const connectedMcpServer = {
              ...mcpServerInfo,
              client: client,
            };
            // note because the promises may resolve in any order, the resulting
            // array may not be in the same order as the input array
            setConnectedMcpServers((prev) => [
              // replace the server if it already exists
              ...prev.filter((s) => !equalsMcpServer(s, mcpServerInfo)),
              connectedMcpServer,
            ]);
            return connectedMcpServer;
          } catch (error) {
            const failedMcpServer = {
              ...mcpServerInfo,
              connectionError: error as Error,
            };
            // note because the promises may resolve in any order, the resulting
            // array may not be in the same order as the input array
            setConnectedMcpServers((prev) => [
              // replace the server if it already exists
              ...prev.filter((s) => !equalsMcpServer(s, mcpServerInfo)),
              failedMcpServer,
            ]);
            return failedMcpServer;
          }
        }),
      );

      // note do not rely on the state
      const connectedMcpServers = mcpServers
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);

      // Now create a map of tool name to MCP client
      const serverToolLists = connectedMcpServers.map(async (mcpServer) => {
        const tools = (await mcpServer.client?.listTools()) ?? [];
        tools.forEach((tool) => {
          mcpServerMap.set(tool.name, mcpServer);
        });
        return tools;
      });
      const toolResults = await Promise.allSettled(serverToolLists);

      // Just log the failed tools, we can't do anything about them
      const failedTools = toolResults.filter(
        (result) => result.status === "rejected",
      );
      if (failedTools.length > 0) {
        console.error(
          "Failed to register tools from MCP servers:",
          failedTools.map((result) => result.reason),
        );
      }

      // Register the successful tools
      const allTools = toolResults
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value)
        .flat();
      allTools.forEach((tool) => {
        registerTool({
          description: tool.description ?? "",
          name: tool.name,
          tool: async (args: Record<string, unknown>) => {
            const mcpServer = mcpServerMap.get(tool.name);
            if (!mcpServer) {
              // should never happen
              throw new Error(`MCP server for tool ${tool.name} not found`);
            }
            if (!mcpServer.client) {
              // this can't actually happen because the tool can't be registered if the server is not connected
              throw new Error(
                `MCP server for tool ${tool.name} is not connected`,
              );
            }
            const result = await mcpServer.client.callTool(tool.name, args);
            if (result.isError) {
              const errorMessage = extractErrorMessage(result.content);
              throw new Error(errorMessage);
            }
            return result.content;
          },
          toolSchema: tool.inputSchema as TamboTool["toolSchema"],
          transformToContent: (content: unknown) => {
            // MCP tools can return content in various formats; pass through arrays of content parts
            // unchanged, otherwise stringify into a text content part.
            if (isContentPartArray(content)) {
              return content;
            }
            return [{ type: "text", text: toText(content) }];
          },
        });
      });
    }

    // normalize the server infos
    const mcpServerInfos = allMcpServers.map((mcpServer) =>
      typeof mcpServer === "string"
        ? { url: mcpServer, transport: MCPTransport.SSE }
        : mcpServer,
    );

    registerMcpServers(mcpServerInfos);
  }, [allMcpServers, registerTool]);

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
function equalsMcpServer(s: McpServer, mcpServerInfo: McpServerInfo): boolean {
  return (
    s.url === mcpServerInfo.url &&
    s.transport === mcpServerInfo.transport &&
    deepEqual(s.customHeaders, mcpServerInfo.customHeaders)
  );
}
