"use client";

/**
 * Send Message Hook for v1 API
 *
 * React Query mutation hook for sending messages and handling streaming responses.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import {
  EventType,
  type RunStartedEvent,
  type ToolCallStartEvent,
  type ToolCallArgsEvent,
  type ToolCallEndEvent,
  type CustomEvent,
} from "@ag-ui/core";
import type TamboAI from "@tambo-ai/typescript-sdk";
import { useTamboClient } from "../../providers/tambo-client-provider";
import {
  TamboRegistryContext,
  type TamboRegistryContext as TamboRegistry,
} from "../../providers/tambo-registry-provider";
import { useStreamDispatch } from "../providers/tambo-v1-stream-context";
import type { InputMessage } from "../types/message";
import {
  toAvailableComponents,
  toAvailableTools,
} from "../utils/registry-conversion";
import { handleEventStream } from "../utils/stream-handler";
import {
  executeAllPendingTools,
  type PendingToolCall,
} from "../utils/tool-executor";

/**
 * Options for sending a message
 */
export interface SendMessageOptions {
  /**
   * The message to send
   */
  message: InputMessage;

  /**
   * Enable debug logging for the stream
   */
  debug?: boolean;
}

/**
 * Parameters for creating a run stream
 */
export interface CreateRunStreamParams {
  client: TamboAI;
  threadId: string | undefined;
  message: InputMessage;
  registry: TamboRegistry;
}

/**
 * Result from creating a run stream
 */
export interface CreateRunStreamResult {
  stream:
    | Awaited<ReturnType<TamboAI["threads"]["runs"]["run"]>>
    | Awaited<ReturnType<TamboAI["threads"]["runs"]["create"]>>;
  initialThreadId: string | undefined;
}

/**
 * Creates a run stream by calling the appropriate API method.
 *
 * If threadId is provided, runs on existing thread via client.threads.runs.run().
 * If no threadId, creates new thread via client.threads.runs.create().
 * @param params - The parameters for creating the run stream
 * @returns The stream and initial thread ID (undefined if creating new thread)
 */
export async function createRunStream(
  params: CreateRunStreamParams,
): Promise<CreateRunStreamResult> {
  const { client, threadId, message, registry } = params;

  // Convert registry components/tools to v1 API format
  const availableComponents = toAvailableComponents(registry.componentList);
  const availableTools = toAvailableTools(registry.toolRegistry);

  if (threadId) {
    // Run on existing thread
    const stream = await client.threads.runs.run(threadId, {
      message,
      availableComponents,
      tools: availableTools,
    });
    return { stream, initialThreadId: threadId };
  } else {
    // Create new thread
    const stream = await client.threads.runs.create({
      message,
      availableComponents,
      tools: availableTools,
    });
    // threadId will be extracted from first event (RUN_STARTED)
    return { stream, initialThreadId: undefined };
  }
}

/**
 * Hook to send a message and handle streaming responses.
 *
 * This hook handles two scenarios:
 * - If threadId provided: runs on existing thread via client.threads.runs.run()
 * - If no threadId: creates new thread via client.threads.runs.create()
 *
 * The hook:
 * - Sends a user message to the API
 * - Streams AG-UI events in real-time
 * - Dispatches events to the stream reducer
 * - Extracts threadId from events when creating new thread
 * - Handles tool execution (Phase 6)
 * - Invalidates thread queries on completion
 * @param threadId - Optional thread ID to send message to. If not provided, creates new thread
 * @returns React Query mutation object with threadId in mutation result
 * @example
 * ```tsx
 * function ChatInput({ threadId }: { threadId?: string }) {
 *   const sendMessage = useTamboV1SendMessage(threadId);
 *
 *   const handleSubmit = async (text: string) => {
 *     const result = await sendMessage.mutateAsync({
 *       message: {
 *         role: "user",
 *         content: [{ type: "text", text }],
 *       },
 *     });
 *
 *     // If threadId wasn't provided, a new thread was created
 *     if (!threadId) {
 *       console.log("Created thread:", result.threadId);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <input onSubmit={handleSubmit} />
 *       {sendMessage.isPending && <Spinner />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useTamboV1SendMessage(threadId?: string) {
  const client = useTamboClient();
  const dispatch = useStreamDispatch();
  const registry = useContext(TamboRegistryContext);
  const queryClient = useQueryClient();

  if (!registry) {
    throw new Error(
      "useTamboV1SendMessage must be used within TamboRegistryProvider",
    );
  }

  return useMutation({
    mutationFn: async (options: SendMessageOptions) => {
      const { message, debug = false } = options;

      // Track tool calls locally during streaming
      const pendingToolCalls = new Map<string, PendingToolCall>();
      const accumulatingToolArgs = new Map<string, string>();

      // Create the run stream
      const { stream, initialThreadId } = await createRunStream({
        client,
        threadId,
        message,
        registry,
      });

      let actualThreadId = initialThreadId;
      let runId: string | undefined;

      // Stream events and dispatch to reducer
      for await (const event of handleEventStream(stream, { debug })) {
        // Extract threadId from RUN_STARTED event if we don't have it yet
        // Also always extract runId from RUN_STARTED for tool continuation
        if (event.type === EventType.RUN_STARTED) {
          const runStartedEvent = event as RunStartedEvent;
          runId = runStartedEvent.runId;
          actualThreadId ??= runStartedEvent.threadId;
        } else if (!actualThreadId) {
          // First event should be RUN_STARTED when creating new thread
          throw new Error(
            `Expected first event to be RUN_STARTED with threadId, got: ${event.type}`,
          );
        }

        // Track tool calls locally for execution on awaiting_input
        if (event.type === EventType.TOOL_CALL_START) {
          const toolCallStart = event as ToolCallStartEvent;
          pendingToolCalls.set(toolCallStart.toolCallId, {
            name: toolCallStart.toolCallName,
            input: {},
          });
          accumulatingToolArgs.set(toolCallStart.toolCallId, "");
        } else if (event.type === EventType.TOOL_CALL_ARGS) {
          const toolCallArgs = event as ToolCallArgsEvent;
          const current = accumulatingToolArgs.get(toolCallArgs.toolCallId);
          accumulatingToolArgs.set(
            toolCallArgs.toolCallId,
            (current ?? "") + toolCallArgs.delta,
          );
        } else if (event.type === EventType.TOOL_CALL_END) {
          const toolCallEnd = event as ToolCallEndEvent;
          const jsonStr = accumulatingToolArgs.get(toolCallEnd.toolCallId);
          const toolCall = pendingToolCalls.get(toolCallEnd.toolCallId);
          if (toolCall && jsonStr) {
            try {
              toolCall.input = JSON.parse(jsonStr) as Record<string, unknown>;
            } catch {
              // Keep empty input if parsing fails
            }
          }
        }

        dispatch({ type: "EVENT", event, threadId: actualThreadId });

        // Handle awaiting_input for client-side tool execution
        if (event.type === EventType.CUSTOM) {
          const customEvent = event as CustomEvent;
          if (customEvent.name === "tambo.run.awaiting_input") {
            const { pendingToolCallIds } = customEvent.value as {
              pendingToolCallIds: string[];
            };

            // Filter to only the tool calls requested
            const toolCallsToExecute = new Map<string, PendingToolCall>();
            for (const id of pendingToolCallIds) {
              const toolCall = pendingToolCalls.get(id);
              if (toolCall) {
                toolCallsToExecute.set(id, toolCall);
              }
            }

            // Execute tools and continue the run
            const toolResults = await executeAllPendingTools(
              toolCallsToExecute,
              registry.toolRegistry,
            );

            // Continue the run with tool results
            if (actualThreadId && runId) {
              const continueStream = await client.threads.runs.run(
                actualThreadId,
                {
                  message: {
                    role: "user",
                    content: toolResults,
                  },
                  previousRunId: runId,
                  availableComponents: toAvailableComponents(
                    registry.componentList,
                  ),
                  tools: toAvailableTools(registry.toolRegistry),
                },
              );

              // Process continuation stream
              for await (const continueEvent of handleEventStream(
                continueStream,
                { debug },
              )) {
                dispatch({
                  type: "EVENT",
                  event: continueEvent,
                  threadId: actualThreadId,
                });

                // Update runId if we get a new RUN_STARTED
                if (continueEvent.type === EventType.RUN_STARTED) {
                  const runStarted = continueEvent as RunStartedEvent;
                  runId = runStarted.runId;
                }

                // Note: Recursive tool calls would need additional handling here
                // For now, we assume tools don't trigger more tool calls
              }
            }

            // Clear executed tool calls
            for (const id of pendingToolCallIds) {
              pendingToolCalls.delete(id);
              accumulatingToolArgs.delete(id);
            }
          }
        }
      }

      return { threadId: actualThreadId };
    },
    onSuccess: async (result) => {
      // Invalidate thread queries to refetch updated state
      await queryClient.invalidateQueries({
        queryKey: ["v1-threads", result.threadId],
      });
    },
    onError: (error) => {
      // Log error for observability

      console.error("[useTamboV1SendMessage] Mutation failed:", error);
      // Note: If streaming failed mid-way, the thread may be in an inconsistent state.
      // The caller should handle this via mutation.error and mutation.isError.
    },
  });
}
