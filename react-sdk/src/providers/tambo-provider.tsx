"use client";
import React, { PropsWithChildren, createContext, useContext } from "react";
import { TamboInteractableContext } from "../model/tambo-interactable";
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
  TamboContextHelpersContextProps,
  TamboContextHelpersProvider,
  TamboContextHelpersProviderProps,
  useTamboContextHelpers,
} from "./tambo-context-helpers-provider";
import {
  TamboInteractableProvider,
  useTamboInteractable,
} from "./tambo-interactable-provider";
import {
  TamboRegistryProvider,
  TamboRegistryProviderProps,
} from "./tambo-registry-provider";
import {
  TamboThreadInputProvider,
  TamboThreadInputProviderProps,
} from "./tambo-thread-input-provider";
import {
  TamboGenerationStageContextProps,
  TamboThreadContextProps,
  TamboThreadProvider,
  TamboThreadProviderProps,
  useTamboThread,
} from "./tambo-thread-provider";

/**
 * The TamboProvider gives full access to the whole Tambo API. This includes the
 * TamboAI client, the component registry, the current thread context, and interactable components.
 * @param props - The props for the TamboProvider
 * @param props.children - The children to wrap
 * @param props.tamboUrl - The URL of the Tambo API
 * @param props.apiKey - The API key for the Tambo API
 * @param props.components - The components to register
 * @param props.environment - The environment to use for the Tambo API
 * @param props.tools - The tools to register
 * @param props.streaming - Whether to stream the response by default. Defaults to true.
 * @param props.contextHelpers - Configuration for which context helpers are enabled/disabled
 * @param props.contextKey - Optional context key to be used in the thread input provider.
 * @param props.userToken - Optional user token to be used in the TamboClientProvider for requests to the Tambo API.
 * @returns The TamboProvider component
 */
export const TamboProvider: React.FC<
  PropsWithChildren<
    TamboClientProviderProps &
      TamboRegistryProviderProps &
      TamboThreadProviderProps &
      TamboContextHelpersProviderProps &
      TamboThreadInputProviderProps
  >
> = ({
  children,
  tamboUrl,
  apiKey,
  userToken,
  components,
  environment,
  tools,
  streaming,
  contextHelpers,
  contextKey,
}) => {
  // Should only be used in browser
  if (typeof window === "undefined") {
    console.error("TamboProvider must be used within a browser");
  }

  return (
    <TamboClientProvider
      tamboUrl={tamboUrl}
      apiKey={apiKey}
      environment={environment}
      userToken={userToken}
    >
      <TamboRegistryProvider components={components} tools={tools}>
        <TamboContextHelpersProvider contextHelpers={contextHelpers}>
          <TamboThreadProvider streaming={streaming}>
            <TamboThreadInputProvider contextKey={contextKey}>
              <TamboComponentProvider>
                <TamboInteractableProvider>
                  <TamboCompositeProvider>{children}</TamboCompositeProvider>
                </TamboInteractableProvider>
              </TamboComponentProvider>
            </TamboThreadInputProvider>
          </TamboThreadProvider>
        </TamboContextHelpersProvider>
      </TamboRegistryProvider>
    </TamboClientProvider>
  );
};

export type TamboContextProps = TamboClientContextProps &
  TamboThreadContextProps &
  TamboGenerationStageContextProps &
  TamboComponentContextProps &
  TamboInteractableContext &
  TamboContextHelpersContextProps;

export const TamboContext = createContext<TamboContextProps>(
  {} as TamboContextProps,
);

/**
 * TamboCompositeProvider is a provider that combines the TamboClient,
 * TamboThread, TamboComponent, and TamboInteractable providers
 * @param props - The props for the TamboCompositeProvider
 * @param props.children - The children to wrap
 * @returns The wrapped component
 */
export const TamboCompositeProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const threads = useTamboThread();
  const client = useTamboClient();
  const queryClient = useTamboQueryClient();
  const componentRegistry = useTamboComponent();
  const interactableComponents = useTamboInteractable();
  const contextHelpers = useTamboContextHelpers();

  return (
    <TamboContext.Provider
      value={{
        client,
        queryClient,
        ...componentRegistry,
        ...threads,
        ...interactableComponents,
        ...contextHelpers,
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
 * This includes the TamboAI client, the component registry, the current thread context,
 * and interactable component management.
 * @returns The Tambo API
 */
export const useTambo = () => {
  return useContext(TamboContext);
};
