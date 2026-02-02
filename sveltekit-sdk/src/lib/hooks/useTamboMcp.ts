import { getContext } from "svelte";
import { TAMBO_MCP_KEY } from "../context.js";
import type { TamboMcpContext } from "../providers/TamboMcpProvider.svelte";

/**
 * Get the MCP context from the provider.
 *
 * Must be called within a component that is a descendant of TamboMcpProvider
 * (which is included in TamboProvider).
 * @returns The MCP context
 * @throws Error if called outside of TamboMcpProvider
 */
export function useTamboMcpServers(): TamboMcpContext {
  const context = getContext<TamboMcpContext | undefined>(TAMBO_MCP_KEY);

  if (!context) {
    throw new Error("useTamboMcpServers must be used within a TamboProvider");
  }

  return context;
}

/**
 * Get a specific MCP prompt from a server.
 * @param serverName - Name of the MCP server
 * @param promptName - Name of the prompt
 * @param args - Arguments for the prompt
 * @returns Promise resolving to the prompt result
 */
export async function useTamboMcpPrompt(
  serverName: string,
  promptName: string,
  args?: Record<string, string>,
): Promise<unknown> {
  const context = getContext<TamboMcpContext | undefined>(TAMBO_MCP_KEY);

  if (!context) {
    throw new Error("useTamboMcpPrompt must be used within a TamboProvider");
  }

  return context.getPrompt(serverName, promptName, args);
}

/**
 * Get a specific MCP resource from a server.
 * @param serverName - Name of the MCP server
 * @param uri - URI of the resource
 * @returns Promise resolving to the resource result
 */
export async function useTamboMcpResource(
  serverName: string,
  uri: string,
): Promise<unknown> {
  const context = getContext<TamboMcpContext | undefined>(TAMBO_MCP_KEY);

  if (!context) {
    throw new Error("useTamboMcpResource must be used within a TamboProvider");
  }

  return context.getResource(serverName, uri);
}
