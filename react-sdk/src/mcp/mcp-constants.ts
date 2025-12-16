/**
 * Prefix used by the internal Tambo MCP server.
 * Resources with this prefix can be resolved by the backend.
 */
export const INTERNAL_SERVER_PREFIX = "tambo-";

/**
 * Synthetic server key for local registry resources.
 * Used to give registry resources the same @serverKey:uri format as MCP resources.
 */
export const REGISTRY_SERVER_KEY = "registry";
