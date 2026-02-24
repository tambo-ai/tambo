"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type { TamboThreadMessage } from "@tambo-ai/react";
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

  if (!associatedToolResponse) {
    return null;
  }

  // Extract the inner content from the tool_result block that matches our tool call.
  // The message content is an array like [{ type: "tool_result", toolUseId, content: [...] }].
  // Consumers expect the unwrapped inner content (text, images, etc.), not the wrapper.
  const toolResultBlock = toolCallRequest
    ? associatedToolResponse.content.find(
        (block) =>
          block.type === "tool_result" &&
          block.toolUseId === toolCallRequest.id,
      )
    : associatedToolResponse.content.find(
        (block) => block.type === "tool_result",
      );

  const resultContent =
    toolResultBlock?.type === "tool_result" && toolResultBlock.content
      ? toolResultBlock.content
      : null;

  const { render, ...componentProps } = props;
  const renderProps: ToolcallInfoResultRenderProps = {
    content: resultContent,
    hasResult: resultContent !== null,
  };

  return useRender({
    defaultTagName: "div",
    ref,
    render,
    state: renderProps,
    props: mergeProps(componentProps, {
      "data-slot": "toolcall-info-result",
    }),
  });
});
ToolcallInfoResult.displayName = "ToolcallInfo.Result";
