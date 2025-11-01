import { onMounted } from "vue";
import type { TamboTool } from "../model/component-metadata";
import { useTamboRegistry } from "../providers/tambo-registry-provider";
import { MCPClient, MCPTransport } from "./mcp-client";

export function extractErrorMessage(content: unknown): string {
  if (content === undefined || content === null) return "Unknown error occurred";
  if (Array.isArray(content)) {
    const textItems = content
      .filter((item) => item && (item as any).type === "text" && typeof (item as any).text === "string")
      .map((item) => (item as any).text);
    return textItems.length > 0 ? textItems.join(" ") : "Error occurred but no details provided";
  }
  if (typeof content === "object") return JSON.stringify(content);
  return String(content);
}

export interface McpServerInfo {
  name?: string;
  url: string;
  description?: string;
  transport?: MCPTransport;
  customHeaders?: Record<string, string>;
}

/**
 * Vue composition function to register MCP server tools into tambo registry.
 */
export function useTamboMcpProvider(mcpServers: (McpServerInfo | string)[]) {
  const { registerTool } = useTamboRegistry();

  onMounted(() => {
    if (!mcpServers) return;
    (async function registerMcpServers() {
      const mcpServerMap = new Map<string, MCPClient>();
      const serverToolLists = mcpServers.map(async (mcpServer) => {
        const server =
          typeof mcpServer === "string"
            ? { url: mcpServer, transport: MCPTransport.SSE }
            : mcpServer;
        const { url, transport = MCPTransport.SSE, customHeaders } = server;
        const mcpClient = await MCPClient.create(url, transport, customHeaders);
        const tools = await mcpClient.listTools();
        tools.forEach((tool) => {
          mcpServerMap.set(tool.name, mcpClient);
        });
        return tools;
      });
      const toolResults = await Promise.allSettled(serverToolLists);
      const allTools = toolResults
        .filter((r): r is PromiseFulfilledResult<any[]> => r.status === "fulfilled")
        .map((r) => r.value)
        .flat();
      allTools.forEach((tool) => {
        registerTool({
          description: tool.description ?? "",
          name: tool.name,
          tool: async (args: Record<string, unknown>) => {
            const mcpServer = mcpServerMap.get(tool.name);
            if (!mcpServer) throw new Error(`MCP server for tool ${tool.name} not found`);
            const result = await mcpServer.callTool(tool.name, args);
            if ((result as any).isError) {
              const errorMessage = extractErrorMessage((result as any).content);
              throw new Error(errorMessage);
            }
            return (result as any).content;
          },
          toolSchema: tool.inputSchema as TamboTool["toolSchema"],
        });
      });
    })();
  });
}

