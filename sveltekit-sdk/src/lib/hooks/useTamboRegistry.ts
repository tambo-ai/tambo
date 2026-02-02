import { getContext } from "svelte";
import { TAMBO_REGISTRY_KEY } from "../context.js";
import type { RegistryStore } from "../stores/registry.svelte.js";

/**
 * Get the registry store from context.
 *
 * Provides access to registered components and tools, and methods
 * for registering new components and tools.
 *
 * Must be called within a component that is a descendant of TamboProvider.
 * @returns The registry store
 * @throws Error if called outside of TamboProvider
 */
export function useTamboRegistry(): RegistryStore {
  const registryStore = getContext<RegistryStore | undefined>(
    TAMBO_REGISTRY_KEY,
  );

  if (!registryStore) {
    throw new Error("useTamboRegistry must be used within a TamboProvider");
  }

  return registryStore;
}
