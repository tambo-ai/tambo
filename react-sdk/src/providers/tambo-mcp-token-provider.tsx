"use client";
import React, {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { TamboClientContext } from "./tambo-client-provider";

export interface TamboMcpTokenContextProps {
  /**
   * The current MCP access token for the internal Tambo MCP server.
   */
  mcpAccessToken: string | null;
  /**
   * The base URL for the Tambo API (used to construct the MCP server URL)
   * Returns undefined if the client is not yet initialized
   */
  tamboBaseUrl: string | undefined;
}

const TamboMcpTokenContext = createContext<
  TamboMcpTokenContextProps | undefined
>(undefined);

/**
 * Provider for managing the MCP access token that is returned by the Tambo API.
 * This token is used to authenticate with the internal Tambo MCP server.
 *
 * Exposes the base URL and a null token by default. Token fetching is handled
 * by the useTamboMcpToken hook which supports contextKey-based token retrieval.
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
  const { client } = clientContext;
  const tamboBaseUrl = client.baseURL;

  const value = useMemo(
    () => ({ mcpAccessToken: null, tamboBaseUrl }),
    [tamboBaseUrl],
  );

  return (
    <TamboMcpTokenContext.Provider value={value}>
      {children}
    </TamboMcpTokenContext.Provider>
  );
};

/**
 * Hook to access the current MCP access token with optional token fetching.
 *
 * Token fetching logic:
 * - If contextKey is provided → fetches a token using that contextKey
 * - Otherwise → returns null
 * @param contextKey - Optional context key for fetching tokens
 * @returns The current MCP access token and base URL
 */
export const useTamboMcpToken = (
  contextKey?: string,
): TamboMcpTokenContextProps => {
  const context = useContext(TamboMcpTokenContext);
  if (context === undefined) {
    throw new Error(
      "useTamboMcpToken must be used within a TamboMcpTokenProvider",
    );
  }

  const clientContext = useContext(TamboClientContext);
  if (!clientContext) {
    throw new Error(
      "useTamboMcpToken must be used within a TamboClientProvider",
    );
  }
  const { client } = clientContext;

  // State for fetched token
  const [fetchedToken, setFetchedToken] = useState<string | null>(null);
  const hasAttemptedFetch = useRef(false);

  // Determine if we should fetch a token
  const shouldFetch = contextKey && !fetchedToken && !hasAttemptedFetch.current;

  // Fetch token when needed
  useEffect(() => {
    if (shouldFetch) {
      hasAttemptedFetch.current = true;
      const fetchToken = async () => {
        try {
          const response = await client.beta.auth.getMcpToken({ contextKey });
          if (response.mcpAccessToken) {
            setFetchedToken(response.mcpAccessToken);
          }
        } catch (error) {
          console.error("Failed to fetch MCP token:", error);
        }
      };
      void fetchToken();
    }
  }, [shouldFetch, client, contextKey]);

  const selectedToken = fetchedToken;

  return {
    mcpAccessToken: selectedToken,
    tamboBaseUrl: context.tamboBaseUrl,
  };
};
