"use client";
import TamboAI, { ClientOptions } from "@tambo-ai/typescript-sdk";
import { QueryClient } from "@tanstack/react-query";
import React, { createContext, PropsWithChildren, useMemo } from "react";
import packageJson from "../../package.json";
import { useTamboSessionToken } from "./hooks/use-tambo-session-token";

export interface TamboClientProviderProps {
  /**
   * The URL of the Tambo API (only used for local development and debugging)
   */
  tamboUrl?: string;
  /**
   * The API key for the Tambo API. This typically comes from a variable like
   * `process.env.NEXT_PUBLIC_TAMBO_API_KEY`
   */
  apiKey: string;
  /**
   * The environment to use for the Tambo API
   */
  environment?: "production" | "staging";

  /**
   * The user token to use to identify the user in the Tambo API. This token is
   * a 3rd party token like a Google or GitHub access token, exchanged with the
   * Tambo API to get a session token. This is used to securely identify the
   * user when calling the Tambo API.
   */
  userToken?: string;

  /**
   * Additional headers to include in all requests to the Tambo API.
   * These will be merged with the default headers.
   */
  additionalHeaders?: Record<string, string>;
}

export interface TamboClientContextProps {
  /** The TamboAI client */
  client: TamboAI;
  /** The tambo-specific query client */
  queryClient: QueryClient;
  /** Whether the session token is currently being updated */
  isUpdatingToken: boolean;
  /** Additional headers to include in all requests */
  additionalHeaders?: Record<string, string>;
}

export const TamboClientContext = createContext<
  TamboClientContextProps | undefined
>(undefined);

/**
 * The TamboClientProvider is a React provider that provides a TamboAI client
 * and a query client to the descendants of the provider.
 * @param props - The props for the TamboClientProvider
 * @param props.children - The children to wrap
 * @param props.tamboUrl - The URL of the Tambo API
 * @param props.apiKey - The API key for the Tambo API
 * @param props.environment - The environment to use for the Tambo API
 * @param props.userToken - The oauth access token to use to identify the user in the Tambo API
 * @param props.additionalHeaders - Additional headers to include in all requests
 * @returns The TamboClientProvider component
 */
export const TamboClientProvider: React.FC<
  PropsWithChildren<TamboClientProviderProps>
> = ({
  children,
  tamboUrl,
  apiKey,
  environment,
  userToken,
  additionalHeaders,
}) => {
  const tamboConfig = useMemo(
    () =>
      ({
        apiKey,
        defaultHeaders: {
          "X-Tambo-React-Version": packageJson.version,
          ...additionalHeaders,
        },
        baseURL: tamboUrl ?? undefined,
        environment: environment ?? undefined,
      }) satisfies ClientOptions,
    [additionalHeaders, apiKey, tamboUrl, environment],
  );

  const client = useMemo(() => new TamboAI(tamboConfig), [tamboConfig]);
  const queryClient = useMemo(() => new QueryClient(), []);

  // Keep the session token updated and get the updating state
  const { isFetching: isUpdatingToken } = useTamboSessionToken(
    client,
    queryClient,
    userToken,
  );

  return (
    <TamboClientContext.Provider
      value={{
        client,
        queryClient,
        isUpdatingToken,
        additionalHeaders: tamboConfig.defaultHeaders,
      }}
    >
      {children}
    </TamboClientContext.Provider>
  );
};

/**
 * The useTamboClient hook provides access to the TamboAI client
 * to the descendants of the TamboClientProvider.
 * @returns The TamboAI client
 */
export const useTamboClient = () => {
  const context = React.useContext(TamboClientContext);
  if (context === undefined) {
    throw new Error("useTamboClient must be used within a TamboClientProvider");
  }
  return context.client;
};

/**
 * The useTamboQueryClient hook provides access to the tambo-specific query client
 * to the descendants of the TamboClientProvider.
 * @returns The tambo-specific query client
 * @private
 */
export const useTamboQueryClient = () => {
  const context = React.useContext(TamboClientContext);
  if (context === undefined) {
    throw new Error(
      "useTamboQueryClient must be used within a TamboClientProvider",
    );
  }
  return context.queryClient;
};

/**
 * Hook to check if the session token is currently being updated
 * @returns true if the token is being refreshed, false otherwise
 */
export const useIsTamboTokenUpdating = () => {
  const context = React.useContext(TamboClientContext);
  if (context === undefined) {
    throw new Error(
      "useIsTamboTokenUpdating must be used within a TamboClientProvider",
    );
  }
  return context.isUpdatingToken;
};
