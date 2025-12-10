import type {
  ListResourcesResult,
  ReadResourceResult,
} from "@modelcontextprotocol/sdk/types.js";

/**
 * A single resource item from the MCP SDK listResources response.
 * Re-exported for convenience when registering static resources.
 */
export type ListResourceItem = ListResourcesResult["resources"][number];

// Re-export the MCP SDK ReadResourceResult type so consumers can depend on
// a stable SDK surface without importing directly from the MCP package.
export type { ReadResourceResult };

/**
 * Configuration for a dynamic resource source that can search and fetch resources.
 *
 * Both `listResources` and `getResource` must be provided together - you cannot
 * provide one without the other.
 * @example
 * ```typescript
 * const resourceSource: ResourceSource = {
 *   listResources: async (search) => {
 *     const allResources = await fetchMyResources();
 *     return search
 *       ? allResources.filter(r => r.name.includes(search))
 *       : allResources;
 *   },
 *   getResource: async (uri, args) => {
 *     const content = await fetchResourceContent(uri, args);
 *     return {
 *       contents: [{
 *         uri,
 *         mimeType: 'text/plain',
 *         text: content,
 *       }],
 *     };
 *   },
 * };
 * ```
 */
export interface ResourceSource {
  /**
   * Lists available resources, optionally filtered by a search string.
   * @param search - Optional search string to filter resources
   * @returns Promise resolving to an array of resource items
   */
  listResources: (search?: string) => Promise<ListResourceItem[]>;

  /**
   * Fetches the content of a specific resource by URI.
   *
   * Note: `getResource` may be invoked for URIs that have not previously
   * been returned by `listResources` (for example, when the caller already
   * knows a concrete URI). Implementations should handle unknown URIs
   * gracefully rather than assuming they were listed first.
   * @param uri - The URI of the resource to fetch
   * @param args - Optional arguments to pass to the resource fetch
   * @returns Promise resolving to the resource content
   */
  getResource: (
    uri: string,
    args?: Record<string, unknown>,
  ) => Promise<ReadResourceResult>;
}
