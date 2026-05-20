/**
 * Send Message Utilities
 *
 * Framework-agnostic functions for sending messages and handling streaming
 * responses. Extracted from the React SDK's useTamboSendMessage hook to enable
 * reuse across different UI frameworks.
 */

import { EventType } from "@ag-ui/core";
import type TamboAI from "@tambo-ai/typescript-sdk";
import type { Stream } from "@tambo-ai/typescript-sdk/core/streaming";
import type { ToolResultContent } from "@tambo-ai/typescript-sdk/resources/threads/threads";
import type { RunCreateParams } from "@tambo-ai/typescript-sdk/resources/threads/runs";

import type { RunAwaitingInputEvent } from "../types/event";
import type { InitialInputMessage, InputMessage } from "../types/message";
import type { ToolChoice } from "../types/tool-choice";
import type { StreamAction } from "./event-accumulator";
import type {
  ComponentRegistry,
  TamboToolRegistry,
} from "../model/component-metadata";
import { toAvailableComponents, toAvailableTools } from "./registry-conversion";
import { executeAllPendingTools } from "./tool-executor";
import type { ToolCallTracker } from "./tool-call-tracker";

/**
 * Stream type for run responses on an existing thread.
 */
export type RunStream = Stream<TamboAI.Threads.Runs.RunRunResponse>;

/**
 * Stream type for creating a new thread with a run.
 */
export type CreateStream = Stream<TamboAI.Threads.Runs.RunCreateResponse>;

/**
 * Options for sending a message.
 */
export interface SendMessageOptions {
  /** The message to send. */
  message: InputMessage;

  /**
   * User message text for optimistic display.
   * If provided, synthetic AG-UI events will be dispatched to show
   * the user message in the thread immediately after getting the threadId.
   */
  userMessageText?: string;

  /** Enable debug logging for the stream. */
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
 * Parameters for creating a run stream.
 */
export interface CreateRunStreamParams {
  client: TamboAI;
  threadId: string | undefined;
  message: InputMessage;
  componentList: ComponentRegistry;
  toolRegistry: TamboToolRegistry;
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
  /** How the model should use tools. */
  toolChoice?: ToolChoice;
  /**
   * Initial messages to seed the thread with when creating a new thread.
   * Only used when threadId is undefined (new thread creation).
   */
  initialMessages?: InitialInputMessage[];
}

/**
 * Result from creating a run stream.
 */
export interface CreateRunStreamResult {
  stream: RunStream | CreateStream;
  initialThreadId: string | undefined;
}

/**
 * Parameters for executing tools and continuing the run.
 */
export interface ExecuteToolsParams {
  event: RunAwaitingInputEvent;
  toolTracker: ToolCallTracker;
  toolRegistry: TamboToolRegistry;
  componentList: ComponentRegistry;
  client: TamboAI;
  threadId: string;
  runId: string;
  userKey: string | undefined;
  additionalContext?: Record<string, unknown>;
  toolChoice?: ToolChoice;
}

/**
 * Result from executing tools and continuing the run.
 */
export interface ExecuteToolsResult {
  stream: RunStream;
  toolResults: ToolResultContent[];
}

/**
 * Dispatches synthetic AG-UI events to show a user message in the thread.
 * @param dispatch - Stream state dispatcher
 * @param targetThreadId - Thread to add the message to
 * @param messageId - Stable ID for the user message
 * @param messageText - Text content of the message
 */
export function dispatchUserMessage(
  dispatch: (action: StreamAction) => void,
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
export function dispatchToolResults(
  dispatch: (action: StreamAction) => void,
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
            .map((c) => c.text)
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
    componentList,
    toolRegistry,
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
  const availableComponents = toAvailableComponents(componentList);
  const availableTools = toAvailableTools(toolRegistry);

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
 * Executes pending tools and returns a continuation stream.
 *
 * This function does NOT process the continuation stream - it just executes
 * the tools and returns the new stream for the caller to process. This enables
 * the flat loop pattern that correctly handles multi-round tool execution.
 * @param params - The parameters for tool execution
 * @returns The continuation stream and tool results for optimistic local state updates
 */
export async function executeToolsAndContinue(
  params: ExecuteToolsParams,
): Promise<ExecuteToolsResult> {
  const {
    event,
    toolTracker,
    toolRegistry,
    componentList,
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
    toolRegistry,
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
    availableComponents: toAvailableComponents(componentList),
    tools: toAvailableTools(toolRegistry),
    userKey,
    toolChoice,
  });

  return { stream, toolResults };
}
