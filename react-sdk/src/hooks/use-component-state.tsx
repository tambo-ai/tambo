"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { TamboThreadMessage, useTamboClient, useTamboThread } from "..";
import { useTamboCurrentMessage } from "./use-current-message";

type StateUpdateResult<T> = [currentState: T, setState: (newState: T) => void];

/**
 * A React hook that acts like useState, but also automatically updates the thread message's componentState.
 * Benefits: Passes user changes to AI, and when threads are returned, state is preserved.
 * @param keyName - The unique key to identify this state value within the message's componentState object
 * @param initialValue - Optional initial value for the state, used if no componentState value exists in the Tambo message containing this hook usage.
 * @param setFromProp - Optional value used to set the state value, only while no componentState value exists in the Tambo message containing this hook usage. Use this to allow streaming updates from a prop to the state value.
 * @param debounceTime - Optional debounce time in milliseconds (default: 500ms) to limit API calls.
 * @returns A tuple containing:
 *   - The current state value
 *   - A setter function to update the state (updates UI immediately, debounces server sync)
 * @example
 * const [count, setCount] = useTamboComponentState("counter", 0);
 *
 * // Usage with object state
 * const [formState, setFormState] = useTamboComponentState("myForm", {
 *   name: "",
 *   email: "",
 *   message: ""
 * });
 *
 * // Handling form input
 * const handleChange = (e) => {
 *   setFormState({
 *     ...formState,
 *     [e.target.name]: e.target.value
 *   });
 * };
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
  const message = useTamboCurrentMessage();
  const { updateThreadMessage } = useTamboThread();
  const client = useTamboClient();
  const messageState = message?.componentState?.[keyName];

  // Initialize state with proper priority:
  // 1. Message state (if exists)
  // 2. setFromProp (if provided and no message state)
  // 3. initialValue (fallback)
  const [localState, setLocalState] = useState<S | undefined>(() => {
    if (messageState !== undefined) {
      return messageState as S;
    }
    if (setFromProp !== undefined) {
      return setFromProp as S;
    }
    return initialValue;
  });

  // Track if we've ever received state from a thread message
  // Using a ref since this is metadata that doesn't need to trigger renders
  const hasReceivedMessageStateRef = useRef(messageState !== undefined);

  // Optimistically update the local thread message's componentState
  const updateLocalThreadMessage = useCallback(
    (newState: S, existingMessage: TamboThreadMessage) => {
      const updatedMessage = {
        threadId: existingMessage.threadId,
        componentState: {
          ...existingMessage.componentState,
          [keyName]: newState,
        },
      };
      updateThreadMessage(existingMessage.id, updatedMessage, false);
    },
    [updateThreadMessage, keyName],
  );

  // Debounced callback to update the remote thread message's componentState
  const updateRemoteThreadMessage = useDebouncedCallback(
    async (newState: S, existingMessage: TamboThreadMessage) => {
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
      updateLocalThreadMessage(newState, message);
      updateRemoteThreadMessage(newState, message);
    },
    [message, updateLocalThreadMessage, updateRemoteThreadMessage],
  );

  // Synchronize message state to local state
  // This is a legitimate use of setState in useEffect because we're synchronizing with
  // an external data source (the thread message from the API). We have proper guards
  // to prevent infinite loops: we only update when messageState changes.
  useEffect(() => {
    const currentMessageState = message?.componentState?.[keyName];

    // Only update if we have message state
    if (currentMessageState === undefined) {
      return;
    }

    // Mark that we've received message state (using ref to avoid triggering renders)
    hasReceivedMessageStateRef.current = true;

    // Update local state to match message state
    // eslint-disable-next-line -- Synchronizing with external data source (thread message from API)
    setLocalState(currentMessageState as S);
  }, [message?.componentState, keyName]);

  // Synchronize setFromProp to local state, but only if we haven't received message state yet
  // This allows streaming updates from props until the thread message state takes over.
  // This is a legitimate use of setState in useEffect for prop synchronization.
  useEffect(() => {
    if (setFromProp !== undefined && !hasReceivedMessageStateRef.current) {
      // eslint-disable-next-line -- Legitimate external state synchronization
      setLocalState(setFromProp as S);
    }
  }, [setFromProp]);

  // Ensure pending changes are flushed on unmount
  useEffect(() => {
    return () => {
      updateRemoteThreadMessage.flush();
    };
  }, [updateRemoteThreadMessage]);

  return [localState as S, setValue];
}
