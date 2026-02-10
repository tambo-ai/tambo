"use client";

/**
 * TamboProvider - Main Provider
 *
 * Composes the necessary providers for the SDK:
 * - TamboClientProvider: API client and authentication
 * - TamboRegistryProvider: Component and tool registration
 * - TamboContextHelpersProvider: Context helper functions
 * - TamboMcpTokenProvider: MCP access token management
 * - TamboMcpProvider: MCP server connections and tool discovery
 * - TamboContextAttachmentProvider: Single-message context attachments
 * - TamboInteractableProvider: Interactive component tracking
 * - TamboStreamProvider: Streaming state management
 *
 * This provider should wrap your entire application or the portion
 * that needs access to Tambo functionality.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  type PropsWithChildren,
} from "react";
import { useTamboAuthState } from "../hooks/use-tambo-v1-auth-state";
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
import { TamboMcpTokenProvider } from "../../providers/tambo-mcp-token-provider";
import { TamboMcpProvider } from "../../mcp/tambo-mcp-provider";
import type { ContextHelpers } from "../../context-helpers";
import type { McpServerInfo } from "../../model/mcp-server-info";
import type {
  ListResourceItem,
  ResourceSource,
} from "../../model/resource-info";
import type { InitialInputMessage } from "../types/message";
import { TamboStreamProvider } from "./tambo-v1-stream-context";
import { TamboThreadInputProvider } from "./tambo-v1-thread-input-provider";

/**
 * Configuration values for the SDK.
 * These are static values that don't change during the session.
 */
export interface TamboConfig {
  /** User key for thread ownership and scoping */
  userKey?: string;
  /** Whether to automatically generate thread names after a threshold of messages. Defaults to true. */
  autoGenerateThreadName?: boolean;
  /** The message count threshold at which the thread name will be auto-generated. Defaults to 3. */
  autoGenerateNameThreshold?: number;
  /**
   * Initial messages to seed new threads with.
   * These are displayed in the UI immediately and sent to the API on first message.
   */
  initialMessages?: InitialInputMessage[];
}

/**
 * Context for SDK configuration.
 * @internal
 */
export const TamboConfigContext = createContext<TamboConfig | null>(null);

/**
 * Hook to access SDK configuration.
 * @returns Configuration values including userKey
 * @throws {Error} If used outside TamboProvider
 */
export function useTamboConfig(): TamboConfig {
  const config = useContext(TamboConfigContext);
  if (!config) {
    throw new Error("useTamboConfig must be used within TamboProvider");
  }
  return config;
}

/**
 * Props for TamboProvider
 */
export interface TamboProviderProps extends Pick<
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
   * Initial messages to seed new threads with.
   * These are displayed in the UI immediately (before the first API call)
   * and sent to the API when the first message is sent to create the thread.
   */
  initialMessages?: InitialInputMessage[];

  /**
   * Children components
   */
  children: React.ReactNode;
}

/**
 * Internal component that emits console warnings for auth misconfiguration.
 * Rendered inside the provider tree so both TamboClientContext and
 * TamboConfigContext are available.
 */
function TamboAuthWarnings(): null {
  const authState = useTamboAuthState();
  const authError = authState.status === "error" ? authState.error : null;

  useEffect(() => {
    switch (authState.status) {
      case "unauthenticated":
        console.warn(
          "[TamboProvider] Neither userKey nor userToken provided. " +
            "API requests will be blocked until authentication is configured.",
        );
        break;
      case "invalid":
        console.warn(
          "[TamboProvider] Both userKey and userToken were provided. " +
            "You must provide one or the other, not both.",
        );
        break;
      case "error":
        console.warn("[TamboProvider] Token exchange failed:", authError);
        break;
    }
  }, [authState.status, authError]);

  return null;
}

/**
 * Main provider for the Tambo SDK.
 *
 * Composes TamboClientProvider, TamboRegistryProvider, and TamboStreamProvider
 * to provide a complete context for building AI-powered applications.
 *
 * Threads are managed dynamically through useTambo() hook functions:
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
 * import { TamboProvider } from '@tambo-ai/react';
 *
 * function App() {
 *   return (
 *     <TamboProvider
 *       apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
 *       components={[WeatherCard, StockChart]}
 *       tools={[searchTool, calculatorTool]}
 *     >
 *       <ChatInterface />
 *     </TamboProvider>
 *   );
 * }
 * ```
 */
export function TamboProvider({
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
  initialMessages,
  children,
}: PropsWithChildren<TamboProviderProps>) {
  // Config is static - created once and never changes
  const config: TamboConfig = {
    userKey,
    autoGenerateThreadName,
    autoGenerateNameThreshold,
    initialMessages,
  };

  return (
    <TamboClientProvider
      apiKey={apiKey}
      tamboUrl={tamboUrl}
      environment={environment}
      userToken={userToken}
      userKey={userKey}
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
          <TamboMcpTokenProvider>
            <TamboMcpProvider>
              <TamboContextAttachmentProvider>
                <TamboInteractableProvider>
                  <TamboConfigContext.Provider value={config}>
                    <TamboAuthWarnings />
                    <TamboStreamProvider initialMessages={initialMessages}>
                      <TamboThreadInputProvider>
                        {children}
                      </TamboThreadInputProvider>
                    </TamboStreamProvider>
                  </TamboConfigContext.Provider>
                </TamboInteractableProvider>
              </TamboContextAttachmentProvider>
            </TamboMcpProvider>
          </TamboMcpTokenProvider>
        </TamboContextHelpersProvider>
      </TamboRegistryProvider>
    </TamboClientProvider>
  );
}
