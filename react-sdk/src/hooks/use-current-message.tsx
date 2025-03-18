import React, { createContext, PropsWithChildren, useContext } from "react";
import { useTamboThread } from "../providers";

const TamboMessageContext = createContext<{
  threadId: string;
  messageId: string;
}>({} as { threadId: string; messageId: string });

/** Wraps all components, so that they can find what thread and message they are in */
export const TamboMessageProvider: React.FC<
  PropsWithChildren<{ threadId: string; messageId: string }>
> = ({ children, threadId, messageId }) => {
  // Use a unique key={...} to force a re-render when the messageId changes - this
  // make sure that if the rendered component is swapped into a tree (like if
  // you always show the last rendered component) then the state/etc is correct
  return (
    <TamboMessageContext.Provider
      value={{ threadId, messageId }}
      key={`${threadId}-${messageId}`}
    >
      {children}
    </TamboMessageContext.Provider>
  );
};

/** Wraps a component with a ComponentMessageProvider - this allows the provider
 * to be used outside of a TSX file */
export function wrapWithTamboMessageProvider(
  children: React.ReactNode,
  threadId: string,
  messageId: string,
) {
  return (
    <TamboMessageProvider threadId={threadId} messageId={messageId}>
      {children}
    </TamboMessageProvider>
  );
}
/** Hook used inside a component wrapped with ComponentMessageProvider, to get
 * the threadId and messageId */

export const useTamboMessageContext = () => {
  const context = useContext(TamboMessageContext);
  if (!context) {
    throw new Error(
      "useTamboMessageContext must be used within a TamboMessageProvider",
    );
  }
  return context;
};

/** Hook used inside a component wrapped with ComponentMessageProvider, to get
 * the current message */
export const useTamboCurrentMessage = () => {
  const { messageId, threadId } = useTamboMessageContext();
  const { thread } = useTamboThread();
  if (thread.id && threadId && thread.id !== threadId) {
    console.warn(`Thread ID mismatch ${thread.id} !== ${threadId}`);
  }

  const message = thread.messages.find((m) => m.id === messageId);
  return message;
};
