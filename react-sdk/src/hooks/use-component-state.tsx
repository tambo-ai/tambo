"use client";
import { useCallback, useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { TamboThreadMessage, useTamboClient, useTamboThread } from "..";
import { useTamboCurrentMessage } from "./use-current-message";

type StateUpdateResult<T> = [currentState: T, setState: (newState: T) => void];

/**
 * A React hook that acts like useState, but also automatically updates the
 * thread message's `componentState`.
 *
 * This is the core of the canonical **stream → state → UI** pattern for
 * editable components:
 *
 * 1. Tambo streams props into your component.
 * 2. You derive a local editable state value with `useTamboComponentState`.
 * 3. You render UI exclusively from that state, not directly from props.
 * 4. `useTamboStreamStatus` drives loading/disabled states while streaming.
 *
 * Use the `setFromProp` parameter to copy generated props into local state
 * only while the current message has no `componentState[keyName]` value. As
 * soon as a value is written for this key in `componentState`, `setFromProp`
 * is ignored for that message, so later prop changes (including re-renders of
 * the same message) will not overwrite user edits.
 *
 * Combined with `useTamboStreamStatus`, this lets you disable inputs while AI
 * is still streaming and then hand full control to the user once streaming
 * completes.
 *
 * See the docs page at
 * https://docs.tambo.co/concepts/streaming/building-streaming-components for a
 * complete example of this pattern.
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
  const [localState, setLocalState] = useState<S | undefined>(
    (messageState as S) ?? initialValue,
  );
  const [initializedFromThreadMessage, setInitializedFromThreadMessage] =
    useState(messageState ? true : false);

  // Optimistically update the local thread message's componentState
  const updateLocalThreadMessage = useCallback(
    async (newState: S, existingMessage: TamboThreadMessage) => {
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
      void updateLocalThreadMessage(newState, message);
      void updateRemoteThreadMessage(newState, message);
    },
    [message, updateLocalThreadMessage, updateRemoteThreadMessage],
  );

  // Mirror the thread message's componentState value to the local state
  useEffect(() => {
    const messageState = message?.componentState?.[keyName];
    if (!messageState) {
      return;
    }
    setInitializedFromThreadMessage(true);
    setLocalState(message.componentState?.[keyName] as S);
  }, [message?.componentState?.[keyName], message, keyName]);

  // For editable fields that are set from a prop to allow streaming updates, don't overwrite a fetched state value set from the thread message with prop value on initial load.
  useEffect(() => {
    if (setFromProp !== undefined && !initializedFromThreadMessage) {
      setLocalState(setFromProp as S);
    }
  }, [setFromProp, initializedFromThreadMessage]);

  // Ensure pending changes are flushed on unmount
  useEffect(() => {
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
  }, [updateRemoteThreadMessage]);

  return [localState as S, setValue];
}
