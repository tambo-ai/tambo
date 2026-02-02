import { getContext, onDestroy } from "svelte";
import { deepEqual } from "fast-equals";
import {
  TAMBO_MESSAGE_KEY,
  TAMBO_THREAD_KEY,
  TAMBO_INTERACTABLE_KEY,
  TAMBO_CLIENT_KEY,
} from "../context.js";
import type { TamboThreadMessage } from "../types.js";
import type { TamboMessageContext } from "../providers/TamboMessageProvider.svelte";
import type { ThreadStore } from "../stores/thread.svelte.js";
import type { InteractableStore } from "../stores/interactable.svelte.js";
import type TamboAI from "@tambo-ai/typescript-sdk";
import { createDebouncedCallback } from "../util/debounce.js";

/**
 * Component state result with value and setter
 */
export interface ComponentStateResult<T> {
  readonly value: T | undefined;
  setValue(newValue: T): void;
}

/**
 * Create a component state that syncs with the thread message's componentState.
 *
 * This is the Svelte equivalent of React's useTamboComponentState hook.
 * It manages state that persists with the message and syncs to the server.
 *
 * For interactable components (wrapped with withTamboInteractable), it updates
 * the interactable provider's global state. For generated components, it updates
 * both local and remote thread message state.
 * @param keyName - Unique key for this state value within componentState
 * @param initialValue - Initial value if no componentState exists
 * @param setFromProp - Value to set during streaming before componentState is set
 * @param debounceTime - Debounce time for API calls (default: 500ms)
 * @returns Object with value getter and setValue function
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { createTamboComponentState } from "@tambo-ai/svelte";
 *
 *   interface Props {
 *     initialCount?: number;
 *   }
 *
 *   let { initialCount = 0 }: Props = $props();
 *
 *   const counter = createTamboComponentState("count", 0, initialCount);
 * </script>
 *
 * <button onclick={() => counter.setValue(counter.value + 1)}>
 *   Count: {counter.value}
 * </button>
 * ```
 */
export function createTamboComponentState<S>(
  keyName: string,
  initialValue?: S,
  setFromProp?: S,
  debounceTime = 500,
): ComponentStateResult<S> {
  // Get contexts - these may be undefined if not within provider
  const messageCtx = getContext<TamboMessageContext | undefined>(
    TAMBO_MESSAGE_KEY,
  );
  const threadStore = getContext<ThreadStore | undefined>(TAMBO_THREAD_KEY);
  const interactableStore = getContext<InteractableStore | undefined>(
    TAMBO_INTERACTABLE_KEY,
  );
  const client = getContext<TamboAI | undefined>(TAMBO_CLIENT_KEY);

  const message = messageCtx?.message ?? null;
  const componentId = message?.interactableMetadata?.id ?? null;

  // Determine initial state from various sources
  const messageState = message?.componentState?.[keyName];
  const interactableState = componentId
    ? interactableStore?.getInteractableComponentState(componentId)?.[keyName]
    : undefined;

  // Priority: interactableState > messageState > setFromProp > initialValue
  let localState = $state<S | undefined>(
    (interactableState as S | undefined) ??
      (messageState as S | undefined) ??
      setFromProp ??
      initialValue,
  );

  let initializedFromMessage = $state(messageState !== undefined);

  // Create debounced API sync
  const debouncedSync = createDebouncedCallback(
    async (newState: S, currentMessage: TamboThreadMessage | null) => {
      if (!currentMessage?.id || !client) {
        return;
      }

      try {
        await client.beta.threads.messages.updateComponentState(
          currentMessage.id,
          {
            id: currentMessage.threadId ?? "",
            state: { [keyName]: newState },
          },
        );
      } catch (err) {
        console.error("Failed to sync component state to server:", err);
      }
    },
    debounceTime,
  );

  // Effect: Sync from setFromProp during streaming (only if no message state yet)
  $effect(() => {
    if (setFromProp !== undefined && !initializedFromMessage) {
      localState = setFromProp;
    }
  });

  // Effect: Sync from message state changes
  $effect(() => {
    const currentMessageState = message?.componentState?.[keyName];
    if (currentMessageState !== undefined) {
      initializedFromMessage = true;
      if (!deepEqual(localState, currentMessageState)) {
        localState = currentMessageState as S;
      }
    }
  });

  // Effect: Sync from interactable state changes
  $effect(() => {
    if (!componentId || !interactableStore) {
      return;
    }

    const currentInteractableState =
      interactableStore.getInteractableComponentState(componentId)?.[keyName];
    if (
      currentInteractableState !== undefined &&
      !deepEqual(localState, currentInteractableState)
    ) {
      localState = currentInteractableState as S;
    }
  });

  // Flush pending on unmount
  onDestroy(() => {
    debouncedSync.flush();
  });

  function setValue(newState: S): void {
    localState = newState;

    if (componentId && interactableStore) {
      // Interactable component: update global state
      interactableStore.setInteractableState(componentId, keyName, newState);
    } else if (message && threadStore) {
      // Generated component: update thread message + API
      threadStore.updateThreadMessage(message.id, {
        componentState: { ...message.componentState, [keyName]: newState },
      });
      debouncedSync(newState, message);
    }
  }

  return {
    get value() {
      return localState;
    },
    setValue,
  };
}
