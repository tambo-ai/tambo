"use client";

import type { Suggestion } from "@tambo-ai/typescript-sdk/resources/beta/threads/suggestions";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

/**
 * Represents a context attachment that can be displayed in MessageInputContexts.
 * Context attachments appear as badges above the message input and provide additional
 * information to the AI about what to focus on.
 * @property {string} name - Display name shown in the badge
 * @property {React.ReactNode} [icon] - Optional icon to display in the badge
 * @property {Record<string, unknown>} [metadata] - Additional data passed to the AI
 * @example
 * ```tsx
 * const context: ContextAttachment = {
 *   name: "Button.tsx",
 *   icon: <FileIcon />,
 *   metadata: { filePath: "/src/components/Button.tsx" }
 * };
 * ```
 */
export interface ContextAttachment {
  id: string;
  name: string;
  icon?: React.ReactNode;
  metadata?: Record<string, unknown>;
}

/**
 * Context state interface for managing context attachments and custom suggestions.
 * @property {ContextAttachment[]} attachments - Array of active context attachments (badges above message input)
 * @property {(context: Omit<ContextAttachment, "id">) => void} addContextAttachment - Add a new context attachment
 * @property {(id: string) => void} removeContextAttachment - Remove a context attachment by ID
 * @property {() => void} clearContextAttachments - Remove all context attachments - This is used to clear the context when the user submits a message
 * @property {Suggestion[] | null} customSuggestions - Custom suggestions to display instead of auto-generated ones
 * @property {(suggestions: Suggestion[] | null) => void} setCustomSuggestions - Set or clear custom suggestions
 */
export interface ContextAttachmentState {
  attachments: ContextAttachment[];
  addContextAttachment: (context: Omit<ContextAttachment, "id">) => void;
  removeContextAttachment: (id: string) => void;
  clearContextAttachments: () => void;
  customSuggestions: Suggestion[] | null;
  setCustomSuggestions: (suggestions: Suggestion[] | null) => void;
}

const ContextAttachmentContext = createContext<ContextAttachmentState | null>(
  null,
);

/**
 * Props for the TamboContextAttachmentProvider.
 */
export interface TamboContextAttachmentProviderProps {
  children?: React.ReactNode;
}

/**
 * Provider that enables context attachment features and custom suggestions in MessageInput.
 * **When to use:**
 * - **Included by default** in TamboProvider - no need to wrap separately
 * - Use `useTamboContextAttachment()` hook to manage context attachments
 * **What it does:**
 * - Manages context items that appear as badges above MessageInput
 * - Manages custom suggestions that replace auto-generated suggestions
 * - Allows components to add/remove contexts via `useTamboContextAttachment()`
 * - Allows components to set custom suggestions via `setCustomSuggestions()`
 * @param props - The props for the TamboContextAttachmentProvider
 * @param props.children - The children to wrap
 * @returns The TamboContextAttachmentProvider component
 * @example
 * Basic usage - already included in TamboProvider
 * ```tsx
 * <TamboProvider apiKey="...">
 *   <App />
 * </TamboProvider>
 * ```
 */
export function TamboContextAttachmentProvider({
  children,
}: TamboContextAttachmentProviderProps) {
  const [attachments, setAttachments] = useState<ContextAttachment[]>([]);
  const [customSuggestions, setCustomSuggestions] = useState<
    Suggestion[] | null
  >(null);

  const addContextAttachment = useCallback(
    (context: Omit<ContextAttachment, "id">) => {
      setAttachments((prev) => {
        if (prev.some((c) => c.name === context.name)) return prev;

        if (typeof crypto === "undefined" || !("randomUUID" in crypto)) {
          throw new Error(
            "crypto.randomUUID() is not available. This usually happens when using an IP address instead of 'localhost' in development. Use 'localhost' or a secure context (HTTPS) to enable crypto APIs.",
          );
        }

        const newId = crypto.randomUUID();
        const newContext = { ...context, id: newId };
        return [...prev, newContext];
      });
    },
    [],
  );

  const removeContextAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // This is used to clear the context when the user submits a message
  const clearContextAttachments = useCallback(() => {
    setAttachments([]);
  }, []);

  const value = useMemo(
    () => ({
      attachments,
      addContextAttachment,
      removeContextAttachment,
      clearContextAttachments,
      customSuggestions,
      setCustomSuggestions,
    }),
    [
      attachments,
      addContextAttachment,
      removeContextAttachment,
      clearContextAttachments,
      customSuggestions,
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
 * const contextAttachment = useTamboContextAttachment();
 *
 * // Add a context
 * contextAttachment.addContextAttachment({
 *   name: "Button.tsx",
 *   icon: <FileIcon />,
 *   metadata: { path: "/src/Button.tsx" }
 * });
 *
 * // Remove a context
 * contextAttachment.removeContextAttachment(contextId);
 *
 * // Set custom suggestions
 * contextAttachment.setCustomSuggestions([{ id: "1", title: "Add Feature" }]);
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
