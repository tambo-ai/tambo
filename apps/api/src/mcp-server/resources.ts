import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Resource } from "@modelcontextprotocol/sdk/types.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { MCPClient } from "@tambo-ai-cloud/core";

export async function registerResourceHandlers(
  server: McpServer,
  mcpClients: {
    client: MCPClient;
    serverId: string;
    serverKey: string;
    url: string;
  }[],
) {
  const results = await Promise.allSettled(
    mcpClients.map(async ({ client, serverKey }) => {
      try {
        const listResponse = await client.client.listResources();

        let registered = 0;
        for (const resource of listResponse.resources) {
          // We only support static URIs; resource templates require list/complete callbacks
          // which we can't easily proxy from remote MCP servers
          if (!resource.uri) {
            console.warn(`Resource ${resource.name} has no URI, skipping`);
            continue;
          }

          // Add serverKey prefix to URI if present
          const resourceUri = serverKey
            ? `${serverKey}:${resource.uri}`
            : String(resource.uri);

          // Build the resource metadata (Omit<Resource, 'uri' | 'name'>)
          const metadata: Omit<Resource, "uri" | "name"> = {
            description: resource.description,
            mimeType: resource.mimeType,
          };

          server.registerResource(
            resource.name,
            resourceUri,
            metadata,
            async (uri) => {
              const readResponse = await client.client.readResource({
                uri: uri.toString(),
              });
              return readResponse;
            },
          );
          registered += 1;
        }
        return registered;
      } catch (error) {
        if (
          error instanceof McpError &&
          error.code === ErrorCode.MethodNotFound
        ) {
          // Treat as success with zero registrations when the server
          // doesn't support resources.
          return 0;
        }
        // Propagate all other errors so Promise.allSettled can classify
        // this client as a rejection and the summary pass can log it once.
        throw error;
      }
    }),
  );

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const { serverId, serverKey, url } = mcpClients[i];
    if (result.status === "rejected") {
      console.error(
        "Error listing resources for MCP server",
        serverId,
        url,
        result.reason,
      );
      continue;
    }
    // Only log a success message when at least one resource was registered
    if (result.value > 0) {
      console.log(
        "Registered",
        result.value,
        "resources from:",
        serverId,
        "with key:",
        serverKey,
        "at:",
        url,
      );
    }
  }
}
