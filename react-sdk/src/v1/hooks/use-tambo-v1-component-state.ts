"use client";

/**
 * useTamboV1ComponentState - Component State Hook for v1 API
 *
 * Provides bidirectional state synchronization between React components
 * and the Tambo backend. State changes are debounced before syncing to
 * the server, and server state updates are reflected in the component.
 *
 * Must be used within a component rendered via the component renderer.
 */

import { useCallback, useEffect, useState, useRef } from "react";
import { useDebouncedCallback } from "use-debounce";
import { deepEqual } from "fast-equals";
import { useTamboClient } from "../../providers/tambo-client-provider";
import { useTamboInteractable } from "../../providers/tambo-interactable-provider";
import { useV1ComponentContent } from "../utils/component-renderer";
import { useStreamState } from "../providers/tambo-v1-stream-context";
import { findComponentContent } from "../utils/thread-utils";

/**
 * Return type for useTamboV1ComponentState hook.
 * Similar to useState but with additional metadata.
 */
export type UseTamboV1ComponentStateReturn<S> = [
  currentState: S,
  setState: (newState: S | ((prev: S) => S)) => void,
  meta: {
    isPending: boolean;
    error: Error | null;
    flush: () => void;
  },
];

/**
 * Hook for managing component state with bidirectional server sync.
 *
 * This hook acts like useState but automatically syncs state changes
 * to the Tambo backend. Server-side state updates are also reflected
 * in the component.
 *
 * Must be used within a component rendered via the component renderer.
 * @param keyName - The unique key to identify this state value within the component's state
 * @param initialValue - Initial value for the state (used if no server state exists)
 * @param debounceTime - Debounce time in milliseconds (default: 500ms)
 * @returns Tuple of [currentState, setState, meta]
 * @example
 * ```tsx
 * function Counter() {
 *   const [count, setCount, { isPending }] = useTamboV1ComponentState('count', 0);
 *
 *   return (
 *     <div>
 *       <span>{count}</span>
 *       <button onClick={() => setCount(c => c + 1)} disabled={isPending}>
 *         Increment
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTamboV1ComponentState<S = undefined>(
  keyName: string,
  initialValue?: S,
  debounceTime?: number,
): UseTamboV1ComponentStateReturn<S | undefined>;
export function useTamboV1ComponentState<S>(
  keyName: string,
  initialValue: S,
  debounceTime?: number,
): UseTamboV1ComponentStateReturn<S>;
export function useTamboV1ComponentState<S>(
  keyName: string,
  initialValue?: S,
  debounceTime = 500,
): UseTamboV1ComponentStateReturn<S> {
  const client = useTamboClient();
  const { componentId, threadId } = useV1ComponentContent();
  const streamState = useStreamState();
  const { setInteractableState, getInteractableComponentState } =
    useTamboInteractable();

  // Interactable components use threadId="" (set by withTamboInteractable)
  const isInteractable = threadId === "";

  // Find the component content to get server state (only for v1-rendered components)
  const componentContent = isInteractable
    ? undefined
    : findComponentContent(streamState, threadId, componentId);
  const serverState = componentContent?.state as
    | Record<string, unknown>
    | undefined;
  const serverValue = serverState?.[keyName] as S | undefined;

  // For interactable components, read state from the interactable provider
  const interactableState = isInteractable
    ? (getInteractableComponentState(componentId)?.[keyName] as S | undefined)
    : undefined;

  // Local state - initialized from interactable state, server state, or initial value
  const [localState, setLocalState] = useState<S>(
    () => interactableState ?? serverValue ?? (initialValue as S),
  );

  // Track pending state and errors
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Track the last value we sent to avoid overwriting with stale server state
  const lastSentValueRef = useRef<S | undefined>(undefined);

  // Track whether there's a pending local change that hasn't synced yet
  const hasPendingLocalChangeRef = useRef(false);

  // Track in-flight sync requests to avoid stale completions clearing pending state
  const syncSeqRef = useRef(0);

  // Debounced function to sync state to server (only used for v1-rendered components)
  const syncToServer = useDebouncedCallback(async (newState: S) => {
    if (isInteractable) return;

    const seq = ++syncSeqRef.current;
    setIsPending(true);
    setError(null);
    lastSentValueRef.current = newState;

    try {
      await client.threads.state.updateState(componentId, {
        threadId,
        state: { [keyName]: newState },
      });
      // Clear pending flag after successful sync
      hasPendingLocalChangeRef.current = false;
    } catch (err) {
      // Clear pending flag on error to allow server reconciliation
      hasPendingLocalChangeRef.current = false;
      const syncError = err instanceof Error ? err : new Error(String(err));
      setError(syncError);
      console.error(
        `[useTamboV1ComponentState] Failed to sync state for ${componentId}:`,
        syncError,
      );
    } finally {
      // Only clear isPending if this is the most recent request
      if (seq === syncSeqRef.current) {
        setIsPending(false);
      }
    }
  }, debounceTime);

  // setState function that updates local state and syncs appropriately
  const setState = useCallback(
    (newState: S | ((prev: S) => S)) => {
      setLocalState((prev) => {
        const nextState =
          typeof newState === "function"
            ? (newState as (prev: S) => S)(prev)
            : newState;

        if (isInteractable) {
          // For interactable components, update the interactable provider's state
          setInteractableState(componentId, keyName, nextState);
        } else {
          // For v1-rendered components, trigger debounced sync to server
          hasPendingLocalChangeRef.current = true;
          void syncToServer(nextState);
        }

        return nextState;
      });
    },
    [isInteractable, syncToServer, setInteractableState, componentId, keyName],
  );

  // Set initial value in interactable state on mount if no existing state
  const existingInteractableState = isInteractable
    ? getInteractableComponentState(componentId)?.[keyName]
    : undefined;
  const shouldUpdateInteractableInitial =
    isInteractable &&
    existingInteractableState === undefined &&
    initialValue !== undefined;

  useEffect(() => {
    if (!shouldUpdateInteractableInitial) return;
    setInteractableState(componentId, keyName, initialValue!);
  }, [
    shouldUpdateInteractableInitial,
    componentId,
    keyName,
    initialValue,
    setInteractableState,
  ]);

  // Sync from interactable provider when state changes externally (e.g., from AI tool call)
  useEffect(() => {
    if (!isInteractable) return;
    if (interactableState === undefined) return;
    setLocalState((prev) =>
      deepEqual(prev, interactableState) ? prev : (interactableState as S),
    );
  }, [isInteractable, interactableState]);

  // Sync from server state when it changes (e.g., from streaming events) - v1-rendered only
  useEffect(() => {
    if (isInteractable) return;
    if (serverValue === undefined) return;

    // Don't overwrite local changes that haven't synced yet
    if (hasPendingLocalChangeRef.current) return;

    // Only sync if the server value is different from what we last sent
    // This prevents overwriting local state with stale server values
    if (
      lastSentValueRef.current !== undefined &&
      deepEqual(serverValue, lastSentValueRef.current)
    ) {
      return;
    }

    // Use functional update to avoid localState in deps
    setLocalState((prev) =>
      deepEqual(serverValue, prev) ? prev : serverValue,
    );
  }, [isInteractable, serverValue]);

  // Flush pending updates on unmount (only for v1-rendered components)
  useEffect(() => {
    if (isInteractable) return;
    return () => {
      void syncToServer.flush();
    };
  }, [isInteractable, syncToServer]);

  // Flush function for immediate sync (noop for interactable)
  const flush = useCallback(() => {
    if (isInteractable) return;
    void syncToServer.flush();
  }, [isInteractable, syncToServer]);

  return [localState, setState, { isPending, error, flush }];
}
