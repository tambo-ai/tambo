import {
  GetPromptResult,
  type ListPromptsResult,
} from "@modelcontextprotocol/sdk/types.js";
import { UseQueryResult } from "@tanstack/react-query";
import { useTamboQueries, useTamboQuery } from "../hooks";
import { McpServerInfo, useTamboMcpServers } from "./tambo-mcp-provider";

export type ListPromptItem = ListPromptsResult["prompts"][number];
export interface ListPromptEntry {
  server: McpServerInfo;
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
      queryFn: async (): Promise<ListPromptEntry[]> => {
        const result = await mcpServer.client?.client.listPrompts();
        const prompts: ListPromptItem[] = result?.prompts ?? [];
        const promptsEntries = prompts.map((prompt) => ({
          server: mcpServer,
          prompt,
        }));
        return promptsEntries ?? [];
      },
    })),
    combine: (results) => {
      return combineArrayResults(results);
    },
  });

  return queries;
}
// TODO: find a more general place for this
function combineArrayResults<T>(results: UseQueryResult<T[], Error>[]): {
  data: T[];
  error: Error[];
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  isPaused: boolean;
  isRefetching: boolean;
  isFetching: boolean;
  isLoading: boolean;
} {
  return {
    data: results
      .filter((result) => result.isSuccess)
      .map((result) => result.data)
      .flat(),
    error: results
      .filter((result) => result.isError)
      .map((result) => result.error)
      .flat(),
    isPending: results.some((result) => result.isPending),
    isSuccess: results.every((result) => result.isSuccess),
    isError: results.some((result) => result.isError),
    isPaused: results.some((result) => result.isPaused),
    isRefetching: results.some((result) => result.isRefetching),
    isFetching: results.some((result) => result.isFetching),
    isLoading: results.some((result) => result.isLoading),
  };
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
  const mcpServers = useTamboMcpServers();
  const mcpServer = mcpServers.find(
    (mcpServer) =>
      mcpServer.name === promptEntry?.server.name &&
      mcpServer.url === promptEntry?.server.url &&
      mcpServer.transport === promptEntry?.server.transport,
  );

  return useTamboQuery({
    queryKey: ["mcp-prompt", promptName],
    queryFn: async (): Promise<GetPromptResult | null> => {
      if (!promptName) {
        return null;
      }
      const result = await mcpServer?.client?.client.getPrompt({
        name: promptName,
        arguments: args,
      });
      return result ?? null; // return null because react-query doesn't like undefined results
    },
  });
}
