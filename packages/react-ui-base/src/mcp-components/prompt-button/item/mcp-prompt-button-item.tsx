"use client";

import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import {
  useMcpPromptButtonContext,
  type McpPromptEntry,
} from "../root/mcp-prompt-button-context";

export interface McpPromptButtonItemRenderProps {
  /** The prompt entry data */
  prompt: McpPromptEntry;
  /** The prompt name */
  name: string;
  /** The prompt description, if any */
  description: string | undefined;
}

export interface McpPromptButtonItemProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onClick" | "children"
> {
  /** When true, renders as a Slot, merging props into the child element. */
  asChild?: boolean;
  /** The prompt entry to render */
  prompt: McpPromptEntry;
  /** Optional click handler override (defaults to selecting the prompt) */
  onSelect?: () => void;
  /** Children as ReactNode or render function */
  children?:
    | React.ReactNode
    | ((props: McpPromptButtonItemRenderProps) => React.ReactNode);
}

/**
 * Item primitive for displaying a single prompt option.
 * Renders a clickable item that selects the prompt when clicked.
 * @returns The prompt item element
 */
export const McpPromptButtonItem = React.forwardRef<
  HTMLDivElement,
  McpPromptButtonItemProps
>(({ prompt, onSelect, asChild, children, ...props }, ref) => {
  const { onSelectPrompt } = useMcpPromptButtonContext();

  const renderProps: McpPromptButtonItemRenderProps = {
    prompt,
    name: prompt.prompt.name,
    description: prompt.prompt.description,
  };

  const handleClick = () => {
    if (onSelect) {
      onSelect();
    } else {
      onSelectPrompt(prompt.prompt.name);
    }
  };

  const Comp = asChild ? Slot : "div";
  const content =
    typeof children === "function" ? children(renderProps) : children;

  return (
    <Comp
      ref={ref}
      role="menuitem"
      tabIndex={0}
      data-slot="mcp-prompt-button-item"
      onClick={handleClick}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      {...props}
    >
      {content}
    </Comp>
  );
});
McpPromptButtonItem.displayName = "McpPromptButton.Item";
