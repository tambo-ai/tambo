"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useTamboContextHelpers } from "./tambo-context-helpers-provider";

/**
 * Represents a staged context piece that will be sent with the next user message.
 * These are automatically registered as context helpers and will be included in
 * the additionalContext when the next message is sent.
 * @property {string} id - Unique identifier for this staged context
 * @property {string} displayName - Display name for UI rendering
 * @property {string} context - The context key name that will be used in additionalContext
 * @property {string} [type] - Optional type identifier for grouping/rendering multiple contexts of the same type
 */
export interface StagedContext {
  id: string;
  displayName: string;
  context: string;
  type?: string;
}

/**
 * Context state interface for managing staged context pieces.
 * @property {StagedContext[]} stagedContexts - Array of active staged contexts
 * @property {(contextKey: string, contextValue: unknown, displayName: string, type?: string) => string} addStagedContext - Add a new staged context piece, returns the ID
 * @property {(id: string) => void} removeStagedContext - Remove a staged context piece by ID
 * @property {() => void} clearStagedContexts - Remove all staged context pieces
 */
export interface ContextAttachmentState {
  stagedContexts: StagedContext[];
  addStagedContext: (
    contextValue: string,
    displayName: string,
    type?: string,
  ) => StagedContext;
  removeStagedContext: (id: string) => void;
  clearStagedContexts: () => void;
}

const ContextAttachmentContext = createContext<ContextAttachmentState | null>(
  null,
);

export interface TamboContextAttachmentProviderProps {
  children?: React.ReactNode;
}

/**
 * Provider that manages staged context pieces for the next user message.
 * **When to use:**
 * - **Included by default** in TamboProvider - no need to wrap separately
 * - Use `useTamboContextAttachment()` hook to stage context pieces
 * **What it does:**
 * - Stores staged context pieces that will be sent with the next message
 * - Automatically registers/deregisters context helpers for each staged context
 * - Context helpers are automatically collected during message submission
 * - Staged contexts are cleared after message submission (one-time use)
 *
 * **Note:** Staged contexts are automatically included in additionalContext when
 * the next message is sent. They are cleared after submission.
 * @param props - The props for the TamboContextAttachmentProvider
 * @param props.children - The children to wrap
 * @returns The TamboContextAttachmentProvider component
 */
export function TamboContextAttachmentProvider({
  children,
}: TamboContextAttachmentProviderProps) {
  const { addContextHelper, removeContextHelper } = useTamboContextHelpers();
  const [stagedContexts, setStagedContexts] = useState<StagedContext[]>([]);

  const addStagedContext = useCallback(
    (
      contextValue: string,
      displayName: string,
      type?: string,
    ): StagedContext => {
      const id = crypto.randomUUID();
      const stagedContext: StagedContext = {
        id,
        displayName,
        context: contextValue,
        type,
      };
      setStagedContexts((prev) => [...prev, stagedContext]);
      addContextHelper(id, () => contextValue);

      return stagedContext;
    },
    [addContextHelper],
  );

  const removeStagedContext = useCallback(
    (id: string) => {
      setStagedContexts((prev) => prev.filter((c) => c.id !== id));
      removeContextHelper(id);
    },
    [removeContextHelper],
  );

  const clearStagedContexts = useCallback(() => {
    // Remove all registered helpers before clearing
    for (const stagedContext of stagedContexts) {
      removeContextHelper(stagedContext.id);
    }
    setStagedContexts([]);
  }, [stagedContexts, removeContextHelper]);

  const value = useMemo(
    () => ({
      stagedContexts,
      addStagedContext,
      removeStagedContext,
      clearStagedContexts,
    }),
    [
      stagedContexts,
      addStagedContext,
      removeStagedContext,
      clearStagedContexts,
    ],
  );

  return (
    <ContextAttachmentContext.Provider value={value}>
      {children}
    </ContextAttachmentContext.Provider>
  );
}

/**
 * Hook to access staged context state and methods.
 * **Must be used within a `TamboProvider`** - throws an error otherwise.
 * @throws {Error} If used outside of TamboProvider
 * @returns The staged context state and methods
 * @example
 * ```tsx
 * const { addStagedContext, stagedContexts, clearStagedContexts } = useTamboContextAttachment();
 *
 * // Stage a context piece for the next message
 * const stagedContext = addStagedContext(
 *   "selectedFile",
 *   "Button.tsx",
 *   "file"
 * );
 *
 * // Remove a staged context
 * removeStagedContext(stagedContext.id);
 *
 * // Clear all staged contexts
 * clearStagedContexts();
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
