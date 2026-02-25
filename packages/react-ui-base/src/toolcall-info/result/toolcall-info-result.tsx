"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type { TamboThreadMessage, ToolResultContent } from "@tambo-ai/react";
import * as React from "react";
import { useToolcallInfoContext } from "../root/toolcall-info-context";

export interface ToolcallInfoResultRenderProps extends Record<string, unknown> {
  content: TamboThreadMessage["content"] | null;
  hasResult: boolean;
}

export type ToolcallInfoResultProps = useRender.ComponentProps<
  "div",
  ToolcallInfoResultRenderProps
>;

/**
 * Displays the tool result from the associated tool response.
 */
export const ToolcallInfoResult = React.forwardRef<
  HTMLDivElement,
  ToolcallInfoResultProps
>(({ ...props }, ref) => {
  const { associatedToolResponse, toolCallRequest } = useToolcallInfoContext();

  // Extract the inner content from the tool_result block that matches our tool call.
  // The message content is an array like [{ type: "tool_result", toolUseId, content: [...] }].
  // Consumers expect the unwrapped inner content (text, images, etc.), not the wrapper.
  const toolResultBlock = associatedToolResponse?.content.find(
    (block): block is ToolResultContent => {
      if (block.type !== "tool_result") return false;
      // If we don't have a tool call context, just take the first tool_result block.
      if (!toolCallRequest) return true;
      // otherwise, find the tool_result block that matches our tool call's ID.
      return block.toolUseId === toolCallRequest.id;
    },
  );
  const content = toolResultBlock?.content ?? null;

  const { render, ...componentProps } = props;
  const hasResult = content !== null;
  const renderProps: ToolcallInfoResultRenderProps = {
    content,
    hasResult,
  };

  return useRender({
    defaultTagName: "div",
    ref,
    render,
    enabled: hasResult,
    state: renderProps,
    props: mergeProps(componentProps, {
      "data-slot": "toolcall-info-result",
    }),
  });
});
ToolcallInfoResult.displayName = "ToolcallInfo.Result";
