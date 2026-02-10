"use client";

/**
 * Send Message Hook
 *
 * React Query mutation hook for sending messages and handling streaming responses.
 */

import React, { useContext } from "react";
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
import { useTamboConfig } from "../providers/tambo-v1-provider";
import { useTamboAuthState } from "./use-tambo-v1-auth-state";
import { useTamboContextHelpers } from "../../providers/tambo-context-helpers-provider";
import type { InitialInputMessage, InputMessage } from "../types/message";
import type { ToolChoice } from "../types/tool-choice";
import {
  isPlaceholderThreadId,
  type StreamAction,
} from "../utils/event-accumulator";
import {
  toAvailableComponents,
  toAvailableTools,
} from "../utils/registry-conversion";
import { handleEventStream } from "../utils/stream-handler";
import {
  executeAllPendingTools,
  createThrottledStreamableExecutor,
} from "../utils/tool-executor";
import type { ToolResultContent } from "@tambo-ai/typescript-sdk/resources/threads/threads";
import type { RunCreateParams } from "@tambo-ai/typescript-sdk/resources/threads/runs";
import { ToolCallTracker } from "../utils/tool-call-tracker";

/**
 * Dispatches synthetic AG-UI events to show a user message in the thread.
 * @param dispatch - Stream state dispatcher
 * @param targetThreadId - Thread to add the message to
 * @param messageId - Stable ID for the user message
 * @param messageText - Text content of the message
 */
function dispatchUserMessage(
  dispatch: React.Dispatch<StreamAction>,
  targetThreadId: string,
  messageId: string,
  messageText: string,
): void {
  dispatch({
    type: "EVENT",
    threadId: targetThreadId,
    event: {
      type: EventType.TEXT_MESSAGE_START,
      messageId,
      role: "user" as const,
    },
  });

  dispatch({
    type: "EVENT",
    threadId: targetThreadId,
    event: {
      type: EventType.TEXT_MESSAGE_CONTENT,
      messageId,
      delta: messageText,
    },
  });

  dispatch({
    type: "EVENT",
    threadId: targetThreadId,
    event: {
      type: EventType.TEXT_MESSAGE_END,
      messageId,
    },
  });
}

/**
 * Dispatches synthetic events for tool results as optimistic local state.
 * The server doesn't echo these back for client-side tools.
 * @param dispatch - Stream state dispatcher
 * @param targetThreadId - Thread to add results to
 * @param toolResults - Tool execution results to dispatch
 */
function dispatchToolResults(
  dispatch: React.Dispatch<StreamAction>,
  targetThreadId: string,
  toolResults: ToolResultContent[],
): void {
  if (toolResults.length === 0) return;

  const toolResultMessageId = `msg_tool_result_${Date.now()}`;

  dispatch({
    type: "EVENT",
    threadId: targetThreadId,
    event: {
      type: EventType.TEXT_MESSAGE_START,
      messageId: toolResultMessageId,
      role: "user" as const,
    },
  });

  for (const result of toolResults) {
    dispatch({
      type: "EVENT",
      threadId: targetThreadId,
      event: {
        type: EventType.TOOL_CALL_RESULT,
        toolCallId: result.toolUseId,
        messageId: toolResultMessageId,
        content:
          result.content
            .filter((c) => c.type === "text")
            .map((c) => (c as { type: "text"; text: string }).text)
            .join("") || JSON.stringify(result.content),
      },
    });
  }

  dispatch({
    type: "EVENT",
    threadId: targetThreadId,
    event: {
      type: EventType.TEXT_MESSAGE_END,
      messageId: toolResultMessageId,
    },
  });
}

/**
 * Checks whether a thread name should be auto-generated based on config
 * and the current thread state.
 * @param threadId - The thread ID (undefined or placeholder means no)
 * @param threadAlreadyHasName - Whether the thread already has a name
 * @param preMutationMessageCount - Message count before the current mutation
 * @param autoGenerateNameThreshold - Minimum message count to trigger generation
 * @returns Whether to generate a thread name
 */
function shouldGenerateThreadName(
  threadId: string | undefined,
  threadAlreadyHasName: boolean,
  preMutationMessageCount: number,
  autoGenerateNameThreshold: number,
): threadId is string {
  return (
    !threadAlreadyHasName &&
    !!threadId &&
    !isPlaceholderThreadId(threadId) &&
    // +2 accounts for the user message and assistant response just added
    preMutationMessageCount + 2 >= autoGenerateNameThreshold
  );
}

/**
 * Generates a thread name via the beta API, dispatches the name update,
 * and invalidates the thread list cache. Errors are logged, never thrown.
 * @param client - The Tambo API client
 * @param dispatch - Stream state dispatcher
 * @param queryClient - React Query client for cache invalidation
 * @param threadId - The thread to generate a name for
 */
async function generateThreadName(
  client: TamboAI,
  dispatch: React.Dispatch<StreamAction>,
  queryClient: ReturnType<typeof useTamboQueryClient>,
  threadId: string,
): Promise<void> {
  try {
    const threadWithName = await client.beta.threads.generateName(threadId);
    if (threadWithName.name) {
      dispatch({
        type: "UPDATE_THREAD_NAME",
        threadId,
        name: threadWithName.name,
      });
      await queryClient.invalidateQueries({
        queryKey: ["v1-threads", "list"],
      });
    }
  } catch (error) {
    console.error(
      "[useTamboSendMessage] Failed to auto-generate thread name:",
      error,
    );
  }
}

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

  /**
   * How the model should use tools. Defaults to "auto".
   * - "auto": Model decides whether to use tools
   * - "required": Model must use at least one tool
   * - "none": Model cannot use tools
   * - { name: "toolName" }: Model must use the specified tool
   */
  toolChoice?: ToolChoice;
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
  /**
   * How the model should use tools.
   */
  toolChoice?: ToolChoice;
  /**
   * Initial messages to seed the thread with when creating a new thread.
   * Only used when threadId is undefined (new thread creation).
   */
  initialMessages?: InitialInputMessage[];
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
  toolChoice?: ToolChoice;
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
    toolChoice,
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
    toolChoice,
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
    toolChoice,
    initialMessages,
  } = params;

  // Merge helper context with any caller-provided additionalContext on the message
  const mergedContext =
    additionalContext || message.additionalContext
      ? {
          ...((message.additionalContext as Record<string, unknown>) ?? {}),
          ...additionalContext,
        }
      : undefined;
  const messageWithContext: InputMessage = mergedContext
    ? { ...message, additionalContext: mergedContext }
    : message;

  // Convert registry components/tools to API format
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
      toolChoice,
    });
    return { stream, initialThreadId: threadId };
  } else {
    // Create new thread - include initialMessages if provided
    const threadConfig: RunCreateParams.Thread = {};
    if (userKey) {
      threadConfig.userKey = userKey;
    }
    if (initialMessages?.length) {
      threadConfig.initialMessages = initialMessages;
    }

    const stream = await client.threads.runs.create({
      message: messageWithContext,
      availableComponents,
      tools: availableTools,
      thread: Object.keys(threadConfig).length > 0 ? threadConfig : undefined,
      toolChoice,
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
 *   const sendMessage = useTamboSendMessage(threadId);
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
export function useTamboSendMessage(threadId?: string) {
  const client = useTamboClient();
  const dispatch = useStreamDispatch();
  const streamState = useStreamState();
  const {
    userKey,
    autoGenerateThreadName = true,
    autoGenerateNameThreshold = 3,
    initialMessages,
  } = useTamboConfig();
  const registry = useContext(TamboRegistryContext);
  const queryClient = useTamboQueryClient();
  const { getAdditionalContext } = useTamboContextHelpers();
  const authState = useTamboAuthState();

  if (!registry) {
    throw new Error(
      "useTamboSendMessage must be used within TamboRegistryProvider",
    );
  }

  // Placeholder ID isn't a valid API thread ID - treat as new thread creation
  const isNewThread = isPlaceholderThreadId(threadId);
  const apiThreadId = isNewThread ? undefined : threadId;

  // Get previousRunId from the thread's streaming state (active run) or
  // lastCompletedRunId (persisted after run finishes / loaded from API).
  // The latter is essential after page reload when streaming state is gone.
  const threadState = apiThreadId
    ? streamState.threadMap[apiThreadId]
    : undefined;
  const previousRunId =
    threadState?.streaming.runId ?? threadState?.lastCompletedRunId;

  return useTamboMutation({
    mutationFn: async (options: SendMessageOptions) => {
      if (authState.status !== "identified") {
        const messages: Record<string, string> = {
          unauthenticated:
            "Cannot send message: no userKey or userToken provided. " +
            "Configure authentication in TamboProvider.",
          exchanging:
            "Cannot send message: token exchange is still in progress. " +
            "Wait for authentication to complete.",
          error:
            "Cannot send message: token exchange failed. " +
            "Check your userToken configuration.",
          invalid:
            "Cannot send message: both userKey and userToken were provided. " +
            "You must provide one or the other, not both.",
        };
        throw new Error(messages[authState.status]);
      }

      const { message, userMessageText, debug = false, toolChoice } = options;

      // Capture pre-mutation state for auto thread name generation
      const existingThread = streamState.threadMap[apiThreadId ?? ""];
      const preMutationMessageCount =
        existingThread?.thread.messages.length ?? 0;
      const threadAlreadyHasName = !!existingThread?.thread.name;

      const toolTracker = new ToolCallTracker(registry.toolRegistry);
      const throttledStreamable = createThrottledStreamableExecutor(
        toolTracker,
        registry.toolRegistry,
      );

      // Generate a stable message ID for the user message
      const userMessageId = userMessageText
        ? `user_msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
        : undefined;

      // Add user message immediately for instant feedback
      // Use threadId (which could be temp_xxx for new threads) for display
      if (threadId && userMessageText && userMessageId) {
        dispatchUserMessage(dispatch, threadId, userMessageId, userMessageText);
      }

      // Gather additional context from all registered context helpers.
      // TODO: This snapshot is captured once and reused for the entire multi-round
      // tool loop. If interactables change during streaming (e.g. user interactions),
      // continuations will send stale context. Re-gather before each continuation
      // if freshness matters.
      const helperContexts = await getAdditionalContext();
      const additionalContext: Record<string, unknown> = {};
      for (const helperContext of helperContexts) {
        additionalContext[helperContext.name] = helperContext.context;
      }

      // Create the run stream
      // Include initialMessages only on first send (new thread creation)
      const { stream, initialThreadId } = await createRunStream({
        client,
        threadId: apiThreadId,
        message,
        registry,
        userKey,
        previousRunId,
        additionalContext,
        toolChoice,
        initialMessages: isNewThread ? initialMessages : undefined,
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
              if (!threadId && userMessageText && userMessageId) {
                dispatchUserMessage(
                  dispatch,
                  actualThreadId,
                  userMessageId,
                  userMessageText,
                );
              }
            } else if (!actualThreadId) {
              throw new Error(
                `Expected first event to be RUN_STARTED with threadId, got: ${event.type}`,
              );
            }

            toolTracker.handleEvent(event);

            // Parse partial JSON once for TOOL_CALL_ARGS — reused by both dispatch and streamable execution
            const parsedToolArgs =
              event.type === EventType.TOOL_CALL_ARGS
                ? toolTracker.parsePartialArgs(event.toolCallId)
                : undefined;

            dispatch({
              type: "EVENT",
              event,
              threadId: actualThreadId,
              parsedToolArgs,
              toolSchemas: toolTracker.toolSchemas,
            });

            // Schedule debounced streamable tool execution with the same pre-parsed args
            if (parsedToolArgs && event.type === EventType.TOOL_CALL_ARGS) {
              throttledStreamable.schedule(event.toolCallId, parsedToolArgs);
            }

            // Handle custom events
            if (event.type === EventType.CUSTOM) {
              const customEvent = asTamboCustomEvent(event);

              if (customEvent?.name === "tambo.run.awaiting_input") {
                pendingAwaitingInput = customEvent;
                break; // Exit stream loop to handle tool execution
              }
            }
          }

          // Flush any pending debounced streamable calls before continuing
          throttledStreamable.flush();

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
              toolChoice,
            });

          dispatchToolResults(dispatch, actualThreadId, toolResults);

          currentStream = continuationStream;
        }

        return {
          threadId: actualThreadId,
          preMutationMessageCount,
          threadAlreadyHasName,
        };
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
      await queryClient.invalidateQueries({
        queryKey: ["v1-threads", result.threadId],
      });

      if (
        autoGenerateThreadName &&
        shouldGenerateThreadName(
          result.threadId,
          result.threadAlreadyHasName,
          result.preMutationMessageCount,
          autoGenerateNameThreshold,
        )
      ) {
        await generateThreadName(
          client,
          dispatch,
          queryClient,
          result.threadId,
        );
      }
    },
    onError: (error) => {
      console.error("[useTamboSendMessage] Mutation failed:", error);
    },
  });
}
