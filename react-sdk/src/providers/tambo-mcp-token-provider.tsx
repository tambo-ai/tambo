"use client";
import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useState,
} from "react";
import { useTamboClient } from "./tambo-client-provider";

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
 * @internal
 * @param props - The provider props
 * @param props.children - The children to wrap
 * @returns The TamboMcpTokenProvider component
 */
export const TamboMcpTokenProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [mcpAccessToken, setMcpAccessToken] = useState<string | null>(null);
  const client = useTamboClient();

  // Get the base URL from the client. If not available, return undefined.
  let tamboBaseUrl: string | undefined;
  try {
    tamboBaseUrl = client.baseURL;
  } catch {
    // Client not yet initialized
    tamboBaseUrl = undefined;
  }

  return (
    <TamboMcpTokenContext.Provider
      value={{ mcpAccessToken, tamboBaseUrl, setMcpAccessToken }}
    >
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
