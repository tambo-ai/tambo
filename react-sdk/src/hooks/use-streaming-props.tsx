"use client";

import { useEffect } from "react";

/**
 * Low-level helper that merges streamed props into state.
 * @deprecated Use `useTamboComponentState` with `setFromProp` instead.
 * This hook will be removed in 1.0.0.
 * @see {@link https://docs.tambo.co/concepts/streaming/streaming-props}
 * @param currentState - Current state object
 * @param setState - State setter function
 * @param streamingProps - Props to merge into state when they change
 */
export function useTamboStreamingProps<T extends Record<string, any>>(
  currentState: T | undefined,
  setState: (state: T) => void,
  streamingProps: Partial<T>,
) {
  useEffect(() => {
    if (currentState) {
      let shouldUpdate = false;
      const updates: Partial<T> = {};

      Object.entries(streamingProps).forEach(([key, value]) => {
        if (value !== undefined && value !== currentState[key]) {
          shouldUpdate = true;
          updates[key as keyof T] = value as T[keyof T];
        }
      });

      if (shouldUpdate) {
        setState({
          ...currentState,
          ...updates,
        });
      }
    }
    // Only run when streamingProps change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...Object.values(streamingProps)]);
}
