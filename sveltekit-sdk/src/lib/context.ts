/**
 * Context keys for Svelte context API.
 * Each key is a unique symbol to prevent collisions.
 */

export const TAMBO_CLIENT_KEY = Symbol("tambo-client");
export const TAMBO_THREAD_KEY = Symbol("tambo-thread");
export const TAMBO_REGISTRY_KEY = Symbol("tambo-registry");
export const TAMBO_INPUT_KEY = Symbol("tambo-input");
export const TAMBO_STATUS_KEY = Symbol("tambo-status");
export const TAMBO_INTERACTABLE_KEY = Symbol("tambo-interactable");
export const TAMBO_MESSAGE_KEY = Symbol("tambo-message");
export const TAMBO_CONFIG_KEY = Symbol("tambo-config");
export const TAMBO_MCP_KEY = Symbol("tambo-mcp");
export const TAMBO_CONTEXT_HELPERS_KEY = Symbol("tambo-context-helpers");

/**
 * Context types for type-safe context access
 */
export interface TamboContextKeys {
  client: typeof TAMBO_CLIENT_KEY;
  thread: typeof TAMBO_THREAD_KEY;
  registry: typeof TAMBO_REGISTRY_KEY;
  input: typeof TAMBO_INPUT_KEY;
  status: typeof TAMBO_STATUS_KEY;
  interactable: typeof TAMBO_INTERACTABLE_KEY;
  message: typeof TAMBO_MESSAGE_KEY;
  config: typeof TAMBO_CONFIG_KEY;
  mcp: typeof TAMBO_MCP_KEY;
  contextHelpers: typeof TAMBO_CONTEXT_HELPERS_KEY;
}

export const CONTEXT_KEYS: TamboContextKeys = {
  client: TAMBO_CLIENT_KEY,
  thread: TAMBO_THREAD_KEY,
  registry: TAMBO_REGISTRY_KEY,
  input: TAMBO_INPUT_KEY,
  status: TAMBO_STATUS_KEY,
  interactable: TAMBO_INTERACTABLE_KEY,
  message: TAMBO_MESSAGE_KEY,
  config: TAMBO_CONFIG_KEY,
  mcp: TAMBO_MCP_KEY,
  contextHelpers: TAMBO_CONTEXT_HELPERS_KEY,
};
