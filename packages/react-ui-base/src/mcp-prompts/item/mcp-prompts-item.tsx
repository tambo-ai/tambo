"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { useMcpPromptsContext } from "../root/mcp-prompts-context";

export interface McpPromptsItemState extends Record<string, unknown> {
  slot: string;
  name: string;
  description: string | undefined;
  isSelected: boolean;
}

type McpPromptsItemComponentProps = useRender.ComponentProps<
  "button",
  McpPromptsItemState
>;

export interface McpPromptsItemProps extends McpPromptsItemComponentProps {
  /** The prompt name to select when clicked. */
  name: string;
  /** Optional description to expose via state. */
  description?: string;
}

/**
 * Individual prompt item that triggers prompt selection on interaction.
 */
export const McpPromptsItem = React.forwardRef<
  HTMLButtonElement,
  McpPromptsItemProps
>(({ name, description, ...props }, ref) => {
  const { select, selectedPrompt } = useMcpPromptsContext();
  const isSelected = selectedPrompt === name;

  const handleClick = () => {
    select(name);
  };

  const { render, ...componentProps } = props;
  const state: McpPromptsItemState = {
    slot: "mcp-prompts-item",
    name,
    description,
    isSelected,
  };

  return useRender({
    defaultTagName: "button",
    ref,
    render,
    state,
    props: mergeProps(componentProps, {
      type: "button",
      "data-selected": isSelected || undefined,
      onClick: handleClick,
    }),
  });
});
McpPromptsItem.displayName = "McpPrompts.Item";
