"use client";
import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { TamboThread } from "../model/tambo-thread";
import { TamboClientContext } from "./tambo-client-provider";
import { useTamboMcpServerInfos } from "./tambo-registry-provider";
import { useTamboThread } from "./tambo-thread-provider";

export interface TamboMcpTokenContextProps {
  /**
   * The current MCP access token for the internal Tambo MCP server.
   * Prefers thread-specific token over threadless token.
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
 * Token selection logic:
 * 1. If current thread has mcpAccessToken → use thread-specific token
 * 2. Else if threadless token exists → use threadless token
 * 3. Else → null
 *
 * Token fetching:
 * - Threadless token: fetched when MCP servers configured and no current thread
 * - Thread-specific token: fetched when switching to thread without token
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
  const { client, contextKey } = clientContext;
  const tamboBaseUrl = client.baseURL;

  const mcpServerInfos = useTamboMcpServerInfos();
  const { currentThread, currentThreadId, setThreadMap } = useTamboThread();

  // Threadless token state (only used when no current thread)
  const [threadlessMcpToken, setThreadlessMcpToken] = useState<string | null>(
    null,
  );

  // Track if we've already fetched threadless token to avoid duplicate fetches
  const hasAttemptedThreadlessFetch = useRef(false);
  // Track previous thread ID to detect thread switches
  const previousThreadId = useRef<string | null>(null);

  const hasMcpServers = mcpServerInfos.length > 0;

  // Select the appropriate token: prefer thread-specific over threadless
  const selectedToken = useMemo(() => {
    if (currentThread?.mcpAccessToken) {
      return currentThread.mcpAccessToken;
    }
    return threadlessMcpToken;
  }, [currentThread?.mcpAccessToken, threadlessMcpToken]);

  // Effect 1: Fetch threadless token on mount when no current thread
  useEffect(() => {
    if (
      hasMcpServers &&
      !currentThreadId &&
      !threadlessMcpToken &&
      !hasAttemptedThreadlessFetch.current
    ) {
      hasAttemptedThreadlessFetch.current = true;
      const fetchThreadlessToken = async () => {
        try {
          const response = await client.beta.auth.getMcpToken({ contextKey });
          if (response.mcpAccessToken) {
            setThreadlessMcpToken(response.mcpAccessToken);
          }
        } catch (error) {
          console.error("Failed to fetch threadless MCP token:", error);
        }
      };
      void fetchThreadlessToken();
    }
  }, [hasMcpServers, currentThreadId, threadlessMcpToken, client, contextKey]);

  // Effect 2: Fetch thread-specific token when switching to a thread without one
  useEffect(() => {
    const hasThreadChanged = previousThreadId.current !== currentThreadId;
    previousThreadId.current = currentThreadId;

    if (
      hasMcpServers &&
      hasThreadChanged &&
      currentThreadId &&
      currentThread &&
      !currentThread.mcpAccessToken
    ) {
      const fetchThreadToken = async () => {
        try {
          const response = await client.beta.auth.getMcpToken({
            threadId: currentThreadId,
            contextKey,
          });
          if (response.mcpAccessToken) {
            // Update thread in threadMap with new token
            setThreadMap((prev: Record<string, TamboThread>) => {
              const thread = prev[currentThreadId];
              if (thread) {
                return {
                  ...prev,
                  [currentThreadId]: {
                    ...thread,
                    mcpAccessToken: response.mcpAccessToken,
                  },
                };
              }
              return prev;
            });
          }
        } catch (error) {
          console.error(
            `Failed to fetch MCP token for thread ${currentThreadId}:`,
            error,
          );
        }
      };
      void fetchThreadToken();
    }
  }, [
    hasMcpServers,
    currentThreadId,
    currentThread,
    client,
    contextKey,
    setThreadMap,
  ]);

  const value = useMemo(
    () => ({ mcpAccessToken: selectedToken, tamboBaseUrl }),
    [selectedToken, tamboBaseUrl],
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
 * @returns The current MCP access token and base URL
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
