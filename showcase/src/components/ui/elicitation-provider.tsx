"use client";

import * as React from "react";
import type { ElicitationRequest, ElicitationResponse } from "./elicitation-ui";

/**
 * Context value for elicitation state
 */
interface ElicitationContextValue {
  elicitation: ElicitationRequest | null;
  setElicitation: React.Dispatch<
    React.SetStateAction<ElicitationRequest | null>
  >;
  resolveElicitation: ((response: ElicitationResponse) => void) | null;
  setResolveElicitation: React.Dispatch<
    React.SetStateAction<((response: ElicitationResponse) => void) | null>
  >;
}

const ElicitationContext = React.createContext<ElicitationContextValue | null>(
  null,
);

/**
 * Hook to access elicitation context.
 * Returns null if not within an ElicitationProvider.
 */
export const useElicitationContext = () => {
  return React.useContext(ElicitationContext);
};

/**
 * Provider that manages elicitation state and provides a handler for TamboMcpProvider
 */
export const ElicitationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [elicitation, setElicitation] =
    React.useState<ElicitationRequest | null>(null);
  const [resolveElicitation, setResolveElicitation] = React.useState<
    ((response: ElicitationResponse) => void) | null
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
    <ElicitationContext.Provider value={value}>
      {children}
    </ElicitationContext.Provider>
  );
};

/**
 * Hook to create an elicitation handler that can be passed to TamboMcpProvider.
 * Must be used within an ElicitationProvider.
 * @returns An elicitation handler function
 * @example
 * ```tsx
 * function MyComponent() {
 *   const elicitationHandler = useElicitationHandler();
 *
 *   return (
 *     <ElicitationProvider>
 *       <TamboMcpProvider
 *         mcpServers={[...]}
 *         handlers={{ elicitation: elicitationHandler }}
 *       >
 *         <MessageInput>
 *           <MessageInputTextarea />
 *           <MessageInputSubmitButton />
 *         </MessageInput>
 *       </TamboMcpProvider>
 *     </ElicitationProvider>
 *   );
 * }
 * ```
 */
export const useElicitationHandler = () => {
  const context = useElicitationContext();
  if (!context) {
    throw new Error(
      "useElicitationHandler must be used within an ElicitationProvider",
    );
  }
  const { setElicitation, setResolveElicitation } = context;

  return React.useCallback(
    async (request: {
      params: {
        message: string;
        requestedSchema: ElicitationRequest["requestedSchema"];
      };
    }) => {
      return await new Promise<ElicitationResponse>((resolve) => {
        // Set the elicitation request to show the UI
        setElicitation({
          message: request.params.message,
          requestedSchema: request.params.requestedSchema,
        });

        // Store the resolve function so we can call it when the user responds
        setResolveElicitation(() => (response: ElicitationResponse) => {
          resolve(response);
        });
      });
    },
    [setElicitation, setResolveElicitation],
  );
};
