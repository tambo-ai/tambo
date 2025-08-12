"use client";
import React, { createContext, PropsWithChildren, useContext } from "react";
import { TamboThreadMessage } from "../model/generate-component-response";

interface TamboMessageContextProps {
  /**
   * The actual message object for this context
   */
  message: TamboThreadMessage;
}

const TamboMessageContext = createContext<TamboMessageContextProps | null>(
  null,
);

/**
 * Wraps all components, so that they can find what message they are in
 * @param props - props for the TamboMessageProvider
 * @param props.children - The children to wrap
 * @param props.message - The message object
 * @returns The wrapped component
 */
export const TamboMessageProvider: React.FC<
  PropsWithChildren<{ message: TamboThreadMessage }>
> = ({ children, message }) => {
  // Use a unique key={...} to force a re-render when the message changes - this
  // make sure that if the rendered component is swapped into a tree (like if
  // you always show the last rendered component) then the state/etc is correct
  return (
    <TamboMessageContext.Provider value={{ message }} key={message.id}>
      {children}
    </TamboMessageContext.Provider>
  );
};

/**
 * Wraps a component with a TamboMessageProvider - this allows the provider
 * to be used outside of a TSX file
 * @param children - The children to wrap
 * @param message - The message object
 * @returns The wrapped component
 */
export function wrapWithTamboMessageProvider(
  children: React.ReactNode,
  message: TamboThreadMessage,
) {
  return (
    <TamboMessageProvider message={message}>{children}</TamboMessageProvider>
  );
}

/**
 * Hook used inside a component wrapped with TamboMessageProvider, to get
 * the current message.
 * @returns The current message that is used to render the component
 */
export const useTamboCurrentMessage = () => {
  const context = useContext(TamboMessageContext);
  if (!context) {
    throw new Error(
      "useTamboMessageContext must be used within a TamboMessageProvider",
    );
  }
  return context;
};
