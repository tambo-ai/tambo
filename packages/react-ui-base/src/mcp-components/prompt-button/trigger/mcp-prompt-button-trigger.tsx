"use client";

import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { BasePropsWithChildrenOrRenderFunction } from "../../../types/component-render-or-children";
import { useRender } from "../../../use-render/use-render";
import { useMcpPromptButtonContext } from "../root/mcp-prompt-button-context";

export interface McpPromptButtonTriggerRenderProps {
  /** Whether there is currently an error */
  hasError: boolean;
  /** The error message, if any */
  errorMessage: string | null;
}

export type McpPromptButtonTriggerProps = BasePropsWithChildrenOrRenderFunction<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  McpPromptButtonTriggerRenderProps
>;

/**
 * Trigger button primitive for the MCP prompt button.
 * Renders a button element (or a Slot when asChild is true) that can be
 * used to open the dropdown menu.
 * @returns The trigger button element
 */
export const McpPromptButtonTrigger = React.forwardRef<
  HTMLButtonElement,
  McpPromptButtonTriggerProps
>((props, ref) => {
  const { promptError } = useMcpPromptButtonContext();

  const renderProps: McpPromptButtonTriggerRenderProps = {
    hasError: !!promptError,
    errorMessage: promptError,
  };

  const { content, componentProps } = useRender(props, renderProps);
  const { asChild, ...rest } = componentProps;

  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      type="button"
      data-slot="mcp-prompt-button-trigger"
      data-error={promptError ? "true" : undefined}
      aria-label="Insert MCP Prompt"
      {...rest}
    >
      {content}
    </Comp>
  );
});
McpPromptButtonTrigger.displayName = "McpPromptButton.Trigger";
