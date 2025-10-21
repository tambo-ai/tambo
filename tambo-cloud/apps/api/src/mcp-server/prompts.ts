import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { MCPClient } from "@tambo-ai-cloud/core";

export async function registerPromptHandlers(
  server: McpServer,
  mcpClients: { client: MCPClient; serverId: string; url: string }[],
) {
  const registrations = await Promise.allSettled(
    mcpClients.map(async ({ client }) => {
      const promptResponse = await client.client.listPrompts();
      for await (const prompt of promptResponse.prompts) {
        server.registerPrompt(
          prompt.name,
          {
            title: prompt.title,
            description: prompt.description,
            argsSchema: prompt.inputSchema as Record<string, any>,
          },
          async (args) =>
            await client.client.getPrompt({
              name: prompt.name,
              arguments: args,
            }),
        );
      }
      // TODO: handle prompt updates
      // something like this:
      // client.client.setRequestHandler(
      //   PromptListChangedNotificationSchema,
      //   async () => {
      //     const prompts = await client.client.listPrompts();
      //     // now update the prompts in the server
      //     return {};
      //   },
      // );
    }),
  );
  for (const result of registrations) {
    if (result.status === "rejected") {
      console.error("Error listing prompts for MCP server", result.reason);
    }
  }

  // TODO: report errors upstream
}
