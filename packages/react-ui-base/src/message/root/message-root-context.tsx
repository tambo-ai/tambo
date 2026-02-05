import { TamboThreadMessage } from "@tambo-ai/react";
import React from "react";

/**
 * Context value shared among Message primitive sub-components.
 */
export interface MessageRootContextValue {
  role: "user" | "assistant";
  message: TamboThreadMessage;
  isLoading?: boolean;
}

const MessageRootContext = React.createContext<MessageRootContextValue | null>(
  null,
);

/**
 * Hook to optionally access the message context.
 * Returns null if not within a Message.Root component.
 * @internal This hook is for internal use by base components only.
 * @returns The message context value or null
 */
function useOptionalMessageRootContext(): MessageRootContextValue | null {
  return React.useContext(MessageRootContext);
}

/**
 * Hook to access the message context.
 * @internal This hook is for internal use by base components only.
 * @returns The message context value
 * @throws Error if used outside of Message.Root component
 */
function useMessageRootContext(): MessageRootContextValue {
  const context = React.useContext(MessageRootContext);
  if (!context) {
    throw new Error(
      "React UI Base: MessageRootContext is missing. Message parts must be used within <Message.Root>",
    );
  }
  return context;
}

export {
  MessageRootContext,
  useMessageRootContext,
  useOptionalMessageRootContext,
};
