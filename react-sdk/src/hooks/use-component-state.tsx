"use client";
import { useCallback, useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { TamboThreadMessage, useTamboClient, useTamboThread } from "..";
import { useTamboCurrentMessage } from "./use-current-message";

type StateUpdateResult<T> = [currentState: T, setState: (newState: T) => void];

/**
 * Like useState, but syncs to the thread message's `componentState`.
 *
 * Use `setFromProp` to seed state from streamed props. During streaming,
 * state updates as new prop values arrive. Once streaming completes,
 * user edits take precedence over the original prop value.
 *
 * Pair with `useTamboStreamStatus` to disable inputs while streaming.
 * @see {@link https://docs.tambo.co/concepts/streaming/streaming-best-practices}
 * @param keyName - Unique key within the message's componentState
 * @param initialValue - Default value if no componentState exists
 * @param setFromProp - Seeds state from props (updates during streaming, then user edits take over)
 * @param debounceTime - Server sync debounce in ms (default: 500)
 * @returns A tuple of [currentState, setState] similar to React's useState
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
