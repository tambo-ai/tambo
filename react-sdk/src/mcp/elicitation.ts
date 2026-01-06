import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type {
  ElicitRequestFormParams,
  PrimitiveSchemaDefinition,
} from "@modelcontextprotocol/sdk/spec.types.js";
import type {
  ClientNotification,
  ClientRequest,
  ElicitRequest,
  ElicitResult,
} from "@modelcontextprotocol/sdk/types.js";
import { useCallback, useState } from "react";
import { MCPElicitationHandler } from "./mcp-client";

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
function toElicitationRequestedSchema(
  value: ElicitRequestParamsWithRequestedSchema["requestedSchema"],
): ElicitationRequestedSchema {
  return value as ElicitationRequestedSchema;
}

/**
 * Type guard for the elicitation form params shape.
 * @returns true when params include requestedSchema
 */
function hasRequestedSchema(
  params: ElicitRequest["params"],
): params is ElicitRequestParamsWithRequestedSchema {
  return "requestedSchema" in params;
}

/**
 * Internal hook that manages elicitation state and creates a default handler.
 * This bundles all the state management and handler creation for elicitation.
 *
 * Do not export this hook from this package. It is only intended to be used internally by the TamboMcpProvider.
 * @returns Elicitation state and default handler
 */
export function useElicitation() {
  const [elicitation, setElicitation] =
    useState<TamboElicitationRequest | null>(null);
  const [resolveElicitation, setResolveElicitation] = useState<
    ((response: TamboElicitationResponse) => void) | null
  >(null);

  const defaultElicitationHandler: MCPElicitationHandler = useCallback(
    async (
      request: ElicitRequest,
      extra: RequestHandlerExtra<ClientRequest, ClientNotification>,
    ): Promise<ElicitResult> => {
      return await new Promise<ElicitResult>((resolve, reject) => {
        if (!hasRequestedSchema(request.params)) {
          const mode =
            "mode" in request.params ? String(request.params.mode) : "unknown";

          reject(
            new Error(
              `Unsupported MCP elicitation params: expected requestedSchema (form mode), got mode=${mode}`,
            ),
          );
          return;
        }

        // Set the elicitation request to show the UI
        // Cast is needed because ElicitRequest uses Zod-inferred types (from the
        // user's installed zod version), while we use pure TypeScript spec types
        // for cross-version compatibility
        setElicitation({
          message: request.params.message,
          requestedSchema: toElicitationRequestedSchema(
            request.params.requestedSchema,
          ),
          signal: extra.signal,
        });

        // If the signal is already aborted, reject immediately
        if (extra.signal.aborted) {
          setElicitation(null);
          reject(new Error("Request aborted"));
          return;
        }

        // Listen for abort signal to clean up
        const handleAbort = () => {
          setElicitation(null);
          setResolveElicitation(null);
          reject(new Error("Request aborted"));
        };

        extra.signal.addEventListener("abort", handleAbort, { once: true });

        // Store the resolve function so we can call it when the user responds
        setResolveElicitation(() => (response: ElicitResult) => {
          // Remove abort listener since we're resolving normally
          extra.signal.removeEventListener("abort", handleAbort);
          // Clear state now that user has responded
          setElicitation(null);
          setResolveElicitation(null);
          resolve(response);
        });
      });
    },
    [],
  );

  return {
    elicitation,
    setElicitation,
    resolveElicitation,
    setResolveElicitation,
    defaultElicitationHandler,
  };
}
