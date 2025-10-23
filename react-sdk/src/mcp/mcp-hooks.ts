import {
  GetPromptResult,
  type ListPromptsResult,
} from "@modelcontextprotocol/sdk/types.js";
import { useTamboQuery } from "../hooks";
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
  return useTamboQuery({
    queryKey: ["mcp-prompts"],
    queryFn: async (): Promise<ListPromptEntry[]> => {
      const promptResults = await Promise.allSettled(
        mcpServers.map(async (mcpServer) => ({
          server: mcpServer,
          response: await mcpServer.client?.client.listPrompts(),
        })),
      );

      const prompts: ListPromptEntry[] = promptResults
        .filter((result) => result.status === "fulfilled")
        .flatMap((result) => {
          const { server, response } = result.value;
          return response?.prompts?.map((prompt: ListPromptItem) => ({
            server,
            prompt,
          }));
        })
        .filter((prompt) => prompt !== undefined);
      return prompts;
    },
  });
}

/**
 * Hook to get the prompt for the specified name.
 * @param promptName - The name of the prompt to get.
 * @returns The prompt for the specified name.
 */
export function useTamboMcpPrompt(promptName: string) {
  // figure out which server has the prompt
  const { data: promptEntries } = useTamboMcpPromptList();
  const promptEntry = promptEntries?.find(
    (prompt) => prompt.prompt.name === promptName,
  );
  const mcpServers = useTamboMcpServers();
  const mcpServer = mcpServers.find(
    (mcpServer) => mcpServer.name === promptEntry?.server.name,
  );

  return useTamboQuery({
    queryKey: ["mcp-prompt", promptName],
    queryFn: async (): Promise<GetPromptResult | undefined> => {
      return await mcpServer?.client?.client.getPrompt({
        name: promptName,
      });
    },
  });
}
