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
import {
  PLACEHOLDER_THREAD,
  TamboThreadContext,
} from "./tambo-thread-provider";

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
 * - Returns the current thread's mcpAccessToken if available
 * - Returns null if no thread or thread has no token
 *
 * Token fetching:
 * - Thread-specific token: always fetched when switching to thread without token
 * - Tokens are fetched regardless of client-side MCP server configuration
 *   to support server-side MCP servers that are not visible to the provider
 * - Threadless tokens must be fetched by individual hooks/callbacks using contextKey
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

  // Optional thread context - may not be available in all contexts
  const threadContext = useContext(TamboThreadContext);
  const currentThread = threadContext?.currentThread ?? null;
  const currentThreadId = threadContext?.currentThreadId ?? null;
  const setThreadMap = useMemo(
    () => threadContext?.setThreadMap ?? (() => {}),
    [threadContext?.setThreadMap],
  );

  // Track previous thread ID to detect thread switches
  const previousThreadId = useRef<string | null>(null);

  // Return the current thread's token or null
  const selectedToken = useMemo(() => {
    return currentThread?.mcpAccessToken ?? null;
  }, [currentThread]);

  // Fetch thread-specific token when switching to a thread without one
  // Always fetch to support server-side MCP servers (not just client-side)
  // Skip PLACEHOLDER_THREAD - never send it to the server
  useEffect(() => {
    const hasThreadChanged = previousThreadId.current !== currentThreadId;
    previousThreadId.current = currentThreadId;

    const isPlaceholderThread = currentThreadId === PLACEHOLDER_THREAD.id;
    const shouldFetchThreadToken =
      hasThreadChanged &&
      currentThreadId &&
      !isPlaceholderThread &&
      currentThread &&
      !currentThread.mcpAccessToken;

    if (shouldFetchThreadToken) {
      const fetchThreadToken = async () => {
        try {
          const response = await client.beta.auth.getMcpToken({
            threadId: currentThreadId,
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
  }, [currentThreadId, currentThread, client, setThreadMap]);

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
 * Hook to access the current MCP access token with optional threadless token fetching.
 *
 * Token selection logic:
 * 1. If current thread has mcpAccessToken → use thread-specific token
 * 2. Else if contextKey provided and no thread (or placeholder thread) → fetch and use threadless token
 * 3. Else → null
 * @param contextKey - Optional context key for fetching threadless tokens when not in a thread
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

  const threadContext = useContext(TamboThreadContext);
  const currentThreadId = threadContext?.currentThreadId ?? null;

  // State for threadless token
  const [threadlessToken, setThreadlessToken] = useState<string | null>(null);
  const hasAttemptedFetch = useRef(false);

  // Determine if we should fetch a threadless token
  const isPlaceholderThread = currentThreadId === PLACEHOLDER_THREAD.id;
  const shouldFetchThreadless =
    contextKey &&
    (!currentThreadId || isPlaceholderThread) &&
    !context.mcpAccessToken &&
    !threadlessToken &&
    !hasAttemptedFetch.current;

  // Fetch threadless token when needed
  useEffect(() => {
    if (shouldFetchThreadless) {
      hasAttemptedFetch.current = true;
      const fetchThreadlessToken = async () => {
        try {
          const response = await client.beta.auth.getMcpToken({ contextKey });
          if (response.mcpAccessToken) {
            setThreadlessToken(response.mcpAccessToken);
          }
        } catch (error) {
          console.error("Failed to fetch threadless MCP token:", error);
        }
      };
      void fetchThreadlessToken();
    }
  }, [shouldFetchThreadless, client, contextKey]);

  // Reset threadless token when switching to a real thread
  useEffect(() => {
    if (currentThreadId && currentThreadId !== PLACEHOLDER_THREAD.id) {
      setThreadlessToken(null);
      hasAttemptedFetch.current = false;
    }
  }, [currentThreadId]);

  // Return thread token if available, otherwise threadless token
  const selectedToken = context.mcpAccessToken ?? threadlessToken;

  return {
    mcpAccessToken: selectedToken,
    tamboBaseUrl: context.tamboBaseUrl,
  };
};
