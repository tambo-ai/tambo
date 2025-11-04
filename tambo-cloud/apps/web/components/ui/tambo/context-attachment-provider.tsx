"use client";

import { useTamboContextHelpers, type Suggestion } from "@tambo-ai/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * Represents a context attachment that can be displayed in MessageInputContexts.
 * Context attachments appear as badges above the message input and provide additional
 * information to the AI about what to focus on.
 *
 * @property {string} name - Display name shown in the badge
 * @property {ReactNode} [icon] - Optional icon to display in the badge
 * @property {Record<string, unknown>} [metadata] - Additional data passed to the AI
 *
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
  icon?: ReactNode;
  metadata?: Record<string, unknown>;
}

/**
 * Represents the data structure returned by a context helper
 */
export interface ContextHelperData {
  selectedComponent: {
    name: string;
    instruction?: string;
    [key: string]: unknown;
  };
}

/**
 * Context state interface for managing context attachments and custom suggestions.
 *
 * @property {ContextAttachment[]} attachments - Array of active context attachments (badges above message input)
 * @property {function} addContextAttachment - Add a new context attachment
 * @property {function} removeContextAttachment - Remove a context attachment by ID
 * @property {function} clearContextAttachments - Remove all context attachments - This is used to clear the context when the user submits a message
 * @property {Suggestion[] | null} customSuggestions - Custom suggestions to display instead of auto-generated ones
 * @property {function} setCustomSuggestions - Set or clear custom suggestions
 */
interface ContextAttachmentState {
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
 * Props for the ContextAttachmentProvider.
 */
export interface ContextAttachmentProviderProps {
  children: ReactNode;
  /**
   * Optional function to customize the data sent to the AI for each context.
   * If not provided, uses a default structure with the context name and instruction.
   *
   * @param context - The context attachment to generate data for
   * @returns Object containing data to send to the AI (can be async)
   *
   * @example
   * ```tsx
   * <ContextAttachmentProvider
   *   getContextHelperData={(context) => ({
   *     selectedFile: {
   *       name: context.name,
   *       path: context.metadata?.filePath,
   *       instruction: "Focus on this file"
   *     }
   *   })}
   * >
   *   {children}
   * </ContextAttachmentProvider>
   * ```
   */
  getContextHelperData?: (
    context: ContextAttachment,
  ) => Promise<ContextHelperData> | ContextHelperData;
}

/**
 * Provider that enables context attachment features and custom suggestions in MessageInput.
 *
 * **When to use:**
 * - **Required** - Must wrap any component that uses `useContextAttachment()`
 * - Wrap your app or specific routes where you need context features
 *
 * **What it does:**
 * - Manages context items that appear as badges above MessageInput
 * - Syncs context data with Tambo's AI for better responses
 * - Manages custom suggestions that replace auto-generated suggestions
 * - Allows components to add/remove contexts via `useContextAttachment()`
 * - Allows components to set custom suggestions via `setCustomSuggestions()`
 *
 * @example
 * Basic usage - wrap your app
 * ```tsx
 * <TamboProvider apiKey="...">
 *   <ContextAttachmentProvider>
 *     <App />
 *   </ContextAttachmentProvider>
 * </TamboProvider>
 * ```
 *
 * @example
 * With custom context data
 * ```tsx
 * <ContextAttachmentProvider
 *   getContextHelperData={(context) => ({
 *     selectedComponent: {
 *       name: context.name,
 *       filePath: context.metadata?.path,
 *       instruction: "Edit this component"
 *     }
 *   })}
 * >
 *   <App />
 * </ContextAttachmentProvider>
 * ```
 */
export function ContextAttachmentProvider({
  children,
  getContextHelperData,
}: ContextAttachmentProviderProps) {
  const [attachments, setAttachments] = useState<ContextAttachment[]>([]);
  const [customSuggestions, setCustomSuggestions] = useState<
    Suggestion[] | null
  >(null);
  const { addContextHelper, removeContextHelper } = useTamboContextHelpers();

  // Track latest attachments for cleanup without triggering effect re-runs
  const attachmentsRef = useRef<ContextAttachment[]>([]);
  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  // Cleanup: remove all context helpers on unmount only
  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach((context) => {
        removeContextHelper(context.id);
      });
    };
  }, [removeContextHelper]);

  const addContextAttachment = useCallback(
    (context: Omit<ContextAttachment, "id">) => {
      // Check if context already exists
      if (attachments.some((c) => c.name === context.name)) return;

      const newId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `ctx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const newContext = { ...context, id: newId };

      // Add context helper first (side effect)
      addContextHelper(newId, async (): Promise<ContextHelperData> => {
        if (getContextHelperData) {
          return await getContextHelperData(newContext);
        }
        return {
          selectedComponent: {
            name: newContext.name,
            instruction:
              "This is a Tambo interactable component that is currently selected and visible on the dashboard. You can read its current props and state, and update it by modifying its props. If multiple components are attached, you can interact with and modify any of them. Use the auto-registered interactable component tools (like get_interactable_component_by_id and update_interactable_component_<id>) to view and update the component's state.",
            ...(newContext.metadata || {}),
          },
        };
      });

      // Then update state
      setAttachments((prev) => [...prev, newContext]);
    },
    [attachments, addContextHelper, getContextHelperData],
  );

  // This is used to remove a context when the user clicks the remove button
  const removeContextAttachment = useCallback(
    (id: string) => {
      removeContextHelper(id);
      setAttachments((prev) => prev.filter((c) => c.id !== id));
    },
    [removeContextHelper],
  );

  // This is used to clear the context when the user submits a message
  const clearContextAttachments = useCallback(() => {
    // Remove all context helpers before clearing
    attachments.forEach((context) => {
      removeContextHelper(context.id);
    });
    setAttachments([]);
  }, [attachments, removeContextHelper]);

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
 *
 * **Must be used within a `ContextAttachmentProvider`** - throws an error otherwise.
 *
 * @throws {Error} If used outside of ContextAttachmentProvider
 *
 * @example
 * ```tsx
 * const contextAttachment = useContextAttachment();
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
export function useContextAttachment() {
  const context = useContext(ContextAttachmentContext);
  if (!context) {
    throw new Error(
      "useContextAttachment must be used within a ContextAttachmentProvider",
    );
  }
  return context;
}
