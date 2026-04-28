import type {
  ElicitRequestFormParams,
  PrimitiveSchemaDefinition,
} from "@modelcontextprotocol/sdk/spec.types.js";
import type { ElicitRequest } from "@modelcontextprotocol/sdk/types.js";

/**
 * Schema type for elicitation request fields
 */
export type ElicitationRequestedSchema =
  ElicitRequestFormParams["requestedSchema"];

/**
 * Elicitation request from MCP server
 */
export interface TamboElicitationRequest {
  message: string;
  requestedSchema: ElicitationRequestedSchema;
  /** AbortSignal that fires when the server cancels the request (e.g., timeout) */
  signal?: AbortSignal;
}

/**
 * Re-export PrimitiveSchemaDefinition for consumers that need to work with schema fields
 */
export type { PrimitiveSchemaDefinition };

type ElicitRequestParamsWithRequestedSchema = Extract<
  ElicitRequest["params"],
  { requestedSchema: unknown }
>;

/**
 * Elicitation response to be sent back
 */
export interface TamboElicitationResponse {
  action: "accept" | "decline" | "cancel";
  content?: Record<string, unknown>;
  [x: string]: unknown;
}

/**
 * Elicitation context state - read-only interface for consumers.
 * State management is handled internally by useElicitation hook.
 */
export interface ElicitationContextState {
  /** Current elicitation request, or null if none active */
  elicitation: TamboElicitationRequest | null;
  /** Function to call when user responds to elicitation (clears state automatically) */
  resolveElicitation: ((response: TamboElicitationResponse) => void) | null;
}

/**
 * Narrow the runtime ElicitRequest requestedSchema into the public
 * ElicitationRequestedSchema type.
 *
 * The MCP SDK guarantees that the runtime
 * `ElicitRequest["params"]["requestedSchema"]` shape stays aligned with the
 * spec-defined `ElicitRequestFormParams["requestedSchema"]`. This helper
 * centralizes the cast based on that contract so that if a future SDK version
 * ever diverges, we have a single place to tighten the implementation (for
 * example with structural validation or normalization).
 * @returns requestedSchema as ElicitationRequestedSchema
 */
export function toElicitationRequestedSchema(
  value: ElicitRequestParamsWithRequestedSchema["requestedSchema"],
): ElicitationRequestedSchema {
  return value;
}

/**
 * Type guard for the elicitation form params shape.
 * @returns true when params include requestedSchema
 */
export function hasRequestedSchema(
  params: ElicitRequest["params"],
): params is ElicitRequestParamsWithRequestedSchema {
  return "requestedSchema" in params;
}
