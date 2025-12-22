import {
  GetPromptResult,
  type ListPromptsResult,
  type ListResourcesResult,
  type ReadResourceResult,
} from "@modelcontextprotocol/sdk/types.js";
import { UseQueryResult } from "@tanstack/react-query";
import * as React from "react";
import { useTamboQueries, useTamboQuery } from "../hooks";
import { useTamboRegistry } from "../providers/tambo-registry-provider";
import { REGISTRY_SERVER_KEY } from "./mcp-constants";
import {
  type ConnectedMcpServer,
  type McpServer,
  useTamboMcpServers,
} from "./tambo-mcp-provider";

export type ListPromptItem = ListPromptsResult["prompts"][number];
export interface ListPromptEntry {
  // Only connected servers produce prompt entries, so expose the connected type
  server: ConnectedMcpServer;
  prompt: ListPromptItem;
}

export type ListResourceItem = ListResourcesResult["resources"][number];

/**
 * Registry resource entry - resources from the local registry (not MCP servers).
 *
 * These entries always have `server === null`.
 */
export interface RegistryResourceEntry {
  server: null;
  resource: ListResourceItem;
}

/**
 * MCP server resource entry - resources from connected MCP servers.
 */
export interface McpResourceEntry {
  server: ConnectedMcpServer;
  resource: ListResourceItem;
}

/**
 * Union type for all resource entries returned by `useTamboMcpResourceList`.
 */
export type ListResourceEntry = RegistryResourceEntry | McpResourceEntry;

type InternalRegistryResourceEntry = RegistryResourceEntry & {
  isDynamic: boolean;
};

type InternalListResourceEntry =
  | McpResourceEntry
  | InternalRegistryResourceEntry;

function toPublicResourceEntry(
  entry: InternalListResourceEntry,
): ListResourceEntry {
  if (entry.server === null) {
    const { isDynamic: _isDynamic, ...publicEntry } = entry;
    return publicEntry;
  }
  return entry;
}

/**
 * Type guard for narrowing a `ListResourceEntry` to an MCP-backed resource.
 */
export function isMcpResourceEntry(
  entry: ListResourceEntry,
): entry is McpResourceEntry {
  return entry.server !== null && isConnectedMcpServer(entry.server);
}

/**
 * Hook to get the prompts for all the registered MCP servers.
 * @param search - Optional search string to filter prompts by name (case-insensitive).
 * @returns The prompts for the MCP servers, including the server that the prompt was found on.
 */
export function useTamboMcpPromptList(search?: string) {
  const mcpServers = useTamboMcpServers();

  const queries = useTamboQueries({
    queries: mcpServers.map((mcpServer) => ({
      // search is NOT in queryKey - we filter locally after fetching
      queryKey: ["mcp-prompts", mcpServer.key],
      // Only run for connected servers that have a client
      enabled: isConnectedMcpServer(mcpServer),
      queryFn: async (): Promise<ListPromptEntry[]> => {
        // Fast path: if this server doesn't have a client, skip work
        if (!isConnectedMcpServer(mcpServer)) return [];

        const result = await mcpServer.client.client.listPrompts();
        const prompts: ListPromptItem[] = result?.prompts ?? [];
        // Return prompts without prefixes - we'll apply prefixing in combine
        const promptsEntries = prompts.map((prompt) => ({
          server: mcpServer,
          prompt,
        }));
        return promptsEntries;
      },
    })),
    combine: (results) => {
      const combined = combineArrayResults(results);

      // Always apply serverKey prefix to MCP prompts (breaking change for consistency with resources)
      // This ensures clear separation between local and remote prompts
      return {
        ...combined,
        data: combined.data.map((entry) => ({
          ...entry,
          prompt: {
            ...entry.prompt,
            name: `${entry.server.serverKey}:${entry.prompt.name}`,
          },
        })),
      };
    },
  });

  // Filter results by search string - runs on every search change (not just query completion)
  const filteredData = React.useMemo(() => {
    if (!search) return queries.data;

    const normalizedSearch = search.toLowerCase();
    return queries.data.filter((entry) => {
      const name = entry.prompt.name?.toLowerCase() ?? "";
      return name.includes(normalizedSearch);
    });
  }, [queries.data, search]);

  return {
    ...queries,
    data: filteredData,
  };
}
// TODO: find a more general place for this
function combineArrayResults<T>(results: UseQueryResult<T[]>[]): {
  data: T[];
  error: Error | null;
  errors: Error[];
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  isPaused: boolean;
  isRefetching: boolean;
  isFetching: boolean;
  isLoading: boolean;
  refetch: () => Promise<void>;
} {
  const errors = results
    .filter((result) => result.isError)
    .map((result) => result.error);

  // Treat queries that are idle (disabled) as non-blocking for aggregate status
  const enabledish = results.filter(
    (r) => r.fetchStatus !== "idle" || r.isSuccess || r.isError,
  );

  return {
    // Prefer flatMap to avoid extra intermediate arrays
    data: results.flatMap((result) =>
      result.isSuccess && Array.isArray(result.data) ? result.data : [],
    ),
    // Preserve a single error for compatibility and expose the full list for diagnostics
    error: errors[0] ?? null,
    errors,
    isPending: enabledish.some((result) => result.isPending),
    isSuccess:
      enabledish.length > 0 && enabledish.every((result) => result.isSuccess),
    isError: errors.length > 0,
    isPaused: enabledish.some((result) => result.isPaused),
    isRefetching: enabledish.some((result) => result.isRefetching),
    isFetching: enabledish.some((result) => result.isFetching),
    isLoading: enabledish.some((result) => result.isLoading),
    // Aggregate refetch to trigger all underlying queries
    refetch: async () => {
      await Promise.all(
        results.map(async (r) => {
          await r.refetch();
        }),
      );
    },
  };
}

/**
 * Type guard for narrowing McpServer to ConnectedMcpServer.
 * A connected server has a non-null client.
 */
export function isConnectedMcpServer(
  server: McpServer,
): server is ConnectedMcpServer {
  return "client" in server && server.client != null;
}

/**
 * Hook to get the prompt for the specified name.
 * @param promptName - The name of the prompt to get. Can be prefixed with serverKey (e.g., "linear:issue") or unprefixed.
 * @param args - The arguments to pass to the prompt.
 * @returns The prompt for the specified name.
 */
export function useTamboMcpPrompt(
  promptName: string | undefined,
  args: Record<string, string> = {},
) {
  // figure out which server has the prompt
  const { data: promptEntries } = useTamboMcpPromptList();
  const promptEntry = promptEntries?.find(
    (prompt) => prompt.prompt.name === promptName,
  );
  // Use the stable server key (and the server instance itself) instead of brittle
  // name/url/transport matching.
  const mcpServer = promptEntry?.server;

  // Strip the prefix to get the original prompt name for the MCP server call
  const originalPromptName = promptName?.includes(":")
    ? promptName.split(":").slice(1).join(":")
    : promptName;

  // Canonicalize args to avoid unstable cache keys from object identity/order
  const sortedArgsEntries = Object.keys(args)
    .sort()
    .map((k) => [k, args[k]] as const);
  return useTamboQuery({
    // Include server identity and sorted args to prevent stale cache hits
    queryKey: ["mcp-prompt", promptName, mcpServer?.key, sortedArgsEntries],
    // Only run when we have a prompt name and a connected server
    enabled: Boolean(
      promptName && mcpServer && isConnectedMcpServer(mcpServer),
    ),
    queryFn: async (): Promise<GetPromptResult | null> => {
      if (
        !originalPromptName ||
        !mcpServer ||
        !isConnectedMcpServer(mcpServer)
      ) {
        return null;
      }
      const result = await mcpServer.client.client.getPrompt({
        name: originalPromptName,
        arguments: args,
      });
      return result ?? null; // return null because react-query doesn't like undefined results
    },
  });
}

/**
 * Hook to get the resources for all the registered MCP servers and registry.
 * @param search - Optional search string. For MCP servers, results are filtered locally after fetching.
 *                 For registry dynamic sources, the search is passed to listResources(search) for dynamic generation.
 * @returns The resources from MCP servers and the local registry, including the server that the resource was found on (null for registry resources).
 */
export function useTamboMcpResourceList(search?: string) {
  const mcpServers = useTamboMcpServers();
  const { resources: staticResources, resourceSource } = useTamboRegistry();

  // Build list of queries: MCP servers + optional dynamic resource source
  const queriesToRun = [
    // MCP server queries - search is NOT in queryKey so queries don't re-run on search change
    ...mcpServers.map((mcpServer) => ({
      queryKey: ["mcp-resources", mcpServer.key],
      // Only run for connected servers that have a client
      enabled: isConnectedMcpServer(mcpServer),
      queryFn: async (): Promise<McpResourceEntry[]> => {
        // Fast path: if this server doesn't have a client, skip work
        if (!isConnectedMcpServer(mcpServer)) return [];

        const result = await mcpServer.client.client.listResources();
        const resources: ListResourceItem[] = result?.resources ?? [];
        // Return resources without prefixes - we'll apply prefixing in combine
        const resourceEntries: McpResourceEntry[] = resources.map(
          (resource) => ({
            server: mcpServer,
            resource,
          }),
        );
        return resourceEntries;
      },
    })),
    // Dynamic resource source query (if exists) - search IS in queryKey to allow dynamic generation
    ...(resourceSource
      ? [
          {
            queryKey: ["registry-resources", "dynamic", search],
            enabled: true,
            queryFn: async (): Promise<InternalRegistryResourceEntry[]> => {
              if (!resourceSource) return [];
              const resources = await resourceSource.listResources(search);
              return resources.map((resource) => ({
                server: null,
                resource,
                isDynamic: true,
              }));
            },
          },
        ]
      : []),
  ];

  const queries = useTamboQueries({
    queries: queriesToRun,
    combine: (results) => {
      // Type assertion needed because queries can return different entry types
      const combined = combineArrayResults(
        results as UseQueryResult<InternalListResourceEntry[]>[],
      );

      // Add static registry resources (no query needed)
      const staticEntries: InternalRegistryResourceEntry[] =
        staticResources.map((resource) => ({
          server: null,
          resource,
          isDynamic: false,
        }));

      // Merge static resources with query results (registry resources first)
      const allData = [...staticEntries, ...combined.data];

      // Apply serverKey prefix to ALL resources for unified @serverKey:uri format
      // Registry resources get REGISTRY_SERVER_KEY prefix, MCP resources get their serverKey
      const prefixedData = allData.map((entry) => {
        if (entry.server === null) {
          // Registry resource - prefix with REGISTRY_SERVER_KEY
          return {
            ...entry,
            resource: {
              ...entry.resource,
              uri: `${REGISTRY_SERVER_KEY}:${entry.resource.uri}`,
            },
          };
        }
        // MCP resource - always prefix with serverKey
        return {
          ...entry,
          resource: {
            ...entry.resource,
            uri: `${entry.server.serverKey}:${entry.resource.uri}`,
          },
        };
      });

      return {
        ...combined,
        data: prefixedData,
      };
    },
  });

  // Filter results by search string - runs on every search change (not just query completion)
  // - MCP resources are filtered locally
  // - Static registry resources are filtered locally
  // - Dynamic registry resources are already filtered by listResources(search)
  const filteredData = React.useMemo((): InternalListResourceEntry[] => {
    if (!search) return queries.data;

    const normalizedSearch = search.toLowerCase();
    return queries.data.filter((entry) => {
      if (entry.server === null && entry.isDynamic) {
        return true;
      }

      const name = entry.resource.name?.toLowerCase() ?? "";
      const uri = entry.resource.uri.toLowerCase();
      return name.includes(normalizedSearch) || uri.includes(normalizedSearch);
    });
  }, [queries.data, search]);

  const publicData = React.useMemo(
    () => filteredData.map(toPublicResourceEntry),
    [filteredData],
  );

  return {
    ...queries,
    data: publicData,
  };
}

/**
 * Hook to get the resource for the specified URI.
 * @param resourceUri - The URI of the resource to get. Must be prefixed:
 *   - MCP resources: prefixed with serverKey (e.g., "linear:file://foo")
 *   - Registry resources: prefixed with "registry:" (e.g., "registry:file://bar")
 * @returns The resource for the specified URI.
 */
export function useTamboMcpResource(resourceUri: string | undefined) {
  const { resourceSource } = useTamboRegistry();
  const { data: resourceEntries } = useTamboMcpResourceList();

  // Find which server/source has the resource
  const resourceEntry = resourceEntries?.find(
    (entry) => entry.resource.uri === resourceUri,
  );

  // Determine if this is a registry resource or MCP resource
  const isRegistryResource = resourceEntry?.server === null;
  const mcpServer = resourceEntry?.server ?? null;

  // Check if the URI has the registry prefix
  const hasRegistryPrefix = Boolean(
    resourceUri?.startsWith(`${REGISTRY_SERVER_KEY}:`),
  );

  // Strip the prefix to get the original resource URI for fetching
  let originalResourceUri: string | undefined;
  if (isRegistryResource || hasRegistryPrefix) {
    const prefixLen = REGISTRY_SERVER_KEY.length + 1; // +1 for the colon
    originalResourceUri = resourceUri?.slice(prefixLen);
  } else if (mcpServer) {
    const prefixLen = mcpServer.serverKey.length + 1; // +1 for the colon
    originalResourceUri = resourceUri?.slice(prefixLen);
  }

  // Check if we can fetch this resource
  const hasRegistrySource = resourceSource != null;
  const hasConnectedMcpServer =
    mcpServer != null && isConnectedMcpServer(mcpServer);
  const canFetchFromRegistry =
    hasRegistrySource && (isRegistryResource || hasRegistryPrefix);
  const canFetchResource = Boolean(
    resourceUri && (canFetchFromRegistry || hasConnectedMcpServer),
  );

  const locationKey =
    isRegistryResource || hasRegistryPrefix
      ? REGISTRY_SERVER_KEY
      : mcpServer?.key;

  return useTamboQuery({
    queryKey: ["resource", resourceUri, locationKey],
    enabled: canFetchResource,
    queryFn: async (): Promise<ReadResourceResult | null> => {
      if (!originalResourceUri) {
        return null;
      }

      // Registry resource: use resourceSource.getResource
      if (resourceSource && (isRegistryResource || hasRegistryPrefix)) {
        const result = await resourceSource.getResource(originalResourceUri);
        return result ?? null;
      }

      // MCP resource: use MCP client
      if (mcpServer && isConnectedMcpServer(mcpServer)) {
        const result = await mcpServer.client.client.readResource({
          uri: originalResourceUri,
        });
        return result ?? null;
      }

      return null;
    },
  });
}
