import { getContext } from "svelte";
import type TamboAI from "@tambo-ai/typescript-sdk";
import {
  TAMBO_CLIENT_KEY,
  TAMBO_THREAD_KEY,
  TAMBO_REGISTRY_KEY,
  TAMBO_INPUT_KEY,
  TAMBO_STATUS_KEY,
  TAMBO_INTERACTABLE_KEY,
  TAMBO_CONFIG_KEY,
} from "../context.js";
import type { ThreadStore } from "../stores/thread.svelte.js";
import type { RegistryStore } from "../stores/registry.svelte.js";
import type { InputStore } from "../stores/input.svelte.js";
import type { StreamStatusStore } from "../stores/stream-status.svelte.js";
import type { InteractableStore } from "../stores/interactable.svelte.js";

/**
 * Configuration context
 */
export interface TamboConfig {
  streaming: boolean;
  contextKey?: string;
  autoGenerateThreadName: boolean;
  autoGenerateNameThreshold: number;
}

/**
 * Combined Tambo context with all stores and client
 */
export interface TamboContext {
  client: TamboAI;
  thread: ThreadStore;
  registry: RegistryStore;
  input: InputStore;
  status: StreamStatusStore;
  interactable: InteractableStore;
  config: TamboConfig;
}

/**
 * Get all Tambo context stores in one call.
 *
 * This is a convenience hook that provides access to all Tambo stores.
 * For more targeted access, use the individual hooks (useTamboThread, etc.).
 *
 * Must be called within a component that is a descendant of TamboProvider.
 * @returns Combined Tambo context with all stores
 * @throws Error if called outside of TamboProvider
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { useTambo } from "@tambo-ai/svelte";
 *
 *   const { thread, input, registry } = useTambo();
 * </script>
 *
 * <div>
 *   {#each thread.messages as message}
 *     <div>{message.content}</div>
 *   {/each}
 * </div>
 * ```
 */
export function useTambo(): TamboContext {
  const client = getContext<TamboAI | undefined>(TAMBO_CLIENT_KEY);
  const thread = getContext<ThreadStore | undefined>(TAMBO_THREAD_KEY);
  const registry = getContext<RegistryStore | undefined>(TAMBO_REGISTRY_KEY);
  const input = getContext<InputStore | undefined>(TAMBO_INPUT_KEY);
  const status = getContext<StreamStatusStore | undefined>(TAMBO_STATUS_KEY);
  const interactable = getContext<InteractableStore | undefined>(
    TAMBO_INTERACTABLE_KEY,
  );
  const config = getContext<TamboConfig | undefined>(TAMBO_CONFIG_KEY);

  if (
    !client ||
    !thread ||
    !registry ||
    !input ||
    !status ||
    !interactable ||
    !config
  ) {
    throw new Error("useTambo must be used within a TamboProvider");
  }

  return {
    client,
    thread,
    registry,
    input,
    status,
    interactable,
    config,
  };
}
