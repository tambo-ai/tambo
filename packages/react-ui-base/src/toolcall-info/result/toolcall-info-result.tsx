"use client";

import { Slot } from "@radix-ui/react-slot";
import type { TamboThreadMessage } from "@tambo-ai/react";
import * as React from "react";
import { useToolcallInfoContext } from "../root/toolcall-info-context";

export interface ToolcallInfoResultRenderProps {
  content: TamboThreadMessage["content"] | null;
  hasResult: boolean;
}

export interface ToolcallInfoResultProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  /** When true, renders as a Slot, merging props into the child element. */
  asChild?: boolean;
  /** Render prop for custom result rendering. */
  children?: (props: ToolcallInfoResultRenderProps) => React.ReactNode;
}

/**
 * Displays the tool result from the associated tool response.
 */
export const ToolcallInfoResult = React.forwardRef<
  HTMLDivElement,
  ToolcallInfoResultProps
>(({ asChild, children, ...props }, ref) => {
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

  const Comp = asChild ? Slot : "div";

  return (
    <Comp ref={ref} data-slot="toolcall-info-result" {...props}>
      {children?.({
        content: resultContent,
        hasResult: resultContent !== null,
      })}
    </Comp>
  );
});
ToolcallInfoResult.displayName = "ToolcallInfo.Result";
