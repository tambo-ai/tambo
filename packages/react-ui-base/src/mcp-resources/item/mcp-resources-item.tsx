"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { useMcpResourcesContext } from "../root/mcp-resources-context";

export interface McpResourcesItemState extends Record<string, unknown> {
  slot: string;
  uri: string;
  name: string | undefined;
  description: string | undefined;
  select: () => void;
}

type McpResourcesItemComponentProps = useRender.ComponentProps<
  "button",
  McpResourcesItemState
>;

export interface McpResourcesItemProps extends McpResourcesItemComponentProps {
  /** The resource URI. */
  uri: string;
  /** The resource display name. */
  name?: string;
  /** The resource description. */
  description?: string;
}

/**
 * Individual resource item that triggers resource selection on interaction.
 */
export const McpResourcesItem = React.forwardRef<
  HTMLButtonElement,
  McpResourcesItemProps
>(({ uri, name, description, ...props }, ref) => {
  const { onSelectResource } = useMcpResourcesContext();

  const handleClick = () => {
    onSelectResource(uri, name ?? uri);
  };

  const { render, ...componentProps } = props;
  const state: McpResourcesItemState = {
    slot: "mcp-resources-item",
    uri,
    name,
    description,
    select: handleClick,
  };

  return useRender({
    defaultTagName: "button",
    ref,
    render,
    state,
    props: mergeProps(componentProps, {
      type: "button",
      onClick: handleClick,
    }),
  });
});
McpResourcesItem.displayName = "McpResources.Item";
