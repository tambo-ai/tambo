import { getContext } from "svelte";
import { TAMBO_STATUS_KEY } from "../context.js";
import type { StreamStatusStore } from "../stores/stream-status.svelte.js";
import type { StreamStatus, PropStatus } from "../types.js";

/**
 * Get the stream status store from context.
 *
 * Provides access to streaming state for monitoring AI response progress.
 *
 * Must be called within a component that is a descendant of TamboProvider.
 * @returns The stream status store
 * @throws Error if called outside of TamboProvider
 */
export function useTamboStreamStatus(): StreamStatusStore {
  const statusStore = getContext<StreamStatusStore | undefined>(
    TAMBO_STATUS_KEY,
  );

  if (!statusStore) {
    throw new Error("useTamboStreamStatus must be used within a TamboProvider");
  }

  return statusStore;
}

export type { StreamStatus, PropStatus };
