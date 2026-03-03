"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { useMcpPromptsContext } from "../root/mcp-prompts-context";

export interface McpPromptsTriggerState extends Record<string, unknown> {
  slot: string;
  hasPrompts: boolean;
  isLoading: boolean;
}

type McpPromptsTriggerComponentProps = useRender.ComponentProps<
  "button",
  McpPromptsTriggerState
>;

export type McpPromptsTriggerProps = McpPromptsTriggerComponentProps;

/**
 * Trigger element for the MCP prompt picker.
 * Exposes prompt availability and loading state.
 */
export const McpPromptsTrigger = React.forwardRef<
  HTMLButtonElement,
  McpPromptsTriggerProps
>((props, ref) => {
  const { prompts, isLoading } = useMcpPromptsContext();
  const hasPrompts = prompts.length > 0;

  const { render, ...componentProps } = props;
  const state: McpPromptsTriggerState = {
    slot: "mcp-prompts-trigger",
    hasPrompts,
    isLoading,
  };

  return useRender({
    defaultTagName: "button",
    ref,
    render,
    state,
    props: mergeProps(componentProps, {
      type: "button",
      disabled: !hasPrompts || undefined,
    }),
  });
});
McpPromptsTrigger.displayName = "McpPrompts.Trigger";
