"use client";
import React, { PropsWithChildren, createContext, useContext } from "react";
import {
  TamboClientContextProps,
  TamboClientProvider,
  TamboClientProviderProps,
  useTamboClient,
  useTamboQueryClient,
} from "./tambo-client-provider";
import {
  TamboComponentContextProps,
  TamboComponentProvider,
  useTamboComponent,
} from "./tambo-component-provider";
import {
  TamboRegistryProvider,
  TamboRegistryProviderProps,
} from "./tambo-registry-provider";
import {
  TamboThreadContextProps,
  TamboThreadProvider,
  useTamboThread,
} from "./tambo-thread-provider";

/**
 * The TamboProvider gives full access to the whole Tambo API. This includes the
 * TamboAI client, the component registry, and the current thread context.
 * @param props - The props for the TamboProvider
 * @param props.children - The children to wrap
 * @param props.tamboUrl - The URL of the Tambo API
 * @param props.apiKey - The API key for the Tambo API
 * @param props.components - The components to register
 * @param props.environment - The environment to use for the Tambo API
 * @returns The TamboProvider component
 */
export const TamboProvider: React.FC<
  PropsWithChildren<TamboClientProviderProps & TamboRegistryProviderProps>
> = ({ children, tamboUrl, apiKey, components, environment }) => {
  // Should only be used in browser
  if (typeof window === "undefined") {
    console.error("TamboProvider must be used within a browser");
  }

  return (
    <TamboClientProvider
      tamboUrl={tamboUrl}
      apiKey={apiKey}
      environment={environment}
    >
      <TamboRegistryProvider components={components}>
        <TamboThreadProvider>
          <TamboComponentProvider>
            <TamboCompositeProvider>{children}</TamboCompositeProvider>
          </TamboComponentProvider>
        </TamboThreadProvider>
      </TamboRegistryProvider>
    </TamboClientProvider>
  );
};
type TamboContextProps = TamboClientContextProps &
  TamboThreadContextProps &
  TamboComponentContextProps;

export const TamboContext = createContext<TamboContextProps>(
  {} as TamboContextProps,
);

/**
 * TamboCompositeProvider is a provider that combines the TamboClient,
 * TamboThread, and TamboComponent providers
 * @param props - The props for the TamboCompositeProvider
 * @param props.children - The children to wrap
 * @returns The wrapped component
 */
const TamboCompositeProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const threads = useTamboThread();
  const client = useTamboClient();
  const queryClient = useTamboQueryClient();
  const componentRegistry = useTamboComponent();

  return (
    <TamboContext.Provider
      value={{
        client,
        queryClient,
        ...componentRegistry,
        ...threads,
      }}
    >
      {children}
    </TamboContext.Provider>
  );
};

/**
 * The useTambo hook provides access to the Tambo API. This is the primary entrypoint
 * for the Tambo React SDK.
 *
 * This includes the TamboAI client, the component registry, and the current thread context.
 * @returns The Tambo API
 */
export const useTambo = () => {
  return useContext(TamboContext);
};
