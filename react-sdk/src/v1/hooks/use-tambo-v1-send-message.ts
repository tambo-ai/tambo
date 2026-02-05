"use client";

/**
 * Send Message Hook for v1 API
 *
 * React Query mutation hook for sending messages and handling streaming responses.
 */

import { useContext } from "react";
import { EventType, type RunErrorEvent } from "@ag-ui/core";
import { asTamboCustomEvent, type RunAwaitingInputEvent } from "../types/event";
import type TamboAI from "@tambo-ai/typescript-sdk";
import type { Stream } from "@tambo-ai/typescript-sdk/core/streaming";
import {
  useTamboClient,
  useTamboQueryClient,
} from "../../providers/tambo-client-provider";
import { useTamboMutation } from "../../hooks/react-query-hooks";
import {
  TamboRegistryContext,
  type TamboRegistryContext as TamboRegistry,
} from "../../providers/tambo-registry-provider";
import {
  useStreamDispatch,
  useStreamState,
} from "../providers/tambo-v1-stream-context";
import { useTamboV1Config } from "../providers/tambo-v1-provider";
import { useTamboContextHelpers } from "../../providers/tambo-context-helpers-provider";
import type { InputMessage } from "../types/message";
import { isPlaceholderThreadId } from "../utils/event-accumulator";
import {
  toAvailableComponents,
  toAvailableTools,
} from "../utils/registry-conversion";
import { handleEventStream } from "../utils/stream-handler";
import { executeAllPendingTools } from "../utils/tool-executor";
import type { ToolResultContent } from "@tambo-ai/typescript-sdk/resources/threads/threads";
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
   * User message text for optimistic display.
   * If provided, synthetic AG-UI events will be dispatched to show
   * the user message in the thread immediately after getting the threadId.
   */
  userMessageText?: string;

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
  userKey: string | undefined;
  /**
   * Previous run ID for continuing a thread with existing messages.
   * Required when threadId is provided and the thread has previous runs.
   */
  previousRunId: string | undefined;
  /**
   * Additional context gathered from context helpers (including interactables).
   * Merged into the message's additionalContext before sending.
   */
  additionalContext?: Record<string, unknown>;
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
  userKey: string | undefined;
  additionalContext?: Record<string, unknown>;
}

/**
 * Result from executing tools and continuing the run
 */
interface ExecuteToolsResult {
  stream: RunStream;
  toolResults: ToolResultContent[];
}

/**
 * Executes pending tools and returns a continuation stream.
 *
 * This function does NOT process the continuation stream - it just executes
 * the tools and returns the new stream for the caller to process. This enables
 * the flat loop pattern that correctly handles multi-round tool execution.
 * @param params - The parameters for tool execution
 * @returns The continuation stream and tool results for optimistic local state updates
 */
async function executeToolsAndContinue(
  params: ExecuteToolsParams,
): Promise<ExecuteToolsResult> {
  const {
    event,
    toolTracker,
    registry,
    client,
    threadId,
    runId,
    userKey,
    additionalContext,
  } = params;

  const pendingToolCallIds = event.value.pendingToolCalls.map(
    (tc) => tc.toolCallId,
  );
  const toolCallsToExecute = toolTracker.getToolCallsById(pendingToolCallIds);

  // Execute tools
  const toolResults = await executeAllPendingTools(
    toolCallsToExecute,
    registry.toolRegistry,
  );

  // Clear executed tool calls before continuing
  toolTracker.clearToolCalls(pendingToolCallIds);

  // Return the continuation stream and tool results
  const stream = await client.threads.runs.run(threadId, {
    message: {
      role: "user",
      content: toolResults,
      additionalContext,
    },
    previousRunId: runId,
    availableComponents: toAvailableComponents(registry.componentList),
    tools: toAvailableTools(registry.toolRegistry),
    userKey,
  });

  return { stream, toolResults };
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
  const {
    client,
    threadId,
    message,
    registry,
    userKey,
    previousRunId,
    additionalContext,
  } = params;

  // Merge additional context into the message
  const messageWithContext: InputMessage = additionalContext
    ? { ...message, additionalContext }
    : message;

  // Convert registry components/tools to v1 API format
  const availableComponents = toAvailableComponents(registry.componentList);
  const availableTools = toAvailableTools(registry.toolRegistry);

  if (threadId) {
    // Run on existing thread
    const stream = await client.threads.runs.run(threadId, {
      message: messageWithContext,
      availableComponents,
      tools: availableTools,
      userKey,
      previousRunId,
    });
    return { stream, initialThreadId: threadId };
  } else {
    // Create new thread
    const stream = await client.threads.runs.create({
      message: messageWithContext,
      availableComponents,
      tools: availableTools,
      thread: userKey ? { userKey } : undefined,
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
  const streamState = useStreamState();
  const { userKey } = useTamboV1Config();
  const registry = useContext(TamboRegistryContext);
  const queryClient = useTamboQueryClient();
  const { getAdditionalContext } = useTamboContextHelpers();

  if (!registry) {
    throw new Error(
      "useTamboV1SendMessage must be used within TamboRegistryProvider",
    );
  }

  // Placeholder ID isn't a valid API thread ID - treat as new thread creation
  const isNewThread = isPlaceholderThreadId(threadId);
  const apiThreadId = isNewThread ? undefined : threadId;

  // Get previousRunId from the thread's streaming state (if thread exists and has messages)
  const threadState = apiThreadId
    ? streamState.threadMap[apiThreadId]
    : undefined;
  const previousRunId = threadState?.streaming.runId;

  return useTamboMutation({
    mutationFn: async (options: SendMessageOptions) => {
      const { message, userMessageText, debug = false } = options;

      const toolTracker = new ToolCallTracker();

      // Generate a stable message ID for the user message
      const userMessageId = userMessageText
        ? `user_msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
        : undefined;

      // Helper to add user message via synthetic AG-UI events
      const dispatchUserMessage = (targetThreadId: string) => {
        if (!userMessageText || !userMessageId) return;

        // TEXT_MESSAGE_START - creates the message
        dispatch({
          type: "EVENT",
          threadId: targetThreadId,
          event: {
            type: EventType.TEXT_MESSAGE_START,
            messageId: userMessageId,
            role: "user" as const,
          },
        });

        // TEXT_MESSAGE_CONTENT - adds the text content
        dispatch({
          type: "EVENT",
          threadId: targetThreadId,
          event: {
            type: EventType.TEXT_MESSAGE_CONTENT,
            messageId: userMessageId,
            delta: userMessageText,
          },
        });

        // TEXT_MESSAGE_END - marks the message as complete
        dispatch({
          type: "EVENT",
          threadId: targetThreadId,
          event: {
            type: EventType.TEXT_MESSAGE_END,
            messageId: userMessageId,
          },
        });
      };

      // Add user message immediately for instant feedback
      // Use threadId (which could be temp_xxx for new threads) for display
      if (threadId) {
        dispatchUserMessage(threadId);
      }

      // Gather additional context from all registered context helpers
      const helperContexts = await getAdditionalContext();
      const additionalContext: Record<string, unknown> = {};
      for (const helperContext of helperContexts) {
        additionalContext[helperContext.name] = helperContext.context;
      }

      // Create the run stream
      const { stream, initialThreadId } = await createRunStream({
        client,
        threadId: apiThreadId,
        message,
        registry,
        userKey,
        previousRunId,
        additionalContext,
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

              // For threads with no ID at all: add user message now that we have the real threadId
              // Note: temp thread migration (temp_xxx -> real ID) is handled automatically
              // by the reducer when it sees RUN_STARTED with a different threadId
              if (!threadId) {
                dispatchUserMessage(actualThreadId);
              }
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

          const { stream: continuationStream, toolResults } =
            await executeToolsAndContinue({
              event: pendingAwaitingInput,
              toolTracker,
              registry,
              client,
              threadId: actualThreadId,
              runId,
              userKey,
              additionalContext,
            });

          // Dispatch synthetic events for optimistic local state
          // The server doesn't echo these back for client-side tools
          // Tool results go in a new user message, similar to how user text is handled
          if (toolResults.length > 0) {
            const toolResultMessageId = `msg_tool_result_${Date.now()}`;

            // Create a new user message for tool results
            dispatch({
              type: "EVENT",
              threadId: actualThreadId,
              event: {
                type: EventType.TEXT_MESSAGE_START,
                messageId: toolResultMessageId,
                role: "user" as const,
              },
            });

            // Add tool results to the new message
            for (const result of toolResults) {
              dispatch({
                type: "EVENT",
                threadId: actualThreadId,
                event: {
                  type: EventType.TOOL_CALL_RESULT,
                  toolCallId: result.toolUseId,
                  messageId: toolResultMessageId,
                  // Extract text content from the result
                  content:
                    result.content
                      .filter((c) => c.type === "text")
                      .map((c) => (c as { type: "text"; text: string }).text)
                      .join("") || JSON.stringify(result.content),
                },
              });
            }

            // Mark the message as complete
            dispatch({
              type: "EVENT",
              threadId: actualThreadId,
              event: {
                type: EventType.TEXT_MESSAGE_END,
                messageId: toolResultMessageId,
              },
            });
          }

          currentStream = continuationStream;
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
