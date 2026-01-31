import { Slot } from "@radix-ui/react-slot";
import { TamboThreadMessage } from "@tambo-ai/react";
import * as React from "react";
import { BaseProps } from "../../types/component-render-or-children";
import { MessageRootContext } from "./message-root-context";

export type MessageRootProps = BaseProps<
  React.HTMLAttributes<HTMLDivElement> & {
    /** The role of the message sender ('user' or 'assistant'). */
    role: "user" | "assistant";
    /** The full Tambo thread message object. */
    message: TamboThreadMessage;
    /** Optional flag to indicate if the message is in a loading state. */
    isLoading?: boolean;
  }
>;

/**
 * Root primitive for a message component.
 * Provides context for child components and applies data attributes.
 * Renders nothing for tool response messages.
 */
export const MessageRoot = React.forwardRef<HTMLDivElement, MessageRootProps>(
  function MessageRoot(
    { children, role, message, isLoading, asChild, ...props },
    ref,
  ) {
    const contextValue = React.useMemo(
      () => ({ role, isLoading, message }),
      [role, isLoading, message],
    );

    // Don't render tool response messages as they're shown in tool call dropdowns
    if (message.role === "tool") {
      return null;
    }

    const Comp = asChild ? Slot : "div";

    return (
      <MessageRootContext.Provider value={contextValue}>
        <Comp
          ref={ref}
          data-slot="message-root"
          data-message-role={role}
          data-message-id={message.id}
          {...props}
        >
          {children}
        </Comp>
      </MessageRootContext.Provider>
    );
  },
);
