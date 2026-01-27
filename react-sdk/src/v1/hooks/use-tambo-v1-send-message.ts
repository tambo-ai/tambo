"use client";

/**
 * Send Message Hook for v1 API
 *
 * React Query mutation hook for sending messages and handling streaming responses.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { EventType, type RunErrorEvent } from "@ag-ui/core";
import { asTamboCustomEvent, type RunAwaitingInputEvent } from "../types/event";
import type TamboAI from "@tambo-ai/typescript-sdk";
import type { Stream } from "@tambo-ai/typescript-sdk/core/streaming";
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
import { executeAllPendingTools } from "../utils/tool-executor";
import { ToolCallTracker } from "../utils/tool-call-tracker";

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
 * Stream types from the SDK
 */
type RunStream = Stream<TamboAI.Threads.Runs.RunRunResponse>;
type CreateStream = Stream<TamboAI.Threads.Runs.RunCreateResponse>;

/**
 * Result from creating a run stream
 */
export interface CreateRunStreamResult {
  stream: RunStream | CreateStream;
  initialThreadId: string | undefined;
}

/**
 * Parameters for executing tools and continuing the run
 */
interface ExecuteToolsParams {
  event: RunAwaitingInputEvent;
  toolTracker: ToolCallTracker;
  registry: TamboRegistry;
  client: TamboAI;
  threadId: string;
  runId: string;
}

/**
 * Executes pending tools and returns a continuation stream.
 *
 * This function does NOT process the continuation stream - it just executes
 * the tools and returns the new stream for the caller to process. This enables
 * the flat loop pattern that correctly handles multi-round tool execution.
 * @param params - The parameters for tool execution
 * @returns The continuation stream to process
 */
async function executeToolsAndContinue(
  params: ExecuteToolsParams,
): Promise<RunStream> {
  const { event, toolTracker, registry, client, threadId, runId } = params;

  const { pendingToolCallIds } = event.value;
  const toolCallsToExecute = toolTracker.getToolCallsById(pendingToolCallIds);

  // Execute tools
  const toolResults = await executeAllPendingTools(
    toolCallsToExecute,
    registry.toolRegistry,
  );

  // Clear executed tool calls before continuing
  toolTracker.clearToolCalls(pendingToolCallIds);

  // Return the continuation stream (caller will process it)
  return await client.threads.runs.run(threadId, {
    message: {
      role: "user",
      content: toolResults,
    },
    previousRunId: runId,
    availableComponents: toAvailableComponents(registry.componentList),
    tools: toAvailableTools(registry.toolRegistry),
  });
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

      const toolTracker = new ToolCallTracker();

      // Create the run stream
      const { stream, initialThreadId } = await createRunStream({
        client,
        threadId,
        message,
        registry,
      });

      let actualThreadId = initialThreadId;
      let runId: string | undefined;
      let currentStream: CreateRunStreamResult["stream"] = stream;

      try {
        // Outer loop handles stream replacement for multi-round tool execution.
        // When we hit awaiting_input, we execute tools, get a new stream, and continue.
        // This flat loop pattern correctly handles tool→AI→tool→AI chains.
        while (true) {
          let pendingAwaitingInput: RunAwaitingInputEvent | undefined;

          // Process current stream until completion or awaiting_input
          for await (const event of handleEventStream(currentStream, {
            debug,
          })) {
            // Extract threadId and runId from RUN_STARTED event
            if (event.type === EventType.RUN_STARTED) {
              runId = event.runId;
              actualThreadId ??= event.threadId;
            } else if (!actualThreadId) {
              throw new Error(
                `Expected first event to be RUN_STARTED with threadId, got: ${event.type}`,
              );
            }

            toolTracker.handleEvent(event);
            dispatch({ type: "EVENT", event, threadId: actualThreadId });

            // Check for awaiting_input - if found, break to execute tools
            if (event.type === EventType.CUSTOM) {
              const customEvent = asTamboCustomEvent(event);
              if (customEvent?.name === "tambo.run.awaiting_input") {
                pendingAwaitingInput = customEvent;
                break; // Exit stream loop to handle tool execution
              }
            }
          }

          // If stream finished without awaiting_input, we're done
          if (!pendingAwaitingInput) {
            break;
          }

          // Execute tools and get continuation stream
          // These checks should never fail since awaiting_input comes after RUN_STARTED
          if (!runId || !actualThreadId) {
            throw new Error(
              "Cannot continue run after awaiting_input: missing runId or threadId",
            );
          }

          currentStream = await executeToolsAndContinue({
            event: pendingAwaitingInput,
            toolTracker,
            registry,
            client,
            threadId: actualThreadId,
            runId,
          });
        }

        return { threadId: actualThreadId };
      } catch (error) {
        // Dispatch a synthetic RUN_ERROR event to clean up thread state
        // This ensures the thread doesn't stay stuck in "streaming" status
        if (actualThreadId) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown streaming error";
          const errorEvent: RunErrorEvent = {
            type: EventType.RUN_ERROR,
            message: errorMessage,
          };
          dispatch({
            type: "EVENT",
            event: errorEvent,
            threadId: actualThreadId,
          });
        }
        throw error;
      }
    },
    onSuccess: async (result) => {
      // Invalidate thread queries to refetch updated state
      await queryClient.invalidateQueries({
        queryKey: ["v1-threads", result.threadId],
      });
    },
    onError: (error) => {
      console.error("[useTamboV1SendMessage] Mutation failed:", error);
    },
  });
}
