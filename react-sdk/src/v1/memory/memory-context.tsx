"use client";

/**
 * TamboMemoryProvider
 *
 * Provides memory storage to the component tree and registers a context helper
 * so the AI can access stored memories during conversations.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTamboContextHelpers } from "../../providers/tambo-context-helpers-provider";
import { InMemoryProvider } from "./in-memory-provider";
import type { MemoryEntry, MemoryProvider } from "./types";

export interface MemoryContextValue {
  /** Store or update a memory entry */
  setMemory: (key: string, value: unknown, tags?: string[]) => Promise<void>;
  /** Retrieve a memory entry by key */
  getMemory: (key: string) => Promise<MemoryEntry | null>;
  /** Remove a memory entry */
  deleteMemory: (key: string) => Promise<void>;
  /** List all memory entries, optionally filtered by tags */
  getAllMemories: (tags?: string[]) => Promise<MemoryEntry[]>;
  /** Clear all memory entries */
  clearMemories: () => Promise<void>;
  /** The underlying memory provider instance */
  provider: MemoryProvider;
}

const MemoryContext = createContext<MemoryContextValue | null>(null);

export interface TamboMemoryProviderProps {
  /**
   * Custom memory provider implementation.
   * Defaults to InMemoryProvider (non-persistent, lost on page refresh).
   */
  memoryProvider?: MemoryProvider;
  children: React.ReactNode;
}

/**
 * Provides memory storage to the component tree.
 * Wrap your app (inside TamboProvider) to enable the useMemory hook.
 *
 * ```tsx
 * <TamboProvider apiKey={...}>
 *   <TamboMemoryProvider>
 *     <App />
 *   </TamboMemoryProvider>
 * </TamboProvider>
 * ```
 */
export function TamboMemoryProvider({
  memoryProvider,
  children,
}: TamboMemoryProviderProps) {
  const provider = useMemo(
    () => memoryProvider ?? new InMemoryProvider(),
    [memoryProvider],
  );

  const { addContextHelper, removeContextHelper } = useTamboContextHelpers();
  const [memoryVersion, setMemoryVersion] = useState(0);

  // Register context helper so the AI can read stored memories
  useEffect(() => {
    const helper = async () => {
      const memories = await provider.list();
      if (memories.length === 0) return "No stored memories.";
      return memories
        .map((m) => `[${m.key}]: ${JSON.stringify(m.value)}`)
        .join("\n");
    };
    addContextHelper("memory", helper);
    return () => removeContextHelper("memory");
  }, [provider, addContextHelper, removeContextHelper, memoryVersion]);

  const setMemory = useCallback(
    async (key: string, value: unknown, tags?: string[]) => {
      await provider.set(key, value, tags);
      setMemoryVersion((v) => v + 1);
    },
    [provider],
  );

  const getMemory = useCallback(
    (key: string) => provider.get(key),
    [provider],
  );

  const deleteMemory = useCallback(
    async (key: string) => {
      await provider.delete(key);
      setMemoryVersion((v) => v + 1);
    },
    [provider],
  );

  const getAllMemories = useCallback(
    (tags?: string[]) => provider.list(tags),
    [provider],
  );

  const clearMemories = useCallback(async () => {
    await provider.clear();
    setMemoryVersion((v) => v + 1);
  }, [provider]);

  const value: MemoryContextValue = useMemo(
    () => ({
      setMemory,
      getMemory,
      deleteMemory,
      getAllMemories,
      clearMemories,
      provider,
    }),
    [setMemory, getMemory, deleteMemory, getAllMemories, clearMemories, provider],
  );

  return (
    <MemoryContext.Provider value={value}>{children}</MemoryContext.Provider>
  );
}

/**
 * Hook to access the memory storage system.
 * Must be used within a TamboMemoryProvider.
 *
 * ```tsx
 * const { setMemory, getMemory, getAllMemories } = useMemory();
 * await setMemory('user-pref', { theme: 'dark' }, ['preferences']);
 * const pref = await getMemory('user-pref');
 * ```
 */
export function useMemory(): MemoryContextValue {
  const context = useContext(MemoryContext);
  if (!context) {
    throw new Error(
      "useMemory must be used within a <TamboMemoryProvider>. " +
        "Wrap your component tree with <TamboMemoryProvider> inside <TamboProvider>.",
    );
  }
  return context;
}
