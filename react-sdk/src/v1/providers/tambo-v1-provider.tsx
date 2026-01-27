"use client";

/**
 * TamboV1Provider - Main Provider for v1 API
 *
 * Composes the necessary providers for the v1 SDK:
 * - TamboClientProvider: API client and authentication
 * - TamboRegistryProvider: Component and tool registration
 * - TamboV1StreamProvider: Streaming state management
 *
 * This provider should wrap your entire application or the portion
 * that needs access to Tambo v1 functionality.
 */

import React, { type PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  TamboClientProvider,
  type TamboClientProviderProps,
} from "../../providers/tambo-client-provider";
import {
  TamboRegistryProvider,
  type TamboRegistryProviderProps,
} from "../../providers/tambo-registry-provider";
import { TamboV1StreamProvider } from "./tambo-v1-stream-context";

/**
 * Props for TamboV1Provider
 */
export interface TamboV1ProviderProps extends Pick<
  TamboClientProviderProps,
  "apiKey" | "tamboUrl" | "environment"
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
   * Optional custom QueryClient instance.
   * If not provided, a default client will be created.
   */
  queryClient?: QueryClient;

  /**
   * Initial thread ID to load.
   * If provided, the stream context will be initialized with this thread.
   */
  threadId?: string;

  /**
   * Children components
   */
  children: React.ReactNode;
}

// Create a default query client for when none is provided
const defaultQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000,
      retry: 1,
    },
  },
});

/**
 * Main provider for the Tambo v1 SDK.
 *
 * Composes TamboClientProvider, TamboRegistryProvider, and TamboV1StreamProvider
 * to provide a complete context for building AI-powered applications.
 * @param props - Provider configuration
 * @param props.apiKey - Tambo API key for authentication
 * @param props.tamboUrl - Optional custom Tambo API URL
 * @param props.environment - Optional environment configuration
 * @param props.components - Components to register with the AI
 * @param props.tools - Tools to register for client-side execution
 * @param props.queryClient - Optional custom React Query client
 * @param props.threadId - Optional initial thread ID
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
  components,
  tools,
  queryClient,
  threadId,
  children,
}: PropsWithChildren<TamboV1ProviderProps>) {
  const client = queryClient ?? defaultQueryClient;

  return (
    <QueryClientProvider client={client}>
      <TamboClientProvider
        apiKey={apiKey}
        tamboUrl={tamboUrl}
        environment={environment}
      >
        <TamboRegistryProvider components={components} tools={tools}>
          <TamboV1StreamProvider threadId={threadId}>
            {children}
          </TamboV1StreamProvider>
        </TamboRegistryProvider>
      </TamboClientProvider>
    </QueryClientProvider>
  );
}
