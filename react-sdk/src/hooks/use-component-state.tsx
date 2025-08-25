"use client";
import { useCallback, useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { TamboThreadMessage, useTamboClient, useTamboThread } from "..";
import { useTamboCurrentMessage } from "./use-current-message";

type StateUpdateResult<T> = [currentState: T, setState: (newState: T) => void];

/**
 * A React hook that provides state management and passes user updates to Tambo.
 * Benefits: Passes user changes to AI, and when threads are returned, state is preserved.
 * @param keyName - The unique key to identify this state within the message's componentState object
 * @param initialValue - Optional initial value for the state, used if no value exists in the message
 * @param debounceTime - Optional debounce time in milliseconds (default: 300ms) to limit API calls
 * @returns A tuple containing:
 *   - The current state value
 *   - A setter function to update the state (updates UI immediately, debounces server sync)
 *   - A metadata object with properties like isPending to track sync status
 * @example
 * // Basic usage
 * const [count, setCount, { isPending }] = useTamboComponentState("counter", 0);
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
  debounceTime?: number,
  setFromProp?: any,
): StateUpdateResult<S | undefined>;
export function useTamboComponentState<S>(
  keyName: string,
  initialValue: S,
  debounceTime?: number,
  setFromProp?: any,
): StateUpdateResult<S>;

export function useTamboComponentState<S>(
  keyName: string,
  initialValue?: S,
  debounceTime = 500,
  setFromProp?: any,
): StateUpdateResult<S> {
  const message = useTamboCurrentMessage();
  const { updateThreadMessage } = useTamboThread();
  const client = useTamboClient();
  const messageState = message?.componentState?.[keyName];
  const [localState, setLocalState] = useState<S | undefined>(
    (messageState as S) ?? initialValue,
  );
  const [initializedFromThreadMessage, setInitializedFromThreadMessage] =
    useState(messageState ? true : false);

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
      const componentStateUpdate = {
        state: { [keyName]: newState },
      };
      await client.beta.threads.messages.updateComponentState(
        existingMessage.threadId,
        existingMessage.id,
        componentStateUpdate,
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

  useEffect(() => {
    const messageState = message?.componentState?.[keyName];
    if (!messageState) {
      return;
    }
    setInitializedFromThreadMessage(true);
    setLocalState(message.componentState?.[keyName] as S);
    updateLocalThreadMessage(message.componentState?.[keyName] as S, message);
  }, [
    message.componentState?.[keyName],
    updateLocalThreadMessage,
    message,
    keyName,
  ]);

  // For editable fields that are set from a prop to allow streaming updates, don't overwrite a fetched state value set from the thread message with prop value on initial load.
  useEffect(() => {
    if (setFromProp) {
      if (!initializedFromThreadMessage) {
        setLocalState(setFromProp);
      }
    }
  }, [setFromProp, setValue, initializedFromThreadMessage]);

  // Ensure pending changes are flushed on unmount
  useEffect(() => {
    return () => {
      updateRemoteThreadMessage.flush();
    };
  }, [updateRemoteThreadMessage]);

  return [localState as S, setValue];
}
