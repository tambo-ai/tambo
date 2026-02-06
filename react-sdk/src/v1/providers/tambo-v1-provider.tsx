"use client";

/**
 * TamboV1Provider - Main Provider for v1 API
 *
 * Composes the necessary providers for the v1 SDK:
 * - TamboClientProvider: API client and authentication
 * - TamboRegistryProvider: Component and tool registration
 * - TamboContextHelpersProvider: Context helper functions
 * - TamboContextAttachmentProvider: Single-message context attachments
 * - TamboInteractableProvider: Interactive component tracking
 * - TamboV1StreamProvider: Streaming state management
 *
 * This provider should wrap your entire application or the portion
 * that needs access to Tambo v1 functionality.
 */

import React, {
  createContext,
  useContext,
  type PropsWithChildren,
} from "react";
import {
  TamboClientProvider,
  type TamboClientProviderProps,
} from "../../providers/tambo-client-provider";
import {
  TamboRegistryProvider,
  type TamboRegistryProviderProps,
} from "../../providers/tambo-registry-provider";
import { TamboContextAttachmentProvider } from "../../providers/tambo-context-attachment-provider";
import { TamboContextHelpersProvider } from "../../providers/tambo-context-helpers-provider";
import { TamboInteractableProvider } from "../../providers/tambo-interactable-provider";
import type { ContextHelpers } from "../../context-helpers";
import type { McpServerInfo } from "../../model/mcp-server-info";
import type {
  ListResourceItem,
  ResourceSource,
} from "../../model/resource-info";
import { TamboV1StreamProvider } from "./tambo-v1-stream-context";
import { TamboV1ThreadInputProvider } from "./tambo-v1-thread-input-provider";

/**
 * Configuration values for v1 SDK.
 * These are static values that don't change during the session.
 */
export interface TamboV1Config {
  /** User key for thread ownership and scoping */
  userKey?: string;
  /** Whether to automatically generate thread names after a threshold of messages. Defaults to true. */
  autoGenerateThreadName?: boolean;
  /** The message count threshold at which the thread name will be auto-generated. Defaults to 3. */
  autoGenerateNameThreshold?: number;
}

/**
 * Context for v1 SDK configuration.
 * @internal
 */
export const TamboV1ConfigContext = createContext<TamboV1Config | null>(null);

/**
 * Hook to access v1 SDK configuration.
 * @returns Configuration values including userKey
 * @throws {Error} If used outside TamboV1Provider
 */
export function useTamboV1Config(): TamboV1Config {
  const config = useContext(TamboV1ConfigContext);
  if (!config) {
    throw new Error("useTamboV1Config must be used within TamboV1Provider");
  }
  return config;
}

/**
 * Props for TamboV1Provider
 */
export interface TamboV1ProviderProps extends Pick<
  TamboClientProviderProps,
  "apiKey" | "tamboUrl" | "environment" | "userToken"
> {
  /**
   * Components to register with the registry.
   * These will be available for the AI to use in responses.
   */
  components?: TamboRegistryProviderProps["components"];

  /**
   * Tools to register with the registry.
   * These will be executed client-side when requested by the AI.
   */
  tools?: TamboRegistryProviderProps["tools"];

  /**
   * MCP servers to register with the registry.
   * These provide additional tools and resources from MCP-compatible servers.
   */
  mcpServers?: (McpServerInfo | string)[];

  /**
   * Callback function called when an unregistered tool is called.
   * If not provided, an error will be thrown for unknown tools.
   */
  onCallUnregisteredTool?: TamboRegistryProviderProps["onCallUnregisteredTool"];

  /**
   * Static resources to register with the registry.
   * These will be available for the AI to access.
   */
  resources?: ListResourceItem[];

  /**
   * Dynamic resource search function.
   * Must be paired with getResource.
   * Called when searching for resources dynamically.
   */
  listResources?: ResourceSource["listResources"];

  /**
   * Dynamic resource fetch function.
   * Must be paired with listResources.
   * Called when fetching a specific resource by URI.
   */
  getResource?: ResourceSource["getResource"];

  /**
   * Configuration for context helpers.
   * A dictionary of functions that provide additional context to the AI.
   * Each key becomes the context name, and the function returns the value.
   */
  contextHelpers?: ContextHelpers;

  /**
   * User key for thread ownership and scoping.
   *
   * **Required**: You must provide either `userKey` OR `userToken` (which contains a userKey).
   * All thread operations (create, list, fetch) only return threads owned by this userKey.
   *
   * - Use `userKey` for server-side or trusted environments where you control the user identity
   * - Use `userToken` (OAuth bearer token) for client-side apps where the token contains the userKey
   */
  userKey?: string;

  /**
   * Whether to automatically generate thread names after a threshold of messages.
   * Defaults to true.
   */
  autoGenerateThreadName?: boolean;

  /**
   * The message count threshold at which the thread name will be auto-generated.
   * Defaults to 3.
   */
  autoGenerateNameThreshold?: number;

  /**
   * Children components
   */
  children: React.ReactNode;
}

/**
 * Main provider for the Tambo v1 SDK.
 *
 * Composes TamboClientProvider, TamboRegistryProvider, and TamboV1StreamProvider
 * to provide a complete context for building AI-powered applications.
 *
 * Threads are managed dynamically through useTamboV1() hook functions:
 * - startNewThread() - Begin a new conversation
 * - switchThread(threadId) - Switch to an existing thread
 * - initThread(threadId) - Initialize a thread for receiving events
 * @param props - Provider configuration
 * @param props.apiKey - Tambo API key for authentication
 * @param props.tamboUrl - Optional custom Tambo API URL
 * @param props.environment - Optional environment configuration
 * @param props.userToken - Optional OAuth token for user authentication
 * @param props.components - Components to register with the AI
 * @param props.tools - Tools to register for client-side execution
 * @param props.mcpServers - MCP servers to register for additional tools/resources
 * @param props.onCallUnregisteredTool - Callback for handling unknown tool calls
 * @param props.resources - Static resources to register with the AI
 * @param props.listResources - Dynamic resource search function (must be paired with getResource)
 * @param props.getResource - Dynamic resource fetch function (must be paired with listResources)
 * @param props.contextHelpers - Configuration for context helper functions
 * @param props.userKey - User key for thread ownership (required if not using userToken)
 * @param props.autoGenerateThreadName - Whether to automatically generate thread names. Defaults to true.
 * @param props.autoGenerateNameThreshold - The message count threshold at which the thread name will be auto-generated. Defaults to 3.
 * @param props.children - Child components
 * @returns Provider component tree
 * @example
 * ```tsx
 * import { TamboV1Provider } from '@tambo-ai/react/v1';
 *
 * function App() {
 *   return (
 *     <TamboV1Provider
 *       apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
 *       components={[WeatherCard, StockChart]}
 *       tools={[searchTool, calculatorTool]}
 *     >
 *       <ChatInterface />
 *     </TamboV1Provider>
 *   );
 * }
 * ```
 */
export function TamboV1Provider({
  apiKey,
  tamboUrl,
  environment,
  userToken,
  components,
  tools,
  mcpServers,
  onCallUnregisteredTool,
  resources,
  listResources,
  getResource,
  contextHelpers,
  userKey,
  autoGenerateThreadName,
  autoGenerateNameThreshold,
  children,
}: PropsWithChildren<TamboV1ProviderProps>) {
  // Config is static - created once and never changes
  const config: TamboV1Config = {
    userKey,
    autoGenerateThreadName,
    autoGenerateNameThreshold,
  };

  return (
    <TamboClientProvider
      apiKey={apiKey}
      tamboUrl={tamboUrl}
      environment={environment}
      userToken={userToken}
    >
      <TamboRegistryProvider
        components={components}
        tools={tools}
        mcpServers={mcpServers}
        onCallUnregisteredTool={onCallUnregisteredTool}
        resources={resources}
        listResources={listResources}
        getResource={getResource}
      >
        <TamboContextHelpersProvider contextHelpers={contextHelpers}>
          <TamboContextAttachmentProvider>
            <TamboInteractableProvider>
              <TamboV1ConfigContext.Provider value={config}>
                <TamboV1StreamProvider>
                  <TamboV1ThreadInputProvider>
                    {children}
                  </TamboV1ThreadInputProvider>
                </TamboV1StreamProvider>
              </TamboV1ConfigContext.Provider>
            </TamboInteractableProvider>
          </TamboContextAttachmentProvider>
        </TamboContextHelpersProvider>
      </TamboRegistryProvider>
    </TamboClientProvider>
  );
}
