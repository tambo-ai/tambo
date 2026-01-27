"use client";

/**
 * useTamboV1 - Main Hook for v1 API
 *
 * Combines all v1 contexts into a single hook for convenient access
 * to thread state, streaming status, registry, and client.
 */

import { useContext, useMemo } from "react";
import { useTamboClient } from "../../providers/tambo-client-provider";
import {
  TamboRegistryContext,
  type TamboRegistryContext as TamboRegistryContextType,
} from "../../providers/tambo-registry-provider";
import {
  useStreamState,
  useStreamDispatch,
} from "../providers/tambo-v1-stream-context";
import type { StreamingState } from "../types/thread";
import type { TamboV1Message } from "../types/message";
import type { ThreadState } from "../utils/event-accumulator";

/**
 * Return type for useTamboV1 hook
 */
export interface UseTamboV1Return {
  /**
   * The Tambo API client instance
   */
  client: ReturnType<typeof useTamboClient>;

  /**
   * Current thread state for the given threadId, or undefined if not loaded
   */
  thread: ThreadState | undefined;

  /**
   * Messages in the current thread
   */
  messages: TamboV1Message[];

  /**
   * Current streaming state
   */
  streamingState: StreamingState;

  /**
   * Whether the thread is currently streaming a response
   */
  isStreaming: boolean;

  /**
   * Whether the thread is waiting for the AI to start responding
   */
  isWaiting: boolean;

  /**
   * Whether the thread is idle (not streaming or waiting)
   */
  isIdle: boolean;

  /**
   * Register a component with the registry
   */
  registerComponent: TamboRegistryContextType["registerComponent"];

  /**
   * Register a tool with the registry
   */
  registerTool: TamboRegistryContextType["registerTool"];

  /**
   * Register multiple tools with the registry
   */
  registerTools: TamboRegistryContextType["registerTools"];

  /**
   * The component registry (Map of name -> component definition)
   */
  componentList: TamboRegistryContextType["componentList"];

  /**
   * The tool registry (Map of name -> tool definition)
   */
  toolRegistry: TamboRegistryContextType["toolRegistry"];

  /**
   * Dispatch function for stream events (advanced usage)
   */
  dispatch: ReturnType<typeof useStreamDispatch>;
}

/**
 * Main hook for accessing Tambo v1 functionality.
 *
 * Combines thread state, streaming status, registry, and client
 * into a single convenient hook.
 * @param threadId - Optional thread ID to get state for
 * @returns Combined v1 context with thread state and utilities
 * @example
 * ```tsx
 * function ChatInterface() {
 *   const {
 *     thread,
 *     messages,
 *     isStreaming,
 *     registerComponent,
 *   } = useTamboV1('thread_123');
 *
 *   return (
 *     <div>
 *       {messages.map(msg => <Message key={msg.id} message={msg} />)}
 *       {isStreaming && <LoadingIndicator />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useTamboV1(threadId?: string): UseTamboV1Return {
  const client = useTamboClient();
  const streamState = useStreamState();
  const dispatch = useStreamDispatch();
  const registry = useContext(TamboRegistryContext);

  // Get thread state for the given threadId
  const threadState = threadId ? streamState.threadMap[threadId] : undefined;

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => {
    const thread = threadState;
    const messages = thread?.thread.messages ?? [];
    const streamingState: StreamingState = thread?.streaming ?? {
      status: "idle" as const,
    };

    return {
      client,
      thread,
      messages,
      streamingState,
      isStreaming: streamingState.status === "streaming",
      isWaiting: streamingState.status === "waiting",
      isIdle: streamingState.status === "idle",
      registerComponent: registry.registerComponent,
      registerTool: registry.registerTool,
      registerTools: registry.registerTools,
      componentList: registry.componentList,
      toolRegistry: registry.toolRegistry,
      dispatch,
    };
  }, [client, threadState, registry, dispatch]);
}
