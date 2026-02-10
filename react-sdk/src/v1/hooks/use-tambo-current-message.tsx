"use client";
import React, { createContext, useContext } from "react";
import type { InteractableConfig } from "../../hoc/with-tambo-interactable";
import type {
  TamboThreadMessage,
  TamboComponentContent,
} from "../types/message";

/**
 * Metadata for interactable components.
 * Used when a component is wrapped with withTamboInteractable.
 */
export interface InteractableMetadata extends InteractableConfig {
  /** Unique identifier for this interactable instance */
  id: string;
}

/**
 * Message with optional interactable metadata merged in by the provider.
 * Used as the context type so consumers can access both the message and
 * any interactable information attached by withTamboInteractable.
 */
type MessageWithMetadata = TamboThreadMessage & {
  interactableMetadata?: InteractableMetadata;
};

export const TamboMessageContext = createContext<MessageWithMetadata | null>(
  null,
);

export interface TamboMessageProviderProps {
  children: React.ReactNode;
  message: TamboThreadMessage;
  /** Optional interactable metadata for components wrapped with withInteractable */
  interactableMetadata?: InteractableMetadata;
}

/**
 * Wraps all components so that they can find what message they are in.
 * Also supports optional interactable metadata for components wrapped with withInteractable.
 * @param props - Props for the TamboMessageProvider
 * @param props.children - The children to wrap
 * @param props.message - The message object
 * @param props.interactableMetadata - Optional interactable component metadata
 * @returns The wrapped component
 */
export const TamboMessageProvider: React.FC<TamboMessageProviderProps> = ({
  children,
  message,
  interactableMetadata,
}) => {
  // Merge interactable metadata into message if provided
  const enhancedMessage: MessageWithMetadata = interactableMetadata
    ? { ...message, interactableMetadata }
    : message;

  // Use a unique key={...} to force a re-render when the message changes - this
  // makes sure that if the rendered component is swapped into a tree (like if
  // you always show the last rendered component) then the state/etc is correct
  return (
    <TamboMessageContext.Provider value={enhancedMessage} key={message.id}>
      {children}
    </TamboMessageContext.Provider>
  );
};

/**
 * Wraps a component with a TamboMessageProvider - this allows the provider
 * to be used outside of a TSX file.
 * @param children - The children to wrap
 * @param message - The message object
 * @param interactableMetadata - Optional interactable metadata
 * @returns The wrapped component
 */
export function wrapWithTamboMessageProvider(
  children: React.ReactNode,
  message: TamboThreadMessage,
  interactableMetadata?: InteractableMetadata,
) {
  return (
    <TamboMessageProvider
      message={message}
      interactableMetadata={interactableMetadata}
    >
      {children}
    </TamboMessageProvider>
  );
}

/**
 * Hook used inside a component wrapped with TamboMessageProvider, to get
 * the current message.
 * @returns The current message that is used to render the component
 */
export const useTamboCurrentMessage = () => {
  const message = useContext(TamboMessageContext);
  if (!message) {
    throw new Error(
      "useTamboCurrentMessage must be used within a TamboMessageProvider",
    );
  }
  return message;
};

/**
 * Component info extracted from the current message and interactable context.
 * Provides a unified interface for accessing component metadata.
 */
export interface TamboCurrentComponent {
  /** Component name from the message */
  componentName?: string;
  /** Component props from the message */
  props?: Record<string, unknown>;
  /** Interactable ID (only present for components wrapped with withInteractable) */
  interactableId?: string;
  /** Description (only present for components wrapped with withInteractable) */
  description?: string;
  /** Thread ID (not available on messages directly) */
  threadId?: string;
}

/**
 * Hook to access the current component information from the message context.
 * Provides a unified interface for both AI-generated and interactable components.
 *
 * Component info is derived from content blocks rather than
 * top-level message fields.
 *
 * **Use this hook when you need component metadata regardless of the context.**
 * @returns Component info including name, props, and interactable metadata if available, or null if used outside TamboMessageProvider
 * @example
 * ```tsx
 * function MyInlineEditor() {
 *   const component = useTamboCurrentComponent();
 *
 *   if (!component) return null; // Not inside a component
 *
 *   return (
 *     <div>
 *       Editing: {component.componentName}
 *       {component.interactableId && <span>ID: {component.interactableId}</span>}
 *     </div>
 *   );
 * }
 * ```
 */
export const useTamboCurrentComponent = (): TamboCurrentComponent | null => {
  const message = useContext(TamboMessageContext);

  if (!message) {
    return null;
  }

  // Find first component content block
  const componentContent = message.content.find(
    (c): c is TamboComponentContent => c.type === "component",
  );

  return {
    componentName:
      message.interactableMetadata?.componentName ??
      componentContent?.name ??
      undefined,
    props: componentContent?.props as Record<string, unknown> | undefined,
    interactableId: message.interactableMetadata?.id ?? undefined,
    description: message.interactableMetadata?.description ?? undefined,
    threadId: undefined, // Messages don't carry threadId
  };
};
