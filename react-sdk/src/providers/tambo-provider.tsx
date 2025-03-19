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

/** TamboProvider gives full access to the TamboAI client and component registry */

export const TamboProvider: React.FC<
  PropsWithChildren<TamboClientProviderProps & TamboRegistryProviderProps>
> = ({ children, tamboUrl, apiKey, components, environment }) => {
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

/** TamboCompositeProvider is a provider that combines the TamboClient, TamboThread, and TamboComponent providers */
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

export const useTambo = () => {
  return useContext(TamboContext);
};
