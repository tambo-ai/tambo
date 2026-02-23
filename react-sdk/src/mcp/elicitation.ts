// Re-export types and functions from @tambo-ai/client
export type {
  ElicitationRequestedSchema,
  TamboElicitationRequest,
  TamboElicitationResponse,
  ElicitationContextState,
  PrimitiveSchemaDefinition,
} from "@tambo-ai/client";
export {
  toElicitationRequestedSchema,
  hasRequestedSchema,
} from "@tambo-ai/client";

// React-specific hook (not in client package)
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type {
  ClientNotification,
  ClientRequest,
  ElicitRequest,
  ElicitResult,
} from "@modelcontextprotocol/sdk/types.js";
import { useCallback, useState } from "react";
import type { MCPElicitationHandler } from "./mcp-client";
import type {
  TamboElicitationRequest,
  TamboElicitationResponse,
} from "@tambo-ai/client";
import {
  toElicitationRequestedSchema as toSchema,
  hasRequestedSchema as hasSchema,
} from "@tambo-ai/client";

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
        if (!hasSchema(request.params)) {
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
          requestedSchema: toSchema(request.params.requestedSchema),
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
