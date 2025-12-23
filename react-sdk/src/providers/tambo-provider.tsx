"use client";
import React, { PropsWithChildren, createContext, useContext } from "react";
import { TamboMcpProvider } from "../mcp/tambo-mcp-provider";
import { TamboInteractableContext } from "../model/tambo-interactable";
import {
  TamboClientContext,
  TamboClientContextProps,
  TamboClientProvider,
  TamboClientProviderProps,
} from "./tambo-client-provider";
import {
  TamboComponentContextProps,
  TamboComponentProvider,
  useTamboComponent,
} from "./tambo-component-provider";
import {
  ContextAttachmentState,
  TamboContextAttachmentProvider,
  useTamboContextAttachment,
} from "./tambo-context-attachment-provider";
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
import { TamboMcpTokenProvider } from "./tambo-mcp-token-provider";
import {
  TamboRegistryProvider,
  TamboRegistryProviderProps,
} from "./tambo-registry-provider";
import { TamboThreadInputProvider } from "./tambo-thread-input-provider";
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
 * @param props.mcpServers - The MCP servers to register (metadata only - use TamboMcpProvider for connections)
 * @param props.streaming - Whether to stream the response by default. Defaults to true.
 * @param props.autoGenerateThreadName - Whether to automatically generate thread names. Defaults to true.
 * @param props.autoGenerateNameThreshold - The message count threshold at which the thread name will be auto-generated. Defaults to 3.
 * @param props.contextHelpers - Configuration for which context helpers are enabled/disabled
 * @param props.userToken - The user's OAuth token (access or ID) used to identify the user and exchange for a Tambo session token
 * @param props.contextKey - Optional context key passed to thread input provider for scoping threads
 * @param props.onCallUnregisteredTool - Callback function called when an unregistered tool is called
 * @param props.initialMessages - Initial messages to be included in new threads
 * @returns The TamboProvider component
 */
export const TamboProvider: React.FC<
  PropsWithChildren<
    TamboClientProviderProps &
      TamboRegistryProviderProps &
      TamboThreadProviderProps &
      TamboContextHelpersProviderProps
  >
> = ({
  children,
  tamboUrl,
  apiKey,
  userToken,
  components,
  environment,
  tools,
  mcpServers,
  streaming,
  autoGenerateThreadName,
  autoGenerateNameThreshold,
  contextHelpers,
  contextKey,
  initialMessages,
  onCallUnregisteredTool,
  getResource,
  listResources,
  resources,
}) => {
  return (
    <TamboClientProvider
      tamboUrl={tamboUrl}
      apiKey={apiKey}
      environment={environment}
      userToken={userToken}
    >
      <TamboRegistryProvider
        components={components}
        tools={tools}
        mcpServers={mcpServers}
        onCallUnregisteredTool={onCallUnregisteredTool}
        getResource={getResource}
        listResources={listResources}
        resources={resources}
      >
        <TamboContextHelpersProvider contextHelpers={contextHelpers}>
          <TamboThreadProvider
            contextKey={contextKey}
            streaming={streaming}
            autoGenerateThreadName={autoGenerateThreadName}
            autoGenerateNameThreshold={autoGenerateNameThreshold}
            initialMessages={initialMessages}
          >
            <TamboMcpTokenProvider>
              <TamboMcpProvider contextKey={contextKey}>
                <TamboContextAttachmentProvider>
                  <TamboComponentProvider>
                    <TamboInteractableProvider>
                      <TamboThreadInputProvider>
                        <TamboCompositeProvider>
                          {children}
                        </TamboCompositeProvider>
                      </TamboThreadInputProvider>
                    </TamboInteractableProvider>
                  </TamboComponentProvider>
                </TamboContextAttachmentProvider>
              </TamboMcpProvider>
            </TamboMcpTokenProvider>
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
  TamboContextHelpersContextProps &
  ContextAttachmentState;

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
  const clientContext = useContext(TamboClientContext);
  if (!clientContext) {
    throw new Error(
      "TamboCompositeProvider must be used within a TamboClientProvider",
    );
  }
  const { client, queryClient, isUpdatingToken } = clientContext;
  const componentRegistry = useTamboComponent();
  const interactableComponents = useTamboInteractable();
  const contextHelpers = useTamboContextHelpers();
  const contextAttachment = useTamboContextAttachment();

  return (
    <TamboContext.Provider
      value={{
        client,
        queryClient,
        isUpdatingToken,
        ...componentRegistry,
        ...threads,
        ...interactableComponents,
        ...contextHelpers,
        ...contextAttachment,
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
