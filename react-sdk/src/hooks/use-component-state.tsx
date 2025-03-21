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
 *
 * @param keyName - The unique key to identify this state within the message's componentState object
 * @param initialValue - Optional initial value for the state, used if no value exists in the message
 * @param debounceTime - Optional debounce time in milliseconds (default: 300ms) to limit API calls
 *
 * @returns A tuple containing:
 *   - The current state value
 *   - A setter function to update the state (updates UI immediately, debounces server sync)
 *   - A metadata object with properties like isPending to track sync status
 *
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
export function useTamboComponentState<S>(
  keyName: string,
  initialValue?: S,
  debounceTime = 300,
): StateUpdateResult<S> {
  const { threadId, messageId } = useTamboMessageContext();
  const { updateThreadMessage } = useTamboThread();
  const client = useTamboClient();
  const message = useTamboCurrentMessage();

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

  // Helper function to check if two values are deeply equal
  const isEqual = (a: any, b: any): boolean => {
    if (a === b) return true;

    // Handle primitive types
    if (
      typeof a !== "object" ||
      typeof b !== "object" ||
      a === null ||
      b === null
    )
      return false;

    // For objects and arrays, do a shallow comparison for simplicity
    // This could be enhanced with a proper deep equality check if needed
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((val, idx) => val === b[idx]);
    }

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    return keysA.every((key) => a[key] === b[key]);
  };

  // Sync local state with message state on initial load and when message changes
  useEffect(() => {
    if (message?.componentState && keyName in message.componentState) {
      const messageState = message.componentState[keyName] as S;

      // If this is a user-initiated state that matches what we're getting from server,
      // we can clear the lastUserValue flag since it's been synchronized
      if (lastUserValue !== null && isEqual(messageState, lastUserValue)) {
        setLastUserValue(null);
      }

      // Update local state with server state unless user has specifically changed this value
      // This allows streaming updates to continue while protecting user edits
      if (lastUserValue === null || !isEqual(localState, lastUserValue)) {
        setLocalState(messageState);
      }
    }
    // Otherwise fall back to initial value if we have one
    else if (cachedInitialValue !== undefined && !localState) {
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
  const debouncedSave = useDebouncedCallback(async (newValue: S) => {
    if (!message) {
      console.warn(
        `Cannot update missing message ${messageId} for state key "${keyName}"`,
      );
      setLastUserValue(null);
      return;
    }

    setIsPending(true);
    try {
      const messageUpdate = {
        ...message,
        componentState: {
          ...message.componentState,
          [keyName]: newValue,
        },
      };

      const componentStateUpdate = {
        state: { [keyName]: newValue },
      };

      await Promise.all([
        updateThreadMessage(messageId, messageUpdate, false),
        client.beta.threads.messages.updateComponentState(
          threadId,
          messageId,
          componentStateUpdate,
        ),
      ]);

      // Only clear the lastUserValue when we've successfully synced this exact value
      if (isEqual(newValue, lastUserValue)) {
        setLastUserValue(null);
      }
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
        debouncedSave(newValue);
      } else {
        console.warn(
          `Cannot update server for missing message ${messageId} with key "${keyName}"`,
        );
        setLastUserValue(null);
      }
    },
    [debouncedSave, message, messageId, keyName],
  );

  // Ensure pending changes are flushed on unmount
  useEffect(() => {
    return () => {
      debouncedSave.flush();
      setLastUserValue(null);
    };
  }, [debouncedSave]);

  // Return the local state for immediate UI rendering
  return [localState as S, setValue, { isPending }];
}
