import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MCPClient } from "@tambo-ai-cloud/core";

export type ThreadMcpClient = {
  client: MCPClient;
  serverId: string;
  serverKey: string;
  url: string;
};

export function registerElicitationHandlers(
  server: McpServer,
  mcpClients: ThreadMcpClient[],
) {
  for (const { client } of mcpClients) {
    client.updateElicitationHandler(async (request) => {
      const { params } = request;

      const forwardedParams = {
        ...params,
        _meta: params._meta,
      };

      return await server.server.elicitInput(forwardedParams);
    });
  }
}
