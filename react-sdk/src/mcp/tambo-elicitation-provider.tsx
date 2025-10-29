"use client";

import * as React from "react";

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
 * Context value for elicitation state
 */
interface TamboElicitationContextValue {
  elicitation: TamboElicitationRequest | null;
  setElicitation: React.Dispatch<
    React.SetStateAction<TamboElicitationRequest | null>
  >;
  resolveElicitation: ((response: TamboElicitationResponse) => void) | null;
  setResolveElicitation: React.Dispatch<
    React.SetStateAction<((response: TamboElicitationResponse) => void) | null>
  >;
}

const TamboElicitationContext =
  React.createContext<TamboElicitationContextValue | null>(null);

/**
 * Hook to access elicitation context.
 * Returns null if not within a TamboElicitationProvider.
 */
export const useTamboElicitationContext = () => {
  return React.useContext(TamboElicitationContext);
};

/**
 * Provider that manages elicitation state and provides a handler for TamboMcpProvider
 */
export const TamboElicitationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [elicitation, setElicitation] =
    React.useState<TamboElicitationRequest | null>(null);
  const [resolveElicitation, setResolveElicitation] = React.useState<
    ((response: TamboElicitationResponse) => void) | null
  >(null);

  const value = React.useMemo(
    () => ({
      elicitation,
      setElicitation,
      resolveElicitation,
      setResolveElicitation,
    }),
    [elicitation, resolveElicitation],
  );

  return (
    <TamboElicitationContext.Provider value={value}>
      {children}
    </TamboElicitationContext.Provider>
  );
};

/**
 * Hook to create an elicitation handler that can be passed to TamboMcpProvider.
 * Must be used within a TamboElicitationProvider.
 * @returns An elicitation handler function
 * @example
 * ```tsx
 * function MyComponent() {
 *   const elicitationHandler = useTamboElicitationHandler();
 *
 *   return (
 *     <TamboElicitationProvider>
 *       <TamboMcpProvider
 *         mcpServers={[...]}
 *         handlers={{ elicitation: elicitationHandler }}
 *       >
 *         <MessageInput>
 *           <MessageInputTextarea />
 *           <MessageInputSubmitButton />
 *         </MessageInput>
 *       </TamboMcpProvider>
 *     </TamboElicitationProvider>
 *   );
 * }
 * ```
 */
export const useTamboElicitationHandler = () => {
  const context = useTamboElicitationContext();
  if (!context) {
    throw new Error(
      "useTamboElicitationHandler must be used within a TamboElicitationProvider",
    );
  }
  const { setElicitation, setResolveElicitation } = context;

  return React.useCallback(
    async (request: {
      params: {
        message: string;
        requestedSchema: TamboElicitationRequest["requestedSchema"];
      };
    }) => {
      return await new Promise<TamboElicitationResponse>((resolve) => {
        // Set the elicitation request to show the UI
        setElicitation({
          message: request.params.message,
          requestedSchema: request.params.requestedSchema,
        });

        // Store the resolve function so we can call it when the user responds
        setResolveElicitation(() => (response: TamboElicitationResponse) => {
          resolve(response);
        });
      });
    },
    [setElicitation, setResolveElicitation],
  );
};
