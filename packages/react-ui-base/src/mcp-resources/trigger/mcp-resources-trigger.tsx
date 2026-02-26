"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { useMcpResourcesContext } from "../root/mcp-resources-context";

export interface McpResourcesTriggerState extends Record<string, unknown> {
  slot: string;
  hasResources: boolean;
  isLoading: boolean;
}

type McpResourcesTriggerComponentProps = useRender.ComponentProps<
  "button",
  McpResourcesTriggerState
>;

export type McpResourcesTriggerProps = McpResourcesTriggerComponentProps;

/**
 * Trigger element for the MCP resource picker.
 * Exposes resource availability and loading state.
 */
export const McpResourcesTrigger = React.forwardRef<
  HTMLButtonElement,
  McpResourcesTriggerProps
>((props, ref) => {
  const { resources, isLoading } = useMcpResourcesContext();
  const hasResources = resources.length > 0;

  const { render, ...componentProps } = props;
  const state: McpResourcesTriggerState = {
    slot: "mcp-resources-trigger",
    hasResources,
    isLoading,
  };

  return useRender({
    defaultTagName: "button",
    ref,
    render,
    state,
    props: mergeProps(componentProps, {
      type: "button",
      disabled: !hasResources || undefined,
    }),
    enabled: hasResources,
  });
});
McpResourcesTrigger.displayName = "McpResources.Trigger";
