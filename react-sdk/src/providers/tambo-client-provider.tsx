"use client";
import TamboAI, { ClientOptions } from "@tambo-ai/typescript-sdk";
import { QueryClient } from "@tanstack/react-query";
import React, { createContext, PropsWithChildren, useState } from "react";

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
}

export interface TamboClientContextProps {
  /** The TamboAI client */
  client: TamboAI;
  /** The tambo-specific query client */
  queryClient: QueryClient;
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
 * @returns The TamboClientProvider component
 */
export const TamboClientProvider: React.FC<
  PropsWithChildren<TamboClientProviderProps>
> = ({ children, tamboUrl, apiKey, environment }) => {
  const tamboConfig: ClientOptions = { apiKey };
  if (tamboUrl) {
    tamboConfig.baseURL = tamboUrl;
  }
  if (environment) {
    tamboConfig.environment = environment;
  }
  const [client] = useState(() => new TamboAI(tamboConfig));
  const [queryClient] = useState(() => new QueryClient());
  return (
    <TamboClientContext.Provider value={{ client, queryClient }}>
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
