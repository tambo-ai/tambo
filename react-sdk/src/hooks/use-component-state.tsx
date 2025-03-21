import { useCallback, useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useTamboClient, useTamboThread } from "../providers";
import {
  useTamboCurrentMessage,
  useTamboMessageContext,
} from "./use-current-message";

type StateUpdateResult<T> = [
  currentState: T,
  setState: (newState: T) => void,
  meta: { isPending: boolean },
];

/**
 * Behaves similarly to useState, but the value is stored in the thread
 * message, and the state is keyed by the keyName
 */
export function useTamboComponentState<S = undefined>(
  keyName: string,
): StateUpdateResult<S | undefined>;
export function useTamboComponentState<S = undefined>(
  keyName: string,
  initialValue?: S,
): StateUpdateResult<S | undefined>;
export function useTamboComponentState<S = undefined>(
  keyName: string,
  initialValue?: S,
  debounceTime?: number,
): StateUpdateResult<S | undefined>;
export function useTamboComponentState<S>(
  keyName: string,
  initialValue?: S,
): StateUpdateResult<S>;
export function useTamboComponentState<S>(
  keyName: string,
  initialValue?: S,
  debounceTime?: number,
): StateUpdateResult<S>;
export function useTamboComponentState<S>(
  keyName: string,
  initialValue?: S,
  debounceTime = 300,
): StateUpdateResult<S> {
  const { threadId, messageId } = useTamboMessageContext();
  const { updateThreadMessage } = useTamboThread();
  const client = useTamboClient();

  const message = useTamboCurrentMessage();
  const [cachedInitialValue] = useState(() => initialValue);
  const [isPending, setIsPending] = useState(false);

  // Track whether we're in a local update to prevent message sync from overriding local state
  const [isLocalUpdate, setIsLocalUpdate] = useState(false);

  // Keep a local state for immediate UI updates
  const [localState, setLocalState] = useState<S | undefined>(
    cachedInitialValue,
  );

  // Sync local state with message state on initial load and when message changes
  // BUT ONLY if we're not in the middle of a local update
  useEffect(() => {
    if (
      !isLocalUpdate &&
      message?.componentState &&
      keyName in message.componentState
    ) {
      setLocalState(message.componentState[keyName] as S);
    } else if (!isLocalUpdate && cachedInitialValue !== undefined) {
      setLocalState(cachedInitialValue);
    }
  }, [keyName, message?.componentState, cachedInitialValue, isLocalUpdate]);

  // Create debounced save function
  const debouncedSave = useDebouncedCallback(async (newValue: S) => {
    if (!message) {
      console.warn(`Cannot update missing message ${messageId}`);
      return;
    }

    setIsPending(true);
    try {
      await Promise.all([
        updateThreadMessage(
          messageId,
          {
            ...message,
            componentState: {
              ...message.componentState,
              [keyName]: newValue,
            },
          },
          false,
        ),
        client.beta.threads.messages.updateComponentState(threadId, messageId, {
          state: { [keyName]: newValue },
        }),
      ]);
    } catch (err) {
      console.error("Failed to save component state:", err);
    } finally {
      setIsPending(false);
      // Reset the local update flag when the save is complete
      setIsLocalUpdate(false);
    }
  }, debounceTime);

  const initializeState = useCallback(async () => {
    if (!message) {
      console.warn(`Cannot initialize state for missing message ${messageId}`);
      return;
    }
    try {
      await Promise.all([
        updateThreadMessage(
          messageId,
          {
            ...message,
            componentState: {
              ...message.componentState,
              [keyName]: cachedInitialValue,
            },
          },
          false,
        ),
        client.beta.threads.messages.updateComponentState(threadId, messageId, {
          state: { [keyName]: cachedInitialValue },
        }),
      ]);
    } catch (err) {
      console.warn("Failed to initialize component state:", err);
    }
  }, [
    cachedInitialValue,
    client.beta.threads.messages,
    keyName,
    message,
    messageId,
    threadId,
    updateThreadMessage,
  ]);
  const [haveInitialized, setHaveInitialized] = useState(false);
  const shouldInitialize =
    !haveInitialized &&
    message &&
    cachedInitialValue !== undefined &&
    (!message.componentState || !(keyName in message.componentState));

  // send initial state
  useEffect(() => {
    if (shouldInitialize) {
      initializeState();
      setHaveInitialized(true);
    }
  }, [initializeState, shouldInitialize]);

  // setValue updates local state immediately and schedules server sync
  const setValue = useCallback(
    (newValue: S) => {
      // Set the local update flag to prevent message sync from overriding our update
      setIsLocalUpdate(true);

      // Update local state immediately for responsive UI
      setLocalState(newValue);

      // Only trigger server updates if we have a message
      if (message) {
        // Schedule debounced backend update
        debouncedSave(newValue);
      } else {
        console.warn(`Cannot update server for missing message ${messageId}`);
        // If we can't update the server, we should still reset the local update flag
        setIsLocalUpdate(false);
      }
    },
    [debouncedSave, message, messageId],
  );

  // Ensure pending changes are flushed on unmount
  useEffect(() => {
    return () => {
      debouncedSave.flush();
    };
  }, [debouncedSave]);

  // Return the local state for immediate UI rendering
  return [localState as S, setValue, { isPending }];
}
