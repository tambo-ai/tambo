import { useRender } from "@base-ui/react/use-render";
import { TamboThreadMessage } from "@tambo-ai/react";
import * as React from "react";
import { MessageRootContext } from "./message-root-context";

export type MessageRootState = {
  slot: string;
  /** The role of the message sender ('user' or 'assistant'). */
  role: "user" | "assistant";
  /** Optional flag to indicate if the message is in a loading state. */
  isLoading?: boolean;
  /** The full Tambo thread message object. */
  message: TamboThreadMessage;
};

export type MessageRootProps = useRender.ComponentProps<
  "div",
  MessageRootState
> &
  Omit<MessageRootState, "slot">;

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
    const state = {
      slot: "message-root" as const,
      role,
      isLoading,
      message,
    };
    const element = useRender({
      defaultTagName: "div",
      ref,
      render,
      state,
      stateAttributesMapping: {
        message: () => null,
      },
      props: componentProps,
    });

    return (
      <MessageRootContext.Provider value={contextValue}>
        {element}
      </MessageRootContext.Provider>
    );
  },
);
