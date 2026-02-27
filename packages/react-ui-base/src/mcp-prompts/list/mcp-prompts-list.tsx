"use client";

import { useRender } from "@base-ui/react/use-render";
import type { ListPromptEntry } from "@tambo-ai/react/mcp";
import * as React from "react";
import { useMcpPromptsContext } from "../root/mcp-prompts-context";

export interface McpPromptsListState extends Record<string, unknown> {
  slot: string;
  prompts: ListPromptEntry[];
  promptCount: number;
}

type McpPromptsListComponentProps = useRender.ComponentProps<
  "div",
  McpPromptsListState
>;

export type McpPromptsListProps = McpPromptsListComponentProps;

/**
 * List container for MCP prompts.
 * Exposes the prompt list via render state for consumer iteration.
 */
export const McpPromptsList = React.forwardRef<
  HTMLDivElement,
  McpPromptsListProps
>((props, ref) => {
  const { prompts } = useMcpPromptsContext();

  const { render, ...componentProps } = props;
  const state: McpPromptsListState = {
    slot: "mcp-prompts-list",
    prompts,
    promptCount: prompts.length,
  };

  return useRender({
    defaultTagName: "div",
    ref,
    render,
    state,
    stateAttributesMapping: {
      prompts: () => null,
    },
    props: componentProps,
  });
});
McpPromptsList.displayName = "McpPrompts.List";
