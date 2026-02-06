"use client";

import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../../types/component-render-or-children";
import { useRender } from "../../../use-render/use-render";
import {
  useMcpPromptButtonContext,
  type McpPromptEntry,
} from "../root/mcp-prompt-button-context";

export interface McpPromptButtonListRenderProps {
  /** List of available prompts */
  promptList: McpPromptEntry[] | undefined;
  /** Whether the list is loading */
  isLoading: boolean;
  /** Whether there are no prompts available */
  isEmpty: boolean;
}

export type McpPromptButtonListProps = BasePropsWithChildrenOrRenderFunction<
  React.HTMLAttributes<HTMLDivElement>,
  McpPromptButtonListRenderProps
>;

/**
 * List container primitive for prompt items.
 * Provides render props with prompt list data for custom rendering.
 * @returns The list container element
 */
export const McpPromptButtonList = React.forwardRef<
  HTMLDivElement,
  McpPromptButtonListProps
>((props, ref) => {
  const { promptList, isLoading } = useMcpPromptButtonContext();

  const renderProps: McpPromptButtonListRenderProps = {
    promptList,
    isLoading,
    isEmpty: !promptList || promptList.length === 0,
  };

  const { content, componentProps } = useRender(props, renderProps);
  const { asChild, ...rest } = componentProps;

  const Comp = asChild ? Slot : "div";

  return (
    <Comp ref={ref} role="menu" data-slot="mcp-prompt-button-list" {...rest}>
      {content}
    </Comp>
  );
});
McpPromptButtonList.displayName = "McpPromptButton.List";
