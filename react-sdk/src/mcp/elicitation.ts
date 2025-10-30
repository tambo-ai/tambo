import { useMemo, useState } from "react";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type {
  ClientNotification,
  ClientRequest,
} from "@modelcontextprotocol/sdk/types.js";

/**
 * JSON Schema types for elicitation fields
 */
interface BaseFieldSchema {
  type: "string" | "number" | "integer" | "boolean";
  description?: string;
  default?: unknown;
}

interface StringFieldSchema extends BaseFieldSchema {
  type: "string";
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: "email" | "uri" | "date" | "date-time";
  enum?: string[];
  enumNames?: string[];
}

interface NumberFieldSchema extends BaseFieldSchema {
  type: "number" | "integer";
  minimum?: number;
  maximum?: number;
}

interface BooleanFieldSchema extends BaseFieldSchema {
  type: "boolean";
}

type FieldSchema = StringFieldSchema | NumberFieldSchema | BooleanFieldSchema;

/**
 * Elicitation request from MCP server
 */
export interface TamboElicitationRequest {
  message: string;
  requestedSchema: {
    type: "object";
    properties: Record<string, FieldSchema>;
    required?: string[];
  };
  /** AbortSignal that fires when the server cancels the request (e.g., timeout) */
  signal?: AbortSignal;
}

/**
 * Elicitation response to be sent back
 */
export interface TamboElicitationResponse {
  action: "accept" | "decline" | "cancel";
  content?: Record<string, unknown>;
  [x: string]: unknown;
}

/**
 * Elicitation context state
 */
export interface ElicitationContextState {
  elicitation: TamboElicitationRequest | null;
  setElicitation: React.Dispatch<
    React.SetStateAction<TamboElicitationRequest | null>
  >;
  resolveElicitation: ((response: TamboElicitationResponse) => void) | null;
  setResolveElicitation: React.Dispatch<
    React.SetStateAction<((response: TamboElicitationResponse) => void) | null>
  >;
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

  const defaultElicitationHandler = useMemo(
    () =>
      async (
        request: {
          params: {
            message: string;
            requestedSchema: TamboElicitationRequest["requestedSchema"];
          };
        },
        extra: RequestHandlerExtra<ClientRequest, ClientNotification>,
      ): Promise<TamboElicitationResponse> => {
        return await new Promise<TamboElicitationResponse>(
          (resolve, reject) => {
            // Set the elicitation request to show the UI
            setElicitation({
              message: request.params.message,
              requestedSchema: request.params.requestedSchema,
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
            setResolveElicitation(
              () => (response: TamboElicitationResponse) => {
                // Remove abort listener since we're resolving normally
                extra.signal.removeEventListener("abort", handleAbort);
                resolve(response);
              },
            );
          },
        );
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
