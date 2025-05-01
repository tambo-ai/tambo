import { useCallback, useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useTamboClient, useTamboThread } from "../providers";
import {
  useTamboCurrentMessage,
  useTamboMessageContext,
} from "./use-current-message";
// Define metadata interface for better extensibility
interface ComponentStateMeta {
  isPending: boolean;
}

type StateUpdateResult<T> = [
  currentState: T,
  setState: (newState: T) => void,
  meta: ComponentStateMeta,
];

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
): StateUpdateResult<S | undefined>;
export function useTamboComponentState<S>(
  keyName: string,
  initialValue: S,
  debounceTime?: number,
): StateUpdateResult<S>;
// eslint-disable-next-line jsdoc/require-jsdoc
export function useTamboComponentState<S>(
  keyName: string,
  initialValue?: S,
  debounceTime = 500,
): StateUpdateResult<S> {
  const { messageId } = useTamboMessageContext();
  const { updateThreadMessage, thread } = useTamboThread();
  const client = useTamboClient();
  const message = useTamboCurrentMessage();
  const threadId = thread.id;

  // Initial value management
  const [cachedInitialValue] = useState(() => initialValue);
  // UI state management
  const [localState, setLocalState] = useState<S | undefined>(
    cachedInitialValue,
  );
  // Synchronization state
  const [isPending, setIsPending] = useState(false);
  // Track the last user-initiated value instead of a simple boolean flag
  const [lastUserValue, setLastUserValue] = useState<S | null>(null);
  const [haveInitialized, setHaveInitialized] = useState(false);

  // Determine if we need to initialize state
  const shouldInitialize =
    !haveInitialized &&
    message &&
    cachedInitialValue !== undefined &&
    (!message.componentState || !(keyName in message.componentState));

  // Sync local state with message state on initial load and when message changes
  useEffect(() => {
    if (message?.componentState && keyName in message.componentState) {
      const messageState = message.componentState[keyName] as S;

      // Only update local state if we haven't had any user changes yet
      if (lastUserValue === null) {
        setLocalState(messageState);
      }
    }
    // Otherwise fall back to initial value if we have one and no user changes
    else if (
      cachedInitialValue !== undefined &&
      !localState &&
      lastUserValue === null
    ) {
      setLocalState(cachedInitialValue);
    }
  }, [
    keyName,
    message?.componentState,
    cachedInitialValue,
    lastUserValue,
    localState,
  ]);

  // Create debounced save function for efficient server synchronization
  const debouncedServerWrite = useDebouncedCallback(async (newValue: S) => {
    setIsPending(true);
    try {
      const componentStateUpdate = {
        state: { [keyName]: newValue },
      };

      await client.beta.threads.messages.updateComponentState(
        threadId,
        messageId,
        componentStateUpdate,
      );
    } catch (err) {
      console.error(
        `Failed to save component state for key "${keyName}":`,
        err,
      );
    } finally {
      setIsPending(false);
    }
  }, debounceTime);

  // Initialize state on first render if needed
  const initializeState = useCallback(async () => {
    if (!message) {
      console.warn(
        `Cannot initialize state for missing message ${messageId} with key "${keyName}"`,
      );
      return;
    }

    try {
      const messageUpdate = {
        ...message,
        componentState: {
          ...message.componentState,
          [keyName]: cachedInitialValue,
        },
      };

      const componentStateUpdate = {
        state: { [keyName]: cachedInitialValue },
      };

      await Promise.all([
        updateThreadMessage(messageId, messageUpdate, false),
        client.beta.threads.messages.updateComponentState(
          threadId,
          messageId,
          componentStateUpdate,
        ),
      ]);
    } catch (err) {
      console.warn(
        `Failed to initialize component state for key "${keyName}":`,
        err,
      );
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

  // Send initial state when component mounts
  useEffect(() => {
    if (shouldInitialize) {
      initializeState();
      setHaveInitialized(true);
    }
  }, [initializeState, shouldInitialize]);

  // setValue function for updating state
  // Updates local state immediately and schedules debounced server sync
  const setValue = useCallback(
    (newValue: S) => {
      // Track this as a user-initiated update
      setLastUserValue(newValue);
      setLocalState(newValue);

      // Only trigger server updates if we have a message
      if (message) {
        debouncedServerWrite(newValue);
        const messageUpdate = {
          ...message,
          componentState: {
            ...message.componentState,
            [keyName]: newValue,
          },
        };

        updateThreadMessage(messageId, messageUpdate, false);
      } else {
        console.warn(
          `Cannot update server for missing message ${messageId} with key "${keyName}"`,
        );
      }
    },
    [message, debouncedServerWrite, keyName, updateThreadMessage, messageId],
  );

  // Ensure pending changes are flushed on unmount
  useEffect(() => {
    return () => {
      debouncedServerWrite.flush();
    };
  }, [debouncedServerWrite]);

  // Return the local state for immediate UI rendering
  return [localState as S, setValue, { isPending }];
}
