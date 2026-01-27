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
  type BaseEvent,
  type RunStartedEvent,
  type RunErrorEvent,
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
 * Result from creating a run stream
 */
export interface CreateRunStreamResult {
  stream:
    | Awaited<ReturnType<TamboAI["threads"]["runs"]["run"]>>
    | Awaited<ReturnType<TamboAI["threads"]["runs"]["create"]>>;
  initialThreadId: string | undefined;
}

/**
 * Parameters for handling awaiting_input events
 */
interface HandleAwaitingInputParams {
  event: CustomEvent;
  toolTracker: ToolCallTracker;
  registry: TamboRegistry;
  client: TamboAI;
  threadId: string;
  runId: string | undefined;
  debug: boolean;
  dispatch: (action: {
    type: "EVENT";
    event: BaseEvent;
    threadId: string;
  }) => void;
}

/**
 * Handles the tambo.run.awaiting_input custom event by executing pending tools
 * and continuing the run with tool results.
 * @param params - The parameters for handling the awaiting_input event
 * @returns Updated runId if the run was continued, undefined otherwise
 */
async function handleAwaitingInput(
  params: HandleAwaitingInputParams,
): Promise<{ runId: string } | undefined> {
  const {
    event,
    toolTracker,
    registry,
    client,
    threadId,
    runId,
    debug,
    dispatch,
  } = params;

  if (event.name !== "tambo.run.awaiting_input") {
    return undefined;
  }

  const { pendingToolCallIds } = event.value as {
    pendingToolCallIds: string[];
  };
  const toolCallsToExecute = toolTracker.getToolCallsById(pendingToolCallIds);

  // Execute tools
  const toolResults = await executeAllPendingTools(
    toolCallsToExecute,
    registry.toolRegistry,
  );

  // Continue the run with tool results
  if (!runId) {
    return undefined;
  }

  const continueStream = await client.threads.runs.run(threadId, {
    message: {
      role: "user",
      content: toolResults,
    },
    previousRunId: runId,
    availableComponents: toAvailableComponents(registry.componentList),
    tools: toAvailableTools(registry.toolRegistry),
  });

  let newRunId = runId;

  // Process continuation stream
  for await (const continueEvent of handleEventStream(continueStream, {
    debug,
  })) {
    dispatch({ type: "EVENT", event: continueEvent, threadId });

    // Update runId if we get a new RUN_STARTED
    if (continueEvent.type === EventType.RUN_STARTED) {
      const runStarted = continueEvent as RunStartedEvent;
      newRunId = runStarted.runId;
    }

    // Note: Recursive tool calls would need additional handling here
    // For now, we assume continuation doesn't trigger more awaiting_input
  }

  // Clear executed tool calls
  toolTracker.clearToolCalls(pendingToolCallIds);

  return { runId: newRunId };
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

      try {
        // Stream events and dispatch to reducer
        for await (const event of handleEventStream(stream, { debug })) {
          // Extract threadId and runId from RUN_STARTED event
          if (event.type === EventType.RUN_STARTED) {
            const runStartedEvent = event as RunStartedEvent;
            runId = runStartedEvent.runId;
            actualThreadId ??= runStartedEvent.threadId;
          } else if (!actualThreadId) {
            throw new Error(
              `Expected first event to be RUN_STARTED with threadId, got: ${event.type}`,
            );
          }

          toolTracker.handleEvent(event);
          dispatch({ type: "EVENT", event, threadId: actualThreadId });

          // Handle awaiting_input for client-side tool execution
          if (event.type === EventType.CUSTOM) {
            const result = await handleAwaitingInput({
              event: event as CustomEvent,
              toolTracker,
              registry,
              client,
              threadId: actualThreadId,
              runId,
              debug,
              dispatch,
            });
            if (result?.runId) {
              runId = result.runId;
            }
          }
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
