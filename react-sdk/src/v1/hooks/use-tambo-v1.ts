"use client";

/**
 * useTamboV1 - Main Hook for v1 API
 *
 * Combines all v1 contexts into a single hook for convenient access
 * to thread state, streaming status, registry, and client.
 */

import type TamboAI from "@tambo-ai/typescript-sdk";
import React, { useContext, useMemo, useRef, type ReactElement } from "react";
import { useTamboClient } from "../../providers/tambo-client-provider";
import {
  TamboRegistryContext,
  type TamboRegistryContext as TamboRegistryContextType,
} from "../../providers/tambo-registry-provider";
import { V1ComponentRenderer } from "../components/v1-component-renderer";
import {
  useStreamDispatch,
  useStreamState,
  useThreadManagement,
  type ThreadManagement,
} from "../providers/tambo-v1-stream-context";
import type {
  Content,
  TamboToolDisplayProps,
  TamboV1Message,
  V1ToolUseContent,
} from "../types/message";
import type { StreamingState } from "../types/thread";
import type { ThreadState } from "../utils/event-accumulator";

/**
 * Return type for useTamboV1 hook
 */
export interface UseTamboV1Return {
  /**
   * The Tambo API client instance
   */
  client: TamboAI;

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
   * Current thread ID (always available - uses "placeholder" for new threads)
   */
  currentThreadId: string;

  /**
   * Initialize a new thread in the stream context
   */
  initThread: ThreadManagement["initThread"];

  /**
   * Switch the current active thread
   */
  switchThread: ThreadManagement["switchThread"];

  /**
   * Start a new thread (generates a temporary ID)
   */
  startNewThread: ThreadManagement["startNewThread"];

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
 *
 * Messages returned include renderedComponent on component content blocks,
 * allowing direct rendering via {content.renderedComponent}.
 * @param threadId - Optional thread ID to get state for
 * @returns Combined v1 context with thread state, messages, and utilities
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
/**
 * Cache entry for a rendered component wrapper.
 * Stores the element and the props JSON used to create it.
 */
interface ComponentCacheEntry {
  element: ReactElement;
  propsJson: string;
}

/**
 *
 * @returns The combined Tambo context
 */
export function useTamboV1(): UseTamboV1Return {
  const client = useTamboClient();
  const streamState = useStreamState();
  const dispatch = useStreamDispatch();
  const registry = useContext(TamboRegistryContext);
  const threadManagement = useThreadManagement();

  // Cache for rendered component wrappers - maintains stable element references
  // across renders when props haven't changed
  const componentCacheRef = useRef<Map<string, ComponentCacheEntry>>(new Map());

  // Get thread state for the current thread
  const threadState = streamState.threadMap[streamState.currentThreadId];

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => {
    const thread = threadState;
    const rawMessages = thread?.thread.messages ?? [];
    const streamingState: StreamingState = thread?.streaming ?? {
      status: "idle" as const,
    };

    // Build a set of tool_use IDs that have completed (have a matching tool_result)
    // We need to look across all messages since tool_result might be in a different message
    const completedToolIds = new Set<string>();
    for (const msg of rawMessages) {
      for (const content of msg.content) {
        if (content.type === "tool_result") {
          completedToolIds.add(content.toolUseId);
        }
      }
    }

    // Transform messages to add computed properties to content blocks
    const messages = rawMessages.map((message): TamboV1Message => {
      const transformedContent = message.content.map((content): Content => {
        // Transform tool_use content to add computed state
        if (content.type === "tool_use") {
          const hasCompleted = completedToolIds.has(content.id);
          const input = content.input ?? {};

          // Extract Tambo display props from input
          const tamboDisplayProps: TamboToolDisplayProps = {
            _tambo_displayMessage:
              typeof input._tambo_displayMessage === "string"
                ? input._tambo_displayMessage
                : undefined,
            _tambo_statusMessage:
              typeof input._tambo_statusMessage === "string"
                ? input._tambo_statusMessage
                : undefined,
            _tambo_completionStatusMessage:
              typeof input._tambo_completionStatusMessage === "string"
                ? input._tambo_completionStatusMessage
                : undefined,
          };

          // Compute status message based on completion state
          const statusMessage = hasCompleted
            ? (tamboDisplayProps._tambo_completionStatusMessage ??
              `Called ${content.name}`)
            : (tamboDisplayProps._tambo_statusMessage ??
              `Calling ${content.name}`);

          // Filter out _tambo_* properties from input - consumers only see actual tool params
          const cleanInput: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(input)) {
            if (!key.startsWith("_tambo_")) {
              cleanInput[key] = value;
            }
          }

          const v1Content: V1ToolUseContent = {
            ...content,
            input: cleanInput,
            hasCompleted,
            statusMessage,
            tamboDisplayProps,
          };
          return v1Content;
        }

        if (content.type !== "component") {
          return content;
        }

        const componentContent = content;
        const propsJson = JSON.stringify(componentContent.props ?? {});
        const cache = componentCacheRef.current;
        const cached = cache.get(componentContent.id);

        // Return cached element if props haven't changed
        if (cached?.propsJson === propsJson) {
          return {
            ...componentContent,
            renderedComponent: cached.element,
          };
        }

        // Create new wrapper element
        const element = React.createElement(V1ComponentRenderer, {
          key: componentContent.id,
          content: componentContent,
          threadId: streamState.currentThreadId,
          messageId: message.id,
        });

        // Update cache
        cache.set(componentContent.id, { element, propsJson });

        return {
          ...componentContent,
          renderedComponent: element,
        };
      });

      return {
        ...message,
        content: transformedContent,
      };
    });

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
      currentThreadId: streamState.currentThreadId,
      initThread: threadManagement.initThread,
      switchThread: threadManagement.switchThread,
      startNewThread: threadManagement.startNewThread,
      dispatch,
    };
  }, [
    client,
    threadState,
    registry,
    streamState.currentThreadId,
    threadManagement,
    dispatch,
  ]);
}
