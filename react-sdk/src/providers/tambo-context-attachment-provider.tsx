"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTamboContextHelpers } from "./tambo-context-helpers-provider";

/**
 * Represents a context attachment that will be sent with the next user message.
 * These are automatically registered as context helpers and will be included in
 * the additionalContext when the next message is sent.
 * @property {string} id - Unique identifier for this context attachment
 * @property {string} [displayName] - Optional display name for UI rendering
 * @property {string} context - The context value that will be used in additionalContext
 * @property {string} [type] - Optional type identifier for grouping/rendering multiple contexts of the same type
 */
export interface ContextAttachment {
  id: string;
  displayName?: string;
  context: string;
  type?: string;
}

/**
 * Context state interface for managing context attachments.
 * @property {ContextAttachment[]} attachments - Array of active context attachments
 * @property {(contextAttachment: Omit<ContextAttachment, "id">) => ContextAttachment} addContextAttachment - Add a new context attachment, returns the attachment
 * @property {(id: string) => void} removeContextAttachment - Remove a context attachment by ID
 * @property {() => void} clearContextAttachments - Remove all context attachments
 */
export interface ContextAttachmentState {
  attachments: ContextAttachment[];
  addContextAttachment: (
    contextAttachment: Omit<ContextAttachment, "id">,
  ) => ContextAttachment;
  removeContextAttachment: (id: string) => void;
  clearContextAttachments: () => void;
}

const ContextAttachmentContext = createContext<ContextAttachmentState | null>(
  null,
);

export interface TamboContextAttachmentProviderProps {
  children?: React.ReactNode;
}

const CONTEXT_ATTACHMENTS_HELPER_KEY = "contextAttachments";

/**
 * Provider that manages context attachments for the next user message.
 * - **Included by default** in TamboProvider - no need to wrap separately
 * - Use `useTamboContextAttachment()` hook to manage context attachments
 * **What it does:**
 * - Stores context attachments that will be sent with the next message
 * - Automatically registers/deregisters context helpers for each attachment
 * - Context helpers are automatically collected during message submission
 * - Context attachments are cleared after message submission (one-time use)
 *
 * **Note:** Context attachments are automatically included in additionalContext when
 * the next message is sent. They are cleared after submission.
 * @param props - The props for the TamboContextAttachmentProvider
 * @param props.children - The children to wrap
 * @returns The TamboContextAttachmentProvider component
 */
export function TamboContextAttachmentProvider({
  children,
}: TamboContextAttachmentProviderProps) {
  const { addContextHelper, removeContextHelper } = useTamboContextHelpers();
  const [attachments, setAttachments] = useState<ContextAttachment[]>([]);

  useEffect(() => {
    addContextHelper(CONTEXT_ATTACHMENTS_HELPER_KEY, () => {
      if (attachments.length === 0) {
        return null;
      }

      return attachments.map((attachment) => ({
        id: attachment.id,
        displayName: attachment.displayName,
        context: attachment.context,
        type: attachment.type,
      }));
    });

    return () => {
      removeContextHelper(CONTEXT_ATTACHMENTS_HELPER_KEY);
    };
  }, [attachments, addContextHelper, removeContextHelper]);

  /**
   * Adds a new context attachment that will be included with the next user message.
   * The attachment is automatically registered as part of the merged context helper.
   * @param contextAttachment - The context attachment input (context, optional displayName, optional type)
   * @returns The created ContextAttachment object with a unique ID
   * @example
   * ```tsx
   * const attachment = addContextAttachment({
   *   context: "The contents of File.txt",
   *   displayName: "File.txt",
   *   type: "file"
   * });
   * ```
   */
  const addContextAttachment = useCallback(
    (contextAttachment: Omit<ContextAttachment, "id">): ContextAttachment => {
      const id = crypto.randomUUID();
      const attachment: ContextAttachment = {
        id,
        displayName: contextAttachment.displayName,
        context: contextAttachment.context,
        type: contextAttachment.type,
      };
      setAttachments((prev) => [...prev, attachment]);

      return attachment;
    },
    [],
  );

  /**
   * Removes a context attachment by its ID.
   */
  const removeContextAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((c) => c.id !== id));
  }, []);

  /**
   * Removes all context attachments at once.
   */
  const clearContextAttachments = useCallback(() => {
    setAttachments([]);
  }, []);

  const value = useMemo(
    () => ({
      attachments,
      addContextAttachment,
      removeContextAttachment,
      clearContextAttachments,
    }),
    [
      attachments,
      addContextAttachment,
      removeContextAttachment,
      clearContextAttachments,
    ],
  );

  return (
    <ContextAttachmentContext.Provider value={value}>
      {children}
    </ContextAttachmentContext.Provider>
  );
}

/**
 * Hook to access context attachment state and methods.
 * **Must be used within a `TamboProvider`** - throws an error otherwise.
 * @throws {Error} If used outside of TamboProvider
 * @returns The context attachment state and methods
 * @example
 * ```tsx
 * const { addContextAttachment, attachments, clearContextAttachments } = useTamboContextAttachment();
 *
 * // Add a context attachment for the next message
 * const attachment = addContextAttachment({
 *   context: "The contents of File.txt",
 *   displayName: "File.txt", // optional
 *   type: "file" // optional
 * });
 *
 * // Remove a context attachment
 * removeContextAttachment(attachment.id);
 *
 * // Clear all context attachments
 * clearContextAttachments();
 * ```
 */
export function useTamboContextAttachment() {
  const context = useContext(ContextAttachmentContext);
  if (!context) {
    throw new Error(
      "useTamboContextAttachment must be used within a TamboContextAttachmentProvider",
    );
  }
  return context;
}
