import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { TamboThreadMessage } from "@tambo-ai/react";
import * as React from "react";
import { MessageRootContext } from "./message-root-context";

export interface MessageRootRenderProps extends Record<string, unknown> {
  role: "user" | "assistant";
  message: TamboThreadMessage;
  isLoading: boolean;
}

type MessageRootComponentProps = useRender.ComponentProps<
  "div",
  MessageRootRenderProps
>;

export type MessageRootProps = Omit<
  MessageRootComponentProps,
  "role" | "message" | "isLoading"
> & {
  /** The role of the message sender ('user' or 'assistant'). */
  role: "user" | "assistant";
  /** The full Tambo thread message object. */
  message: TamboThreadMessage;
  /** Optional flag to indicate if the message is in a loading state. */
  isLoading?: boolean;
};

/**
 * Root primitive for a message component.
 * Provides context for child components and applies data attributes.
 * Renders nothing for tool response messages.
 */
export const MessageRoot = React.forwardRef<HTMLDivElement, MessageRootProps>(
  function MessageRoot({ role, message, isLoading = false, ...props }, ref) {
    const contextValue = React.useMemo(
      () => ({ role, isLoading, message }),
      [role, isLoading, message],
    );
    const { render, ...componentProps } = props;
    const renderProps: MessageRootRenderProps = {
      role,
      message,
      isLoading,
    };

    return (
      <MessageRootContext.Provider value={contextValue}>
        {useRender({
          defaultTagName: "div",
          ref,
          render,
          state: renderProps,
          props: mergeProps(componentProps, {
            "data-slot": "message-root",
            "data-message-role": role,
            "data-message-id": message.id,
          }),
        })}
      </MessageRootContext.Provider>
    );
  },
);
