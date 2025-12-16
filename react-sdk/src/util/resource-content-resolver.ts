import type { ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import {
  INTERNAL_SERVER_PREFIX,
  REGISTRY_SERVER_KEY,
} from "../mcp/mcp-constants";
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
 * @param mcpServers - Connected MCP servers
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

    // Skip internal server resources - backend can resolve these
    if (serverKey.startsWith(INTERNAL_SERVER_PREFIX)) {
      return;
    }

    try {
      // Registry resource
      if (serverKey === REGISTRY_SERVER_KEY) {
        if (!resourceSource) {
          console.warn(
            `No resource source available to resolve registry resource: ${prefixedUri}`,
          );
          return;
        }
        const content = await resourceSource.getResource(originalUri);
        if (content) {
          results.set(prefixedUri, content);
        }
        return;
      }

      // Client-side MCP resource
      const mcpServer = mcpServers.find(
        (s) => isConnectedMcpServer(s) && s.serverKey === serverKey,
      );
      if (mcpServer && isConnectedMcpServer(mcpServer)) {
        const content = (await mcpServer.client.client.readResource({
          uri: originalUri,
        })) as ReadResourceResult | null;
        if (content) {
          results.set(prefixedUri, content);
        }
      } else {
        console.warn(
          `No connected MCP server found for resource: ${prefixedUri}`,
        );
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
