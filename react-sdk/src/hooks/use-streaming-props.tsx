"use client";

import { useEffect } from "react";

/**
 * Low-level helper that automatically updates Tambo component state when
 * specified props change.
 * @deprecated Legacy, low-level helper kept only for backward compatibility.
 * Do not use this hook in new components. Prefer the "stream → state → UI"
 * pattern that combines `useTamboComponentState` (with the `setFromProp`
 * parameter) and `useTamboStreamStatus`. That pattern keeps AI-generated
 * props, editable local state, and loading/disabled UI in sync without needing
 * this hook. See the docs page at
 * https://docs.tambo.co/concepts/streaming/building-streaming-components for a
 * full example, including migration guidance in the "Migration and starting
 * points" section. Existing usages should be migrated to that pattern when
 * feasible rather than expanded.
 *
 * This function exists only for legacy components that already rely on
 * `useTamboStreamingProps` or for very advanced integration points where you
 * cannot use `useTamboComponentState`. If you do reach for it, keep
 * `currentState` shallow and serializable and avoid deeply nested objects with
 * custom merge semantics, since this hook performs a shallow diff-and-merge on
 * each render.
 *
 * For best results, pass a stable, memoized `streamingProps` object rather
 * than recreating it inline on every render. This hook does a shallow
 * comparison of `streamingProps` against `currentState`, so frequently changing
 * object identities or deeply nested structures can trigger unnecessary
 * updates or make merge behavior difficult to reason about.
 * @param currentState - The current state object (usually from useTamboComponentState)
 * @param setState - The state setter function
 * @param streamingProps - An object mapping state keys to prop values that should update the state
 * @example
 * ```tsx
 * // Instead of writing a complex useEffect:
 * const [emailState, setEmailState] = useTamboComponentState("email", initialState);
 *
 * // Simply use:
 * useTamboStreamingProps(emailState, setEmailState, {
 *   subject: aiGeneratedSubject,
 *   body: aiGeneratedBody,
 *   usersEmail: usersEmail,
 * });
 * ```
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
