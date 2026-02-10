"use client";

import { Slot } from "@radix-ui/react-slot";
import type { TamboThreadMessage } from "@tambo-ai/react";
import { useTambo } from "@tambo-ai/react";
import * as React from "react";
import { useOptionalMessageRootContext } from "../../message/root/message-root-context";
import { BaseProps } from "../../types/component-render-or-children";
import { getToolCallRequest } from "./get-tool-call-request";
import { getToolStatusMessage } from "./get-tool-status-message";
import { ToolcallInfoContext } from "./toolcall-info-context";

export type ToolcallInfoRootProps = BaseProps<
  React.HTMLAttributes<HTMLDivElement> & {
    /** Default expanded state. */
    defaultExpanded?: boolean;
    /** Whether the tool call is in a loading state. */
    isLoading?: boolean;
    /**
     * The full Tambo thread message object.
     * If not provided, will be read from the parent Message.Root context.
     */
    message?: TamboThreadMessage;
  }
>;

/**
 * Root component for toolcall info.
 * Provides context for child components. Returns null if not an assistant message with tool call.
 */
export const ToolcallInfoRoot = React.forwardRef<
  HTMLDivElement,
  ToolcallInfoRootProps
>(
  (
    {
      asChild,
      message: messageProp,
      isLoading: isLoadingProp,
      defaultExpanded = false,
      children,
      ...props
    },
    ref,
  ) => {
    const messageContext = useOptionalMessageRootContext();
    const message = messageProp ?? messageContext?.message;
    const isLoading = isLoadingProp ?? messageContext?.isLoading;

    if (!message) {
      throw new Error(
        "ToolcallInfo.Root requires a message prop or must be used within a Message.Root component",
      );
    }
    const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
    const { messages } = useTambo();
    const detailsId = React.useId();

    // In V1, tool results are content blocks (type "tool_result") within messages,
    // not separate "tool" role messages. Find the next message that has a tool_result
    // content block matching our tool call.
    const associatedToolResponse = React.useMemo(() => {
      if (!messages.length) return null;
      const currentMessageIndex = messages.findIndex(
        (m: TamboThreadMessage) => m.id === message.id,
      );
      if (currentMessageIndex === -1) return null;
      for (let i = currentMessageIndex + 1; i < messages.length; i++) {
        const nextMessage = messages[i];
        // Check if this message has tool_result content blocks
        const hasToolResult = nextMessage.content.some(
          (block) => block.type === "tool_result",
        );
        if (hasToolResult) {
          return nextMessage;
        }
        // Stop if we hit another assistant message with tool calls
        if (
          nextMessage.role === "assistant" &&
          getToolCallRequest(nextMessage)
        ) {
          break;
        }
      }
      return null;
    }, [message, messages]);

    const toolCallRequest = getToolCallRequest(message);
    const isToolCallMessage = message.role === "assistant" && !!toolCallRequest;
    const hasToolError =
      toolCallRequest?.hasCompleted === true &&
      !!associatedToolResponse?.content.some(
        (block) => block.type === "tool_result" && block.isError,
      );
    // getToolStatusMessage returns null only for non-assistant messages or missing toolCallRequest,
    // so provide a fallback for cases where it's not a tool call message
    const toolStatusMessage = getToolStatusMessage(message, isLoading) ?? "";

    const contextValue = React.useMemo(
      () => ({
        isExpanded,
        setIsExpanded,
        toolCallRequest,
        hasToolError,
        toolStatusMessage,
        associatedToolResponse,
        detailsId,
        isLoading,
        message,
      }),
      [
        isExpanded,
        toolCallRequest,
        hasToolError,
        toolStatusMessage,
        associatedToolResponse,
        detailsId,
        isLoading,
        message,
      ],
    );

    if (!isToolCallMessage) {
      return null;
    }

    const Comp = asChild ? Slot : "div";

    return (
      <ToolcallInfoContext.Provider value={contextValue}>
        <Comp ref={ref} data-slot="toolcall-info" {...props}>
          {children}
        </Comp>
      </ToolcallInfoContext.Provider>
    );
  },
);
ToolcallInfoRoot.displayName = "ToolcallInfo.Root";
