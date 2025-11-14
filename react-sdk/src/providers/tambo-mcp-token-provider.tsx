"use client";
import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useMemo,
} from "react";
import { TamboClientContext } from "./tambo-client-provider";

export interface TamboMcpTokenContextProps {
  /**
   * The current MCP access token for the internal Tambo MCP server
   */
  mcpAccessToken: string | null;
  /**
   * The base URL for the Tambo API (used to construct the MCP server URL)
   * Returns undefined if the client is not yet initialized
   */
  tamboBaseUrl: string | undefined;
  /**
   * Update the MCP access token (for internal use by TamboThreadProvider)
   * @internal
   */
  setMcpAccessToken: (token: string | null) => void;
}

const TamboMcpTokenContext = createContext<
  TamboMcpTokenContextProps | undefined
>(undefined);

/**
 * Provider for managing the MCP access token that is returned by the Tambo API.
 * This token is used to authenticate with the internal Tambo MCP server.
 * The base URL is derived from the TamboClient's baseURL property.
 *
 * **NOTE**: This provider now delegates token state management to TamboClientProvider.
 * It exists primarily for backward compatibility and to add the tamboBaseUrl.
 * @internal
 * @param props - The provider props
 * @param props.children - The children to wrap
 * @returns The TamboMcpTokenProvider component
 */
export const TamboMcpTokenProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const clientContext = useContext(TamboClientContext);
  if (!clientContext) {
    throw new Error(
      "TamboMcpTokenProvider must be used within a TamboClientProvider",
    );
  }
  const { client, mcpAccessToken, setMcpAccessToken } = clientContext;
  const tamboBaseUrl = client.baseURL;

  const value = useMemo(
    () => ({ mcpAccessToken, tamboBaseUrl, setMcpAccessToken }),
    [mcpAccessToken, tamboBaseUrl, setMcpAccessToken],
  );

  return (
    <TamboMcpTokenContext.Provider value={value}>
      {children}
    </TamboMcpTokenContext.Provider>
  );
};

/**
 * Hook to access the current MCP access token.
 * @internal
 * @returns The current MCP access token and a setter function
 */
export const useTamboMcpToken = (): TamboMcpTokenContextProps => {
  const context = useContext(TamboMcpTokenContext);
  if (context === undefined) {
    throw new Error(
      "useTamboMcpToken must be used within a TamboMcpTokenProvider",
    );
  }
  return context;
};
