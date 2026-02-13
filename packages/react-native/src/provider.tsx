import React, { createContext, useContext, useMemo, type ReactNode } from "react";
import { TamboClient } from "@tambo-ai/typescript-sdk";

export interface TamboContextValue {
  client: TamboClient;
}

export interface TamboProviderProps {
  apiKey: string;
  apiUrl?: string;
  children: ReactNode;
}

const TamboContext = createContext<TamboContextValue | null>(null);

/**
 * Access the Tambo context. Must be used within TamboProvider.
 */
export function useTamboContext(): TamboContextValue {
  const context = useContext(TamboContext);
  if (!context) {
    throw new Error(
      "useTamboContext must be used within a <TamboProvider>. " +
        "Wrap your app with <TamboProvider apiKey={...}>."
    );
  }
  return context;
}

/**
 * TamboProvider for React Native — provides the Tambo client
 * to all descendant components without any DOM dependencies.
 */
export function TamboProvider({ apiKey, apiUrl, children }: TamboProviderProps) {
  const value = useMemo<TamboContextValue>(() => {
    const client = new TamboClient({
      apiKey,
      ...(apiUrl ? { apiUrl } : {}),
    });
    return { client };
  }, [apiKey, apiUrl]);

  return <TamboContext.Provider value={value}>{children}</TamboContext.Provider>;
}
