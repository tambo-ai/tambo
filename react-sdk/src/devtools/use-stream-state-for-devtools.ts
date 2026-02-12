"use client";

import { useContext } from "react";

import { StreamStateContext } from "../v1/providers/tambo-v1-stream-context";
import type { StreamState } from "../v1/utils/event-accumulator";

/**
 * Non-throwing hook that reads stream state for devtools.
 * Returns null when used outside of TamboStreamProvider instead of throwing.
 * @returns The current stream state, or null if not inside TamboStreamProvider
 */
export function useStreamStateForDevtools(): StreamState | null {
  return useContext(StreamStateContext);
}
