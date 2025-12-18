"use client";
import { deepEqual } from "fast-equals";
import { useCallback, useContext, useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { TamboThreadMessage, useTamboClient, useTamboThread } from "..";
import { useTamboInteractable } from "../providers/tambo-interactable-provider";
import { TamboMessageContext } from "./use-current-message";

type StateUpdateResult<T> = [currentState: T, setState: (newState: T) => void];

/**
 * A React hook that acts like useState, but also automatically updates the thread message's componentState.
 * If used within an interactable component (wrapped with withTamboInteractable), it updates the
 * interactable provider's global state (sent to Tambo on every request) instead of the remote thread message state.
 * For generated components, it updates both the local and remote thread message's componentState.
 *
 * Benefits: Passes user changes to AI, and when threads are returned, state is preserved.
 * Works in both generative and interactable component contexts.
 * @param keyName - The unique key to identify this state value within the message's componentState object
 * @param initialValue - Optional initial value for the state, used if no componentState value exists in the Tambo message containing this hook usage.
 * @param setFromProp - Optional value used to set the state value, only while no componentState value exists in the Tambo message containing this hook usage. Use this to allow streaming updates from a prop to the state value.
 * @param debounceTime - Optional debounce time in milliseconds (default: 500ms) to limit API calls.
 * @returns A tuple of [currentState, setState] similar to React's useState
 * @example
 * ```tsx
 * const [count, setCount] = useTamboComponentState("counter", 0);
 * ```
 *
 * Use `setFromProp` to seed state from streamed props. During streaming,
 * state updates as new prop values arrive. Once streaming completes,
 * user edits take precedence over the original prop value.
 *
 * Pair with `useTamboStreamStatus` to disable inputs while streaming.
 * @see {@link https://docs.tambo.co/concepts/streaming/streaming-best-practices}
 */
export function useTamboComponentState<S = undefined>(
  keyName: string,
  initialValue?: S,
  setFromProp?: S,
  debounceTime?: number,
): StateUpdateResult<S | undefined>;
export function useTamboComponentState<S>(
  keyName: string,
  initialValue: S,
  setFromProp?: S,
  debounceTime?: number,
): StateUpdateResult<S>;
export function useTamboComponentState<S>(
  keyName: string,
  initialValue?: S,
  setFromProp?: S,
  debounceTime = 500,
): StateUpdateResult<S> {
  const message = useContext(TamboMessageContext);
  const { updateThreadMessage } = useTamboThread();
  const client = useTamboClient();
  const componentId = message?.interactableMetadata?.id ?? null;
  const { setInteractableState, getInteractableComponentState } =
    useTamboInteractable();
  const messageState = message?.componentState?.[keyName];
  const interactableState = componentId
    ? getInteractableComponentState(componentId)?.[keyName]
    : undefined;
  const initialState =
    (interactableState as S) ?? (messageState as S) ?? initialValue;
  const [localState, setLocalState] = useState<S | undefined>(initialState);
  const [initializedFromThreadMessage, setInitializedFromThreadMessage] =
    useState(messageState ? true : false);

  // Optimistically update the local thread message's componentState
  const updateLocalThreadMessage = useCallback(
    async (newState: S, existingMessage: TamboThreadMessage | null) => {
      if (!existingMessage) {
        return;
      }
      const updatedMessage = {
        threadId: existingMessage.threadId,
        componentState: {
          ...existingMessage.componentState,
          [keyName]: newState,
        },
      };
      await updateThreadMessage(existingMessage.id, updatedMessage, false);
    },
    [updateThreadMessage, keyName],
  );

  // Debounced callback to update the remote thread message's componentState
  const updateRemoteThreadMessage = useDebouncedCallback(
    async (newState: S, existingMessage: TamboThreadMessage | null) => {
      if (!existingMessage) {
        return;
      }
      await client.beta.threads.messages.updateComponentState(
        existingMessage.id,
        {
          id: existingMessage.threadId,
          state: { [keyName]: newState },
        },
      );
    },
    debounceTime,
  );

  const setValue = useCallback(
    (newState: S) => {
      setLocalState(newState);
      if (componentId) {
        // For interactable components, update the interactable provider's state
        setInteractableState(componentId, keyName, newState);
      } else if (message) {
        // For generated components, update both local and remote thread message state
        void updateLocalThreadMessage(newState, message);
        void updateRemoteThreadMessage(newState, message);
      }
    },
    [
      message,
      updateLocalThreadMessage,
      updateRemoteThreadMessage,
      setInteractableState,
      componentId,
      keyName,
    ],
  );

  const existingInteractableState = componentId
    ? getInteractableComponentState(componentId)?.[keyName]
    : undefined;
  const shouldUpdateInteractableInitial =
    !!componentId &&
    existingInteractableState === undefined &&
    initialValue !== undefined;

  // Set initial value in interactable state if we're in an interactable context and there's no existing state
  useEffect(() => {
    if (!shouldUpdateInteractableInitial) {
      return;
    }
    setInteractableState(componentId, keyName, initialValue!);
  }, [
    shouldUpdateInteractableInitial,
    componentId,
    keyName,
    initialValue,
    setInteractableState,
  ]);

  const shouldSyncFromMessage =
    !!message && messageState !== undefined && messageState !== null;

  // Mirror the thread message's componentState value to the local state and interactable state
  useEffect(() => {
    if (!shouldSyncFromMessage) {
      return;
    }
    setInitializedFromThreadMessage(true);
    const stateValue = messageState as S;
    setLocalState(stateValue);
    if (componentId) {
      setInteractableState(componentId, keyName, stateValue);
    }
  }, [
    shouldSyncFromMessage,
    messageState,
    keyName,
    setInteractableState,
    componentId,
  ]);

  // Sync from interactable provider to local state when state changes externally (e.g., from Tambo tool call)
  useEffect(() => {
    if (!componentId) return;
    // only update if different
    setLocalState((prev) =>
      deepEqual(prev, interactableState) ? prev : (interactableState as S),
    );
  }, [componentId, interactableState]);

  // For editable fields that are set from a prop to allow streaming updates, don't overwrite a fetched state value set from the thread message with prop value on initial load.
  useEffect(() => {
    if (setFromProp !== undefined && !initializedFromThreadMessage) {
      setLocalState(setFromProp as S);
    }
  }, [setFromProp, initializedFromThreadMessage]);

  // Ensure pending changes are flushed on unmount (only for generated components)
  useEffect(() => {
    // Only flush remote updates for generated components, not interactable components
    if (componentId) {
      return;
    }
    return () => {
      async function flushUpdates() {
        try {
          await updateRemoteThreadMessage.flush();
        } catch (error) {
          console.error(
            "Failed to flush pending thread message updates:",
            error,
          );
        }
      }
      // Fire-and-forget cleanup (errors handled inside)
      void flushUpdates();
    };
  }, [updateRemoteThreadMessage, componentId]);

  return [localState as S, setValue];
}
