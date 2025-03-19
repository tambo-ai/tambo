import { useCallback, useEffect, useMemo, useState } from "react";
import { useTamboClient, useTamboThread } from "../providers";
import {
  useTamboCurrentMessage,
  useTamboMessageContext,
} from "./use-current-message";

type StateUpdateResult<T> = [currentState: T, setState: (newState: T) => void];

/**
 * Behaves similarly to useState, but the value is stored in the thread
 * message, and the state is keyed by the keyName
 */
export function useTamboComponentState<S = undefined>(
  keyName: string,
): StateUpdateResult<S | undefined>;
export function useTamboComponentState<S>(
  keyName: string,
  initialValue?: S,
): StateUpdateResult<S>;
export function useTamboComponentState<S>(
  keyName: string,
  initialValue?: S,
): StateUpdateResult<S> {
  const { threadId, messageId } = useTamboMessageContext();
  const { updateThreadMessage } = useTamboThread();
  const client = useTamboClient();

  const message = useTamboCurrentMessage();
  const [cachedInitialValue] = useState(() => initialValue);

  const value = useMemo(() => {
    if (!message?.componentState) return cachedInitialValue;
    return keyName in message.componentState
      ? (message.componentState[keyName] as S)
      : cachedInitialValue;
  }, [cachedInitialValue, keyName, message?.componentState]);

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

  const setValue = useCallback(
    async (newValue: S) => {
      if (!message) {
        console.warn(`Cannot update missing message ${messageId}`);
        return;
      }
      await updateThreadMessage(
        messageId,
        {
          ...message,
          componentState: {
            ...message.componentState,
            [keyName]: newValue,
          },
        },
        false,
      );
      await client.beta.threads.messages.updateComponentState(
        threadId,
        messageId,
        { state: { [keyName]: newValue } },
      );
    },
    [
      client.beta.threads.messages,
      keyName,
      message,
      messageId,
      threadId,
      updateThreadMessage,
    ],
  );
  return [value as S, setValue];
}
