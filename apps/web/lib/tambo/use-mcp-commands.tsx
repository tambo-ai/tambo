"use client";

import type {
  CommandConfig,
  ResourceItem,
} from "@/components/ui/tambo/message-input";
import {
  useTamboMcpPrompt,
  useTamboMcpPromptList,
  useTamboMcpResourceList,
} from "@tambo-ai/react/mcp";
import { AtSign, FileText } from "lucide-react";
import * as React from "react";

/**
 * Hook that provides MCP-specific command configurations for the text editor.
 * Returns CommandConfig array for:
 * - MCP resources as @-mentions
 * - MCP prompts as /-commands (only when input is empty)
 *
 * @param options Configuration options
 * @param options.value Current editor value (needed to check if input is empty for / commands)
 * @param options.onInsertResource Callback when a resource is selected (inserts @uri)
 * @param options.onInsertPrompt Callback when a prompt is selected (inserts prompt text)
 * @returns Array of CommandConfig for MCP resources and prompts
 */
export function useMcpCommands(options: {
  value: string;
  onInsertResource: (resourceUri: string) => void;
  onInsertPrompt: (promptText: string) => void;
}): CommandConfig[] {
  const { value, onInsertResource, onInsertPrompt } = options;

  // Get MCP resources and prompts
  const { data: mcpResources } = useTamboMcpResourceList();
  const { data: mcpPrompts } = useTamboMcpPromptList();

  // State for handling prompt selection and fetching
  const [selectedPromptName, setSelectedPromptName] = React.useState<
    string | null
  >(null);
  const { data: promptData } = useTamboMcpPrompt(selectedPromptName ?? "");

  // When prompt data is fetched, insert it
  React.useEffect(() => {
    if (promptData && selectedPromptName) {
      // Extract the text from the prompt messages
      const promptText = promptData.messages
        .map((msg) => {
          if (msg.content.type === "text") {
            return msg.content.text;
          }
          return "";
        })
        .filter(Boolean)
        .join("\n");

      onInsertPrompt(promptText);
      setSelectedPromptName(null);
    }
  }, [promptData, selectedPromptName, onInsertPrompt]);

  return React.useMemo((): CommandConfig[] => {
    const commands: CommandConfig[] = [];

    // Add MCP resources as @ mentions
    if (mcpResources && mcpResources.length > 0) {
      commands.push({
        triggerChar: "@",
        items: async (query: string): Promise<ResourceItem[]> => {
          const resourceItems = mcpResources.map((entry) => ({
            id: `mcp-resource:${entry.resource.uri}`,
            name: entry.resource.name ?? entry.resource.uri,
            icon: React.createElement(AtSign, { className: "w-4 h-4" }),
            componentData: { type: "mcp-resource", data: entry },
          }));

          // Filter by query
          return resourceItems.filter((item) =>
            item.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
          );
        },
        onSelect: (item: ResourceItem) => {
          // Extract the URI from the id
          const resourceUri = item.id.replace("mcp-resource:", "");
          onInsertResource(`@${resourceUri}`);
        },
        renderLabel: ({ node }) => `@${(node.attrs.label as string) ?? ""}`,
        HTMLAttributes: { class: "mention mcp-resource" },
      });
    }

    // Add MCP prompts as / commands (only when input is empty)
    if (mcpPrompts && mcpPrompts.length > 0) {
      commands.push({
        triggerChar: "/",
        items: async (query: string): Promise<ResourceItem[]> => {
          // Only show prompts if the input is empty (except for the / char)
          if (value.trim().length > 0) {
            return [];
          }

          const promptItems = mcpPrompts.map((entry) => ({
            id: entry.prompt.name,
            name: entry.prompt.name,
            icon: React.createElement(FileText, { className: "w-4 h-4" }),
            componentData: entry,
          }));

          return promptItems.filter((item) =>
            item.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
          );
        },
        onSelect: (item: ResourceItem) => {
          // Trigger prompt fetching by setting the selected prompt name
          setSelectedPromptName(item.id);
        },
        renderLabel: ({ node }) => `/${(node.attrs.label as string) ?? ""}`,
        HTMLAttributes: { class: "mention command mcp-prompt" },
      });
    }

    return commands;
  }, [mcpResources, mcpPrompts, value, onInsertResource]);
}
