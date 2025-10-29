import {
  GetPromptResult,
  type ListPromptsResult,
} from "@modelcontextprotocol/sdk/types.js";
import { UseQueryResult } from "@tanstack/react-query";
import { useTamboQueries, useTamboQuery } from "../hooks";
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

/**
 * Hook to get the prompts for all the registered MCP servers.
 * @returns The prompts for the MCP servers, including the server that the prompt was found on.
 */
export function useTamboMcpPromptList() {
  const mcpServers = useTamboMcpServers();
  const queries = useTamboQueries({
    queries: mcpServers.map((mcpServer) => ({
      queryKey: ["mcp-prompts", mcpServer.key],
      // Only run for connected servers that have a client
      enabled: isConnectedMcpServer(mcpServer),
      queryFn: async (): Promise<ListPromptEntry[]> => {
        // Fast path: if this server doesn't have a client, skip work
        if (!isConnectedMcpServer(mcpServer)) return [];

        const result = await mcpServer.client.client.listPrompts();
        const prompts: ListPromptItem[] = result?.prompts ?? [];
        const promptsEntries = prompts.map((prompt) => ({
          server: mcpServer as ConnectedMcpServer,
          prompt,
        }));
        return promptsEntries;
      },
    })),
    combine: (results) => {
      return combineArrayResults(results);
    },
  });

  return queries;
}
// TODO: find a more general place for this
function combineArrayResults<T>(results: UseQueryResult<T[], Error>[]) {
  const errors = results
    .filter((result) => result.isError)
    .map((result) => result.error as Error);

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
  } as const;
}

// Type guard for narrowing to connected servers
function isConnectedMcpServer(server: McpServer): server is ConnectedMcpServer {
  return "client" in server && server.client != null;
}

/**
 * Hook to get the prompt for the specified name.
 * @param promptName - The name of the prompt to get. If the prompt won't return anything
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
      if (!promptName || !mcpServer || !isConnectedMcpServer(mcpServer)) {
        return null;
      }
      const result = await mcpServer.client.client.getPrompt({
        name: promptName,
        arguments: args,
      });
      return result ?? null; // return null because react-query doesn't like undefined results
    },
  });
}
