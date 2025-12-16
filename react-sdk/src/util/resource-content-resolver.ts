import type { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import { ServerType } from "../mcp/mcp-constants";
import type { McpServer, ConnectedMcpServer } from "../mcp/mcp-server-context";
import type { ResourceSource } from "../model/resource-info";

/**
 * Type guard for narrowing McpServer to a connected server.
 * A connected server has a non-null client.
 */
function isConnectedMcpServer(server: McpServer): server is ConnectedMcpServer {
  return "client" in server && server.client != null;
}

/**
 * Resolves content for client-side resources (MCP and registry).
 * Server-side (internal Tambo) resources are skipped - the backend can resolve them.
 * @param resourceUris - Prefixed URIs (e.g., "linear:file://foo", "registry:file://bar", "tambo-abc:test://resource")
 * @param mcpServers - MCP servers including virtual registry server
 * @param resourceSource - Registry resource source (listResources/getResource)
 * @returns Map of prefixedUri -> ReadResourceResult for resolved resources.
 *          Resources that failed to fetch or are internal server resources won't be in the map.
 */
export async function resolveResourceContents(
  resourceUris: string[],
  mcpServers: McpServer[],
  resourceSource: ResourceSource | undefined,
): Promise<Map<string, ReadResourceResult>> {
  const results = new Map<string, ReadResourceResult>();

  const fetchPromises = resourceUris.map(async (prefixedUri) => {
    // Parse serverKey and original URI
    // Format: serverKey:originalUri (e.g., "linear:file://foo", "registry:docs://readme")
    const colonIndex = prefixedUri.indexOf(":");
    if (colonIndex === -1) return;

    const serverKey = prefixedUri.slice(0, colonIndex);
    const originalUri = prefixedUri.slice(colonIndex + 1);

    // Find the server by serverKey
    const server = mcpServers.find((s) => s.serverKey === serverKey);
    if (!server) {
      console.warn(`No server found for resource: ${prefixedUri}`);
      return;
    }

    try {
      switch (server.serverType) {
        case ServerType.TAMBO_INTERNAL:
          // Skip internal server resources - backend can resolve these
          return;

        case ServerType.TAMBO_REGISTRY: {
          // Registry resource - use resourceSource
          if (!resourceSource) {
            console.warn(
              `No resource source available to resolve registry resource: ${prefixedUri}`,
            );
            return;
          }
          const registryContent = await resourceSource.getResource(originalUri);
          if (registryContent) {
            results.set(prefixedUri, registryContent);
          }
          return;
        }

        case ServerType.BROWSER_SIDE: {
          // Client-side MCP resource
          if (!isConnectedMcpServer(server)) {
            console.warn(
              `MCP server not connected for resource: ${prefixedUri}`,
            );
            return;
          }
          const mcpContent = (await server.client.client.readResource({
            uri: originalUri,
          })) as ReadResourceResult | null;
          if (mcpContent) {
            results.set(prefixedUri, mcpContent);
          }
          return;
        }
      }
    } catch (error) {
      // Graceful fallback - log warning and continue without content
      console.warn(
        `Failed to fetch resource content for ${prefixedUri}:`,
        error,
      );
    }
  });

  await Promise.all(fetchPromises);
  return results;
}

/**
 * Extracts resource URIs from text using the `@serverKey:uri` pattern.
 * @param text - Text potentially containing resource references
 * @returns Array of prefixed resource URIs (e.g., ["linear:file://foo", "registry:file://bar"])
 */
export function extractResourceUris(text: string): string[] {
  const pattern = /@([a-zA-Z0-9-]+):(\S+)/g;
  const matches = Array.from(text.matchAll(pattern));
  return matches.map(([, serverKey, uri]) => `${serverKey}:${uri}`);
}
