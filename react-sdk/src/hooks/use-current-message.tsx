import React, { createContext, PropsWithChildren, useContext } from "react";
import { useTamboThread } from "../providers";

interface TamboMessageContextProps {
  /**
   * The threadId of the thread
   * @deprecated Use the thread object from the TamboThreadProvider instead
   */
  threadId?: string;
  /** The messageId of the message */
  messageId: string;
}

const TamboMessageContext = createContext<TamboMessageContextProps>({
  messageId: "",
});

/**
 * Wraps all components, so that they can find what thread and message they are in
 * @param props - props for the TamboMessageProvider
 * @param props.children - The children to wrap
 * @param props.messageId - The messageId of the message
 * @returns The wrapped component
 */
export const TamboMessageProvider: React.FC<
  PropsWithChildren<TamboMessageContextProps>
> = ({ children, messageId }) => {
  // Use a unique key={...} to force a re-render when the messageId changes - this
  // make sure that if the rendered component is swapped into a tree (like if
  // you always show the last rendered component) then the state/etc is correct
  return (
    <TamboMessageContext.Provider value={{ messageId }} key={messageId}>
      {children}
    </TamboMessageContext.Provider>
  );
};

/**
 * Wraps a component with a ComponentMessageProvider - this allows the provider
 * to be used outside of a TSX file
 * @param children - The children to wrap
 * @param threadId - The threadId of the thread
 * @param messageId - The messageId of the message
 * @returns The wrapped component
 */
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
/**
 * Hook used inside a component wrapped with ComponentMessageProvider, to get
 * the threadId and messageId
 * @returns The threadId and messageId
 */
export const useTamboMessageContext = () => {
  const context = useContext(TamboMessageContext);
  if (!context) {
    throw new Error(
      "useTamboMessageContext must be used within a TamboMessageProvider",
    );
  }
  return context;
};

/**
 * Hook used inside a component wrapped with ComponentMessageProvider, to get
 * the current message. The current thread will be fetched from the server, if
 * it is not already in the cache.
 * @returns The current message that is used to render the component
 */
export const useTamboCurrentMessage = () => {
  const { messageId, threadId } = useTamboMessageContext();
  const { thread } = useTamboThread();
  if (thread.id && threadId && thread.id !== threadId) {
    console.warn(`Thread ID mismatch ${thread.id} !== ${threadId}`);
  }

  const message = thread.messages.find((m) => m.id === messageId);
  return message;
};
