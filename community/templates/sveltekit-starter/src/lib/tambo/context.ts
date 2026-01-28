import { getContext, setContext } from "svelte";
import {
  createThreadStore,
  type ThreadStore,
  type ThreadStoreOptions,
} from "./stores/thread.svelte.js";
import { createInputStore, type InputStore } from "./stores/input.svelte.js";
import {
  createStreamStatusStore,
  type StreamStatusStore,
} from "./stores/stream-status.svelte.js";
import {
  createRegistryStore,
  type RegistryStore,
} from "./stores/registry.svelte.js";

const TAMBO_CONTEXT_KEY = Symbol("tambo");
const TAMBO_INPUT_KEY = Symbol("tambo-input");
const TAMBO_STATUS_KEY = Symbol("tambo-status");
const TAMBO_REGISTRY_KEY = Symbol("tambo-registry");

export interface TamboContext {
  thread: ThreadStore;
  input: InputStore;
  status: StreamStatusStore;
  registry: RegistryStore;
}

/**
 * Create and set all Tambo contexts
 */
export function createTamboContext(
  options: ThreadStoreOptions = {},
): TamboContext {
  const thread = createThreadStore(options);
  const input = createInputStore();
  const status = createStreamStatusStore();
  const registry = createRegistryStore();

  // Register components and tools if provided
  if (options.components) {
    registry.registerComponents(options.components);
  }
  if (options.tools) {
    registry.registerTools(options.tools);
  }

  const context: TamboContext = { thread, input, status, registry };

  setContext(TAMBO_CONTEXT_KEY, context);
  setContext(TAMBO_INPUT_KEY, input);
  setContext(TAMBO_STATUS_KEY, status);
  setContext(TAMBO_REGISTRY_KEY, registry);

  return context;
}

/**
 * Get the full Tambo context
 */
export function getTamboContext(): TamboContext {
  const context = getContext<TamboContext>(TAMBO_CONTEXT_KEY);
  if (!context) {
    throw new Error(
      "Tambo context not found. Did you wrap your component in TamboProvider?",
    );
  }
  return context;
}

/**
 * Get just the thread store
 */
export function useTambo(): ThreadStore {
  return getTamboContext().thread;
}

/**
 * Get just the input store
 */
export function useTamboInput(): InputStore {
  const input = getContext<InputStore>(TAMBO_INPUT_KEY);
  if (!input) {
    throw new Error("Tambo input context not found.");
  }
  return input;
}

/**
 * Get just the status store
 */
export function useTamboStatus(): StreamStatusStore {
  const status = getContext<StreamStatusStore>(TAMBO_STATUS_KEY);
  if (!status) {
    throw new Error("Tambo status context not found.");
  }
  return status;
}

/**
 * Get just the registry store
 */
export function useTamboRegistry(): RegistryStore {
  const registry = getContext<RegistryStore>(TAMBO_REGISTRY_KEY);
  if (!registry) {
    throw new Error("Tambo registry context not found.");
  }
  return registry;
}
