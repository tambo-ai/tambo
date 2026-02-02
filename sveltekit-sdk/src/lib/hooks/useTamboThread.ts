import { getContext } from "svelte";
import { TAMBO_THREAD_KEY } from "../context.js";
import type { ThreadStore } from "../stores/thread.svelte.js";

/**
 * Get the thread store from context.
 *
 * Provides access to the current thread, messages, and methods for
 * sending messages, switching threads, and managing thread state.
 *
 * Must be called within a component that is a descendant of TamboProvider.
 * @returns The thread store
 * @throws Error if called outside of TamboProvider
 */
export function useTamboThread(): ThreadStore {
  const threadStore = getContext<ThreadStore | undefined>(TAMBO_THREAD_KEY);

  if (!threadStore) {
    throw new Error("useTamboThread must be used within a TamboProvider");
  }

  return threadStore;
}
