import TamboAI, { ClientOptions } from "@tambo-ai/typescript-sdk";
import { QueryClient } from "@tanstack/react-query";
import React, { createContext, PropsWithChildren, useState } from "react";

export interface TamboClientProviderProps {
  /**
   * The URL of the Tambo API (used for local development and debugging)
   */
  tamboUrl?: string;
  /**
   * The API key for the Tambo API
   */
  apiKey: string;
  /**
   * The environment to use for the Tambo API
   */
  environment?: "production" | "staging";
}

export interface TamboClientContextProps {
  client: TamboAI;
  /** The tambo-specific query client */
  queryClient: QueryClient;
}

const TamboClientContext = createContext<TamboClientContextProps | undefined>(
  undefined,
);

/**
 * The TamboClientProvider is a React provider that provides a TamboAI client
 * and a query client to the descendants of the provider.
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
