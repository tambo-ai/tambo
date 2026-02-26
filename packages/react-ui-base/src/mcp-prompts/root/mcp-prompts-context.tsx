import type { ListPromptEntry } from "@tambo-ai/react/mcp";
import * as React from "react";

export type McpPromptsStatus = "idle" | "fetching" | "error" | "done";

export interface McpPromptsContextValue {
  prompts: ListPromptEntry[];
  isLoading: boolean;
  selectedPrompt: string | null;
  status: McpPromptsStatus;
  error: string | null;
  select: (promptName: string) => void;
  insertedText: string | null;
}

export const McpPromptsContext =
  React.createContext<McpPromptsContextValue | null>(null);

/**
 * Hook to access the MCP prompts context.
 * @internal This hook is for internal use by base components only.
 * Consumers should use component `render` props instead.
 * @returns The MCP prompts context value
 * @throws Error if used outside of McpPrompts.Root
 */
export function useMcpPromptsContext(): McpPromptsContextValue {
  const context = React.useContext(McpPromptsContext);
  if (!context) {
    throw new Error(
      "React UI Base: McpPromptsContext is missing. McpPrompts parts must be used within <McpPrompts.Root>",
    );
  }
  return context;
}
