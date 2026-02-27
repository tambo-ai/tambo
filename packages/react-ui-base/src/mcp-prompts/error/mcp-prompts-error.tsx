"use client";

import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { useMcpPromptsContext } from "../root/mcp-prompts-context";

export interface McpPromptsErrorState extends Record<string, unknown> {
  slot: string;
  error: string | null;
}

type McpPromptsErrorComponentProps = useRender.ComponentProps<
  "div",
  McpPromptsErrorState
>;

export type McpPromptsErrorProps = McpPromptsErrorComponentProps;

/**
 * Error display for MCP prompt fetch/validation failures.
 * Only renders when the prompt status is "error".
 */
export const McpPromptsError = React.forwardRef<
  HTMLDivElement,
  McpPromptsErrorProps
>((props, ref) => {
  const { status, error } = useMcpPromptsContext();

  const { render, ...componentProps } = props;
  const state: McpPromptsErrorState = {
    slot: "mcp-prompts-error",
    error,
  };

  return useRender({
    defaultTagName: "div",
    ref,
    render,
    state,
    props: componentProps,
    enabled: status === "error",
  });
});
McpPromptsError.displayName = "McpPrompts.Error";
