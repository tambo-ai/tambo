import { FC, useEffect } from "react";
import { TamboTool } from "../model/component-metadata";
import { MCPClient, MCPTransport } from "../util/mcp-client";
import { useTamboRegistry } from "./tambo-registry-provider";

/**
 * This provider is used to register tools from MCP servers.
 * @returns the wrapped children
 */
export const TamboMcpProvider: FC<{
  mcpServers: string[];
  children: React.ReactNode;
}> = ({ mcpServers, children }) => {
  const { registerTool } = useTamboRegistry();

  useEffect(() => {
    if (!mcpServers) {
      return;
    }
    async function registerMcpServers(mcpServers: string[]) {
      // Maps tool names to the MCP client that registered them
      const mcpServerMap = new Map<string, MCPClient>();
      const serverToolLists = mcpServers.map(async (mcpServer) => {
        const mcpClient = await MCPClient.create(mcpServer, MCPTransport.SSE);
        const tools = await mcpClient.listTools();
        tools.forEach((tool) => {
          mcpServerMap.set(tool.name, mcpClient);
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
            const result = await mcpServer.callTool(tool.name, args);
            if (result.isError) {
              // TODO: is there a better way to handle this?
              throw new Error(`${result.content}`);
            }
            return result.content;
          },
          toolSchema: tool.inputSchema as TamboTool["toolSchema"],
        });
      });
    }
    registerMcpServers(mcpServers);
  }, [mcpServers, registerTool]);

  return children;
};
