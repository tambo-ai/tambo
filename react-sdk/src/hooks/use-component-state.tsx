"use client";
import { useCallback, useContext, useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { TamboThreadMessage, useTamboClient, useTamboThread } from "..";
import { InteractableIdContext } from "../providers/hoc/with-tambo-interactable";
import { useTamboInteractable } from "../providers/tambo-interactable-provider";
import { TamboMessageContext } from "./use-current-message";

type StateUpdateResult<T> = [currentState: T, setState: (newState: T) => void];

/**
 * A React hook that acts like useState, but also automatically updates the thread message's componentState.
 * If used within an interactable component (wrapped with withTamboInteractable), it also updates the
 * interactable provider's global state (sent to Tambo on every request).
 *
 * Benefits: Passes user changes to AI, and when threads are returned, state is preserved.
 * Works in both generative and interactable component contexts.
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
  const message = useContext(TamboMessageContext);
  const { updateThreadMessage } = useTamboThread();
  const client = useTamboClient();
  const componentId = useContext(InteractableIdContext);
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
        setInteractableState(componentId, keyName, newState);
      }
      if (message) {
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

  // Set initial value in interactable state if we're in an interactable context and there's no existing state
  useEffect(() => {
    if (!componentId) {
      return;
    }

    if (messageState !== undefined) {
      return;
    }
    const existingInteractableState =
      getInteractableComponentState(componentId)?.[keyName];
    if (existingInteractableState === undefined && initialValue !== undefined) {
      setInteractableState(componentId, keyName, initialValue);
    }
  }, [
    componentId,
    keyName,
    initialValue,
    messageState,
    getInteractableComponentState,
    setInteractableState,
  ]);

  // Mirror the thread message's componentState value to the local state and interactable state
  useEffect(() => {
    if (!message) {
      return;
    }
    const messageState = message.componentState?.[keyName];
    if (!messageState) {
      return;
    }
    setInitializedFromThreadMessage(true);
    const stateValue = message.componentState?.[keyName] as S;
    setLocalState(stateValue);
    if (componentId) {
      setInteractableState(componentId, keyName, stateValue);
    }
  }, [
    message?.componentState?.[keyName],
    message,
    keyName,
    setInteractableState,
    componentId,
  ]);

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
