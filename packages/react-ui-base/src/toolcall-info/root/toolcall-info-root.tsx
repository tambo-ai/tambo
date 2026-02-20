"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type { TamboThreadMessage, TamboToolUseContent } from "@tambo-ai/react";
import { useTambo } from "@tambo-ai/react";
import * as React from "react";
import { useOptionalMessageRootContext } from "../../message/root/message-root-context";
import { getToolCallRequest } from "./get-tool-call-request";
import { getToolStatusMessage } from "./get-tool-status-message";
import { ToolcallInfoContext } from "./toolcall-info-context";

export interface ToolcallInfoRootRenderProps extends Record<string, unknown> {
  isExpanded: boolean;
  hasToolError: boolean;
  toolStatusMessage: string;
  isLoading: boolean;
  hasAssociatedResponse: boolean;
}

type ToolcallInfoRootComponentProps = useRender.ComponentProps<
  "div",
  ToolcallInfoRootRenderProps
>;

export type ToolcallInfoRootProps = Omit<
  ToolcallInfoRootComponentProps,
  "isLoading"
> & {
  /** Default expanded state. */
  defaultExpanded?: boolean;
  /** Whether the tool call is in a loading state. */
  isLoading?: boolean;
  /**
   * The full Tambo thread message object.
   * If not provided, will be read from the parent Message.Root context.
   */
  message?: TamboThreadMessage;
  /**
   * Specific tool_use block to display.
   * If not provided, the first tool_use block from the message is used.
   */
  toolUse?: TamboToolUseContent;
};

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
      message: messageProp,
      isLoading: isLoadingProp,
      defaultExpanded = false,
      toolUse: toolUseProp,
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

    const toolCallRequest = toolUseProp ?? getToolCallRequest(message);
    const isToolCallMessage = message.role === "assistant" && !!toolCallRequest;
    const hasToolError =
      toolCallRequest?.hasCompleted === true &&
      !!associatedToolResponse?.content.some(
        (block) =>
          block.type === "tool_result" &&
          block.toolUseId === toolCallRequest.id &&
          block.isError,
      );
    const toolStatusMessage =
      getToolStatusMessage(toolCallRequest, isLoading) ?? "";

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

    const { render, ...componentProps } = props;
    const renderProps: ToolcallInfoRootRenderProps = {
      isExpanded,
      hasToolError,
      toolStatusMessage,
      isLoading: !!isLoading,
      hasAssociatedResponse: !!associatedToolResponse,
    };

    return (
      <ToolcallInfoContext.Provider value={contextValue}>
        {useRender({
          defaultTagName: "div",
          ref,
          render,
          state: renderProps,
          props: mergeProps(componentProps, {
            "data-slot": "toolcall-info",
          }),
        })}
      </ToolcallInfoContext.Provider>
    );
  },
);
ToolcallInfoRoot.displayName = "ToolcallInfo.Root";
