"use client";

import type { Suggestion } from "@tambo-ai/typescript-sdk/resources/beta/threads/suggestions";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTamboContextHelpers } from "./tambo-context-helpers-provider";

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
 * Represents the data structure returned by a context helper
 */
export type ContextHelperData = Record<string, unknown>;

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
 * @property {(context: ContextAttachment) => Promise<ContextHelperData> | ContextHelperData} [getContextHelperData] - Optional function to customize the data sent to the AI for each context. If not provided, uses a default structure with the context name and instruction.
 * @example
 * ```tsx
 * <TamboContextAttachmentProvider
 *   getContextHelperData={(context) => ({
 *     selectedFile: {
 *       name: context.name,
 *       path: context.metadata?.filePath,
 *       instruction: "Focus on this file"
 *     }
 *   })}
 * >
 *   {children}
 * </TamboContextAttachmentProvider>
 * ```
 */
export interface TamboContextAttachmentProviderProps {
  children?: React.ReactNode;
  getContextHelperData?: (
    context: ContextAttachment,
  ) => Promise<ContextHelperData> | ContextHelperData;
}

/**
 * Provider that enables context attachment features and custom suggestions in MessageInput.
 * **When to use:**
 * - **Included by default** in TamboProvider - no need to wrap separately
 * - Use `useTamboContextAttachment()` hook to manage context attachments
 * **What it does:**
 * - Manages context items that appear as badges above MessageInput
 * - Syncs context data with Tambo's AI for better responses
 * - Manages custom suggestions that replace auto-generated suggestions
 * - Allows components to add/remove contexts via `useTamboContextAttachment()`
 * - Allows components to set custom suggestions via `setCustomSuggestions()`
 * @param props - The props for the TamboContextAttachmentProvider
 * @param props.children - The children to wrap
 * @param props.getContextHelperData - The function to get the context helper data
 * @returns The TamboContextAttachmentProvider component
 * @example
 * Basic usage - already included in TamboProvider
 * ```tsx
 * <TamboProvider apiKey="...">
 *   <App />
 * </TamboProvider>
 * ```
 * @example
 * Using TamboProvider with custom context data
 * ```tsx
 * <TamboProvider
 *   apiKey="..."
 *   getContextHelperData={(context) => ({
 *     selectedComponent: {
 *       name: context.name,
 *       filePath: context.metadata?.path,
 *       instruction: "Edit this component"
 *     }
 *   })}
 * >
 *   <App />
 * </TamboProvider>
 * ```
 */
export function TamboContextAttachmentProvider({
  children,
  getContextHelperData,
}: TamboContextAttachmentProviderProps) {
  const [attachments, setAttachments] = useState<ContextAttachment[]>([]);
  const [customSuggestions, setCustomSuggestions] = useState<
    Suggestion[] | null
  >(null);
  const { addContextHelper, removeContextHelper } = useTamboContextHelpers();

  // Track which context helpers have been registered to avoid duplicates
  const registeredIdsRef = useRef<Set<string>>(new Set());
  const prevGetContextHelperDataRef = useRef<typeof getContextHelperData>();

  // Sync context helpers with attachments using useEffect
  useEffect(() => {
    const currentIds = new Set(attachments.map((a) => a.id));
    const registeredIds = registeredIdsRef.current;

    // Remove context helpers that are no longer in attachments
    registeredIds.forEach((id) => {
      if (!currentIds.has(id)) {
        removeContextHelper(id);
        registeredIds.delete(id);
      }
    });

    const getDataChanged =
      prevGetContextHelperDataRef.current !== getContextHelperData;

    // Add or replace context helpers for attachments
    attachments.forEach((context) => {
      if (getDataChanged || !registeredIds.has(context.id)) {
        addContextHelper(context.id, async (): Promise<ContextHelperData> => {
          if (getContextHelperData) {
            return await getContextHelperData(context);
          }
          return {
            selectedComponent: {
              name: context.name,
              instruction:
                "This is a Tambo interactable component that is currently selected and visible on the dashboard. You can read its current props and state, and update it by modifying its props. If multiple components are attached, you can interact with and modify any of them. Use the auto-registered interactable component tools (like get_interactable_component_by_id and update_interactable_component_<id>) to view and update the component's state.",
              ...(context.metadata ?? {}),
            },
          };
        });
        registeredIds.add(context.id);
      }
    });

    prevGetContextHelperDataRef.current = getContextHelperData;
  }, [
    attachments,
    addContextHelper,
    removeContextHelper,
    getContextHelperData,
  ]);

  // Cleanup: remove all context helpers on unmount
  useEffect(() => {
    const registeredIds = registeredIdsRef.current;
    return () => {
      registeredIds.forEach((id) => {
        removeContextHelper(id);
      });
      registeredIds.clear();
    };
  }, [removeContextHelper]);

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

  // This is used to remove a context when the user clicks the remove button
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
