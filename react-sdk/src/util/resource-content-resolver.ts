import type { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import { REGISTRY_SERVER_KEY, ServerType } from "../mcp/mcp-constants";
import type { ConnectedMcpServer, McpServer } from "../mcp/tambo-mcp-provider";
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
 * @param mcpServers - Active MCP servers including virtual registry server
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

    try {
      // Handle registry resources directly - no server lookup needed
      // Registry resources are local to the browser and resolved via resourceSource
      if (serverKey === REGISTRY_SERVER_KEY) {
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

      // For non-registry resources, find the server by serverKey
      const server = mcpServers.find((s) => s.serverKey === serverKey);
      if (!server) {
        console.warn(`No server found for resource: ${prefixedUri}`);
        return;
      }

      switch (server.serverType) {
        case ServerType.TAMBO_INTERNAL:
          // Skip internal server resources - backend can resolve these
          return;

        case ServerType.TAMBO_REGISTRY:
          // Should not reach here since we handle registry above, but keep for safety
          return;

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
