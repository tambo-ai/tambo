import { getContext } from "svelte";
import { TAMBO_INTERACTABLE_KEY } from "../context.js";
import type { InteractableStore } from "../stores/interactable.svelte.js";

/**
 * Get the interactable store from context.
 *
 * Provides access to interactive components and methods for
 * managing their state and props.
 *
 * Must be called within a component that is a descendant of TamboProvider.
 * @returns The interactable store
 * @throws Error if called outside of TamboProvider
 */
export function useTamboInteractable(): InteractableStore {
  const interactableStore = getContext<InteractableStore | undefined>(
    TAMBO_INTERACTABLE_KEY,
  );

  if (!interactableStore) {
    throw new Error("useTamboInteractable must be used within a TamboProvider");
  }

  return interactableStore;
}
