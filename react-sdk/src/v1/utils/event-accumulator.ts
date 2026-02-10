/**
 * Event Accumulation Logic for Streaming API
 *
 * Implements a reducer that transforms AG-UI event streams into React state.
 * Used with useReducer to accumulate events into thread state.
 */

import type {
  AGUIEvent,
  CustomEvent,
  RunErrorEvent,
  RunFinishedEvent,
  RunStartedEvent,
  TextMessageContentEvent,
  TextMessageEndEvent,
  TextMessageStartEvent,
  ThinkingTextMessageContentEvent,
  ThinkingTextMessageEndEvent,
  ThinkingTextMessageStartEvent,
  ToolCallArgsEvent,
  ToolCallEndEvent,
  ToolCallResultEvent,
  ToolCallStartEvent,
} from "@ag-ui/core";
import { EventType } from "@ag-ui/core";
import {
  asTamboCustomEvent,
  type ComponentEndEvent,
  type ComponentPropsDeltaEvent,
  type ComponentStartEvent,
  type ComponentStateDeltaEvent,
  type RunAwaitingInputEvent,
} from "../types/event";
import type {
  Content,
  InitialInputMessage,
  TamboThreadMessage,
} from "../types/message";
import type { StreamingState, TamboThread } from "../types/thread";
import { parse as parsePartialJson } from "partial-json";
import { applyJsonPatch } from "./json-patch";

/**
 * Error thrown when an unreachable case is reached in a switch statement.
 * This indicates a programming error where not all cases were handled.
 */
export class UnreachableCaseError extends Error {
  constructor(value: never) {
    super(`Unreachable case: ${JSON.stringify(value)}`);
    this.name = "UnreachableCaseError";
  }
}

/**
 * Per-thread state managed by the stream reducer.
 * Tracks thread data, streaming status, and accumulating data.
 */
export interface ThreadState {
  thread: TamboThread;
  streaming: StreamingState;
  /**
   * Accumulating tool call arguments as JSON strings (for streaming).
   * Maps tool call ID to accumulated JSON string.
   */
  accumulatingToolArgs: Map<string, string>;
  /**
   * ID of the last completed run. Persists across the session so it's
   * available as `previousRunId` when sending follow-up messages, even
   * after the streaming state has been cleared (e.g., after page reload
   * and thread re-fetch).
   */
  lastCompletedRunId?: string;
}

/**
 * State managed by the stream reducer.
 * Maintains a map of all threads being tracked.
 */
export interface StreamState {
  /**
   * Map of thread ID to thread state
   */
  threadMap: Record<string, ThreadState>;

  /**
   * Current active thread ID (for UI context)
   */
  currentThreadId: string;
}

/**
 * Event action - dispatches an AG-UI event to update thread state.
 */
export interface EventAction {
  type: "EVENT";
  event: AGUIEvent;
  threadId: string;
  /** Pre-parsed partial JSON args for TOOL_CALL_ARGS events. Avoids double-parsing. */
  parsedToolArgs?: Record<string, unknown>;
}

/**
 * Initialize thread action - creates a new thread in the threadMap.
 */
export interface InitThreadAction {
  type: "INIT_THREAD";
  threadId: string;
  initialThread?: Partial<TamboThread>;
}

/**
 * Set current thread action - changes the active thread.
 */
export interface SetCurrentThreadAction {
  type: "SET_CURRENT_THREAD";
  threadId: string;
}

/**
 * Start new thread action - atomically creates and switches to a new thread.
 * This prevents race conditions when multiple calls happen concurrently.
 */
export interface StartNewThreadAction {
  type: "START_NEW_THREAD";
  threadId: string;
  initialThread?: Partial<TamboThread>;
}

/**
 * Load thread messages action - loads messages from API into stream state.
 * Used when switching to an existing thread to populate its messages.
 */
export interface LoadThreadMessagesAction {
  type: "LOAD_THREAD_MESSAGES";
  threadId: string;
  messages: TamboThreadMessage[];
  /**
   * If true, skip loading if the thread is currently streaming.
   * This prevents overwriting in-flight streaming messages.
   */
  skipIfStreaming?: boolean;
}

/**
 * Set last completed run ID action - stores metadata from the API
 * so it can be used as `previousRunId` for follow-up messages.
 */
export interface SetLastCompletedRunIdAction {
  type: "SET_LAST_COMPLETED_RUN_ID";
  threadId: string;
  lastCompletedRunId: string;
}

/**
 * Update thread name action - sets the name on a thread.
 * Used after auto-generating a thread name via the API.
 */
export interface UpdateThreadNameAction {
  type: "UPDATE_THREAD_NAME";
  threadId: string;
  name: string;
}

/**
 * Action type for the stream reducer.
 */
export type StreamAction =
  | EventAction
  | InitThreadAction
  | SetCurrentThreadAction
  | StartNewThreadAction
  | LoadThreadMessagesAction
  | SetLastCompletedRunIdAction
  | UpdateThreadNameAction;

/**
 * Initial streaming state.
 */
const initialStreamingState: StreamingState = {
  status: "idle",
};

/**
 * Create initial thread state for a new thread.
 * @param threadId - Unique thread identifier
 * @returns Initial thread state
 */
export function createInitialThreadState(threadId: string): ThreadState {
  const now = new Date().toISOString();
  return {
    thread: {
      id: threadId,
      messages: [],
      status: "idle",
      createdAt: now,
      updatedAt: now,
      lastRunCancelled: false,
    },
    streaming: initialStreamingState,
    accumulatingToolArgs: new Map(),
  };
}

/**
 * Placeholder thread ID used for new threads before they get a real ID from the server.
 * This allows optimistic UI updates (showing user messages immediately) before the
 * server responds with the actual thread ID.
 */
export const PLACEHOLDER_THREAD_ID = "placeholder";

/**
 * Check if a thread ID is a placeholder (not a real API thread ID).
 * @param threadId - Thread ID to check
 * @returns True if this is a placeholder thread ID
 */
export function isPlaceholderThreadId(
  threadId: string | null | undefined,
): boolean {
  return threadId === PLACEHOLDER_THREAD_ID;
}

/**
 * Create initial stream state with placeholder thread.
 * @returns Initial stream state
 */
export function createInitialState(): StreamState {
  return {
    threadMap: {
      [PLACEHOLDER_THREAD_ID]: createInitialThreadState(PLACEHOLDER_THREAD_ID),
    },
    currentThreadId: PLACEHOLDER_THREAD_ID,
  };
}

/**
 * Create initial stream state with placeholder thread seeded with initial messages.
 * The messages are converted from InputMessage format to TamboThreadMessage format
 * for immediate UI display before any API call.
 * @param initialMessages - Messages to seed the placeholder thread with
 * @returns Initial stream state with messages in the placeholder thread
 */
export function createInitialStateWithMessages(
  initialMessages: InitialInputMessage[],
): StreamState {
  const placeholderState = createInitialThreadState(PLACEHOLDER_THREAD_ID);
  const messages: TamboThreadMessage[] = initialMessages.map((msg) => ({
    id: `initial_${crypto.randomUUID()}`,
    role: msg.role,
    content: msg.content.map((c): Content => {
      if (c.type === "text") {
        return { type: "text" as const, text: c.text };
      }
      return c as Content;
    }),
  }));

  return {
    threadMap: {
      [PLACEHOLDER_THREAD_ID]: {
        ...placeholderState,
        thread: {
          ...placeholderState.thread,
          messages,
        },
      },
    },
    currentThreadId: PLACEHOLDER_THREAD_ID,
  };
}

// ============================================================================
// Helper Functions for Immutable State Updates
// ============================================================================

/**
 * Location of a content block within messages.
 */
interface ContentLocation {
  messageIndex: number;
  contentIndex: number;
}

/**
 * Replace a message at a specific index immutably.
 * @param messages - Current messages array
 * @param index - Index of message to replace
 * @param updatedMessage - New message to insert
 * @returns New messages array with the message replaced
 */
function updateMessageAtIndex(
  messages: TamboThreadMessage[],
  index: number,
  updatedMessage: TamboThreadMessage,
): TamboThreadMessage[] {
  return [
    ...messages.slice(0, index),
    updatedMessage,
    ...messages.slice(index + 1),
  ];
}

/**
 * Replace a content block at a specific index within a message's content immutably.
 * @param content - Current content array
 * @param index - Index of content to replace
 * @param updatedContent - New content to insert
 * @returns New content array with the content replaced
 */
function updateContentAtIndex(
  content: Content[],
  index: number,
  updatedContent: Content,
): Content[] {
  return [
    ...content.slice(0, index),
    updatedContent,
    ...content.slice(index + 1),
  ];
}

/**
 * Find a content block by ID across all messages, searching from most recent.
 *
 * TODO: This is O(n*m) where n = messages and m = content blocks per message.
 * For high-frequency streaming with many messages, consider maintaining an
 * index map of contentId -> {messageIndex, contentIndex} that gets updated
 * when content blocks are created.
 * @param messages - Messages to search
 * @param contentType - Type of content to find ("component" or "tool_use")
 * @param contentId - ID of the content block
 * @param eventName - Name of the event (for error messages)
 * @returns Location of the content block
 * @throws {Error} If content not found
 */
function findContentById(
  messages: TamboThreadMessage[],
  contentType: "component" | "tool_use",
  contentId: string,
  eventName: string,
): ContentLocation {
  for (let i = messages.length - 1; i >= 0; i--) {
    const idx = messages[i].content.findIndex(
      (c) => c.type === contentType && c.id === contentId,
    );
    if (idx !== -1) {
      return { messageIndex: i, contentIndex: idx };
    }
  }
  throw new Error(`${contentType} ${contentId} not found for ${eventName}`);
}

/**
 * Create updated thread state with new messages.
 * @param threadState - Current thread state
 * @param messages - New messages array
 * @returns Updated thread state
 */
function updateThreadMessages(
  threadState: ThreadState,
  messages: TamboThreadMessage[],
): ThreadState {
  return {
    ...threadState,
    thread: {
      ...threadState.thread,
      messages,
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Stream reducer that accumulates events into thread state.
 *
 * This reducer handles all AG-UI events and Tambo custom events,
 * transforming them into immutable state updates per thread.
 * @param state - Current stream state
 * @param action - Action to process
 * @returns Updated stream state
 */
export function streamReducer(
  state: StreamState,
  action: StreamAction,
): StreamState {
  // Handle non-event actions first
  switch (action.type) {
    case "INIT_THREAD": {
      const { threadId, initialThread } = action;
      // Don't overwrite existing thread
      if (state.threadMap[threadId]) {
        return state;
      }
      const baseState = createInitialThreadState(threadId);
      const threadState = initialThread
        ? {
            ...baseState,
            thread: {
              ...baseState.thread,
              ...initialThread,
              id: threadId,
            },
          }
        : baseState;
      return {
        ...state,
        threadMap: {
          ...state.threadMap,
          [threadId]: threadState,
        },
      };
    }

    case "SET_CURRENT_THREAD": {
      return {
        ...state,
        currentThreadId: action.threadId,
      };
    }

    case "START_NEW_THREAD": {
      // Atomic action: initialize thread AND set as current in one reducer pass
      // This prevents race conditions when multiple startNewThread() calls happen
      const { threadId, initialThread } = action;
      // Don't overwrite existing thread
      if (state.threadMap[threadId]) {
        return {
          ...state,
          currentThreadId: threadId,
        };
      }
      const baseState = createInitialThreadState(threadId);
      const threadState = initialThread
        ? {
            ...baseState,
            thread: {
              ...baseState.thread,
              ...initialThread,
              id: threadId,
            },
          }
        : baseState;
      return {
        ...state,
        threadMap: {
          ...state.threadMap,
          [threadId]: threadState,
        },
        currentThreadId: threadId,
      };
    }

    case "LOAD_THREAD_MESSAGES": {
      return handleLoadThreadMessages(state, action);
    }

    case "SET_LAST_COMPLETED_RUN_ID": {
      const threadState =
        state.threadMap[action.threadId] ??
        createInitialThreadState(action.threadId);
      return {
        ...state,
        threadMap: {
          ...state.threadMap,
          [action.threadId]: {
            ...threadState,
            lastCompletedRunId: action.lastCompletedRunId,
          },
        },
      };
    }

    case "UPDATE_THREAD_NAME": {
      const threadState = state.threadMap[action.threadId];
      if (!threadState) {
        return state;
      }
      return {
        ...state,
        threadMap: {
          ...state.threadMap,
          [action.threadId]: {
            ...threadState,
            thread: {
              ...threadState.thread,
              name: action.name,
            },
          },
        },
      };
    }

    case "EVENT":
      // Fall through to event handling below
      break;
  }

  // Handle EVENT action
  const { event, threadId } = action;
  const effectiveThreadId =
    event.type === EventType.RUN_STARTED ? event.threadId : threadId;

  // Get the current thread state, auto-initializing if needed
  // Auto-initialization handles the case where events arrive before explicit thread init
  // (e.g., when creating a new thread and RUN_STARTED is the first event)
  let threadState = state.threadMap[effectiveThreadId];
  let updatedState = state;

  if (!threadState) {
    // Auto-initialize the thread to avoid dropping events
    threadState = createInitialThreadState(effectiveThreadId);
    updatedState = {
      ...state,
      threadMap: {
        ...state.threadMap,
        [effectiveThreadId]: threadState,
      },
    };
  }

  // Handle placeholder thread migration for RUN_STARTED events
  // When a new thread is created, messages may have been added to the placeholder thread
  // for immediate UI feedback. Now that we have the real threadId, migrate those messages.
  if (
    event.type === EventType.RUN_STARTED &&
    effectiveThreadId !== PLACEHOLDER_THREAD_ID
  ) {
    const placeholderState = updatedState.threadMap[PLACEHOLDER_THREAD_ID];
    if (placeholderState?.thread.messages.length) {
      // Prepend placeholder thread messages to the real thread
      threadState = {
        ...threadState,
        thread: {
          ...threadState.thread,
          messages: [
            ...placeholderState.thread.messages,
            ...threadState.thread.messages,
          ],
        },
      };

      // Reset placeholder thread to empty state
      const resetPlaceholder = createInitialThreadState(PLACEHOLDER_THREAD_ID);
      updatedState = {
        ...updatedState,
        threadMap: {
          ...updatedState.threadMap,
          [PLACEHOLDER_THREAD_ID]: resetPlaceholder,
          [effectiveThreadId]: threadState,
        },
        // Only switch selection if the user is currently on the placeholder thread
        currentThreadId: isPlaceholderThreadId(updatedState.currentThreadId)
          ? effectiveThreadId
          : updatedState.currentThreadId,
      };
    }
  }

  // Process the event for this specific thread
  let updatedThreadState: ThreadState;

  // Switch on event.type - AGUIEvent is a discriminated union so TypeScript
  // automatically narrows the type in each case branch
  switch (event.type) {
    case EventType.RUN_STARTED:
      updatedThreadState = handleRunStarted(threadState, event);
      break;

    case EventType.RUN_FINISHED:
      updatedThreadState = handleRunFinished(threadState, event);
      break;

    case EventType.RUN_ERROR:
      updatedThreadState = handleRunError(threadState, event);
      break;

    case EventType.TEXT_MESSAGE_START:
      updatedThreadState = handleTextMessageStart(threadState, event);
      break;

    case EventType.TEXT_MESSAGE_CONTENT:
      updatedThreadState = handleTextMessageContent(threadState, event);
      break;

    case EventType.TEXT_MESSAGE_END:
      updatedThreadState = handleTextMessageEnd(threadState, event);
      break;

    case EventType.TOOL_CALL_START:
      updatedThreadState = handleToolCallStart(threadState, event);
      break;

    case EventType.TOOL_CALL_ARGS:
      updatedThreadState = handleToolCallArgs(
        threadState,
        event,
        action.parsedToolArgs,
      );
      break;

    case EventType.TOOL_CALL_END:
      updatedThreadState = handleToolCallEnd(threadState, event);
      break;

    case EventType.TOOL_CALL_RESULT:
      updatedThreadState = handleToolCallResult(threadState, event);
      break;

    case EventType.CUSTOM:
      updatedThreadState = handleCustomEvent(threadState, event);
      break;

    case EventType.THINKING_TEXT_MESSAGE_START:
      updatedThreadState = handleThinkingTextMessageStart(threadState, event);
      break;

    case EventType.THINKING_TEXT_MESSAGE_CONTENT:
      updatedThreadState = handleThinkingTextMessageContent(threadState, event);
      break;

    case EventType.THINKING_TEXT_MESSAGE_END:
      updatedThreadState = handleThinkingTextMessageEnd(threadState, event);
      break;

    // Unsupported AG-UI event types - may be added in future phases
    case EventType.TEXT_MESSAGE_CHUNK:
    case EventType.TOOL_CALL_CHUNK:
    case EventType.THINKING_START:
    case EventType.THINKING_END:
    case EventType.STATE_SNAPSHOT:
    case EventType.STATE_DELTA:
    case EventType.MESSAGES_SNAPSHOT:
    case EventType.ACTIVITY_SNAPSHOT:
    case EventType.ACTIVITY_DELTA:
    case EventType.RAW:
    case EventType.STEP_STARTED:
    case EventType.STEP_FINISHED:
      // Log warning - these events are being ignored

      console.warn(
        `[StreamReducer] Received unsupported event type: ${event.type}. ` +
          `This event will be ignored.`,
      );
      return updatedState;

    default: {
      // Exhaustiveness check: if a new event type is added to AGUIEvent
      // and not handled above, TypeScript will error here
      const _exhaustiveCheck: never = event;
      throw new UnreachableCaseError(_exhaustiveCheck);
    }
  }

  // Return updated state with modified thread
  return {
    ...updatedState,
    threadMap: {
      ...updatedState.threadMap,
      [effectiveThreadId]: updatedThreadState,
    },
  };
}

/**
 * Handle RUN_STARTED event.
 * @param threadState - Current thread state
 * @param event - Run started event
 * @returns Updated thread state
 */
function handleRunStarted(
  threadState: ThreadState,
  event: RunStartedEvent,
): ThreadState {
  return {
    ...threadState,
    thread: {
      ...threadState.thread,
      status: "streaming",
      updatedAt: new Date().toISOString(),
      // Reset lastRunCancelled when a new run starts
      lastRunCancelled: false,
    },
    streaming: {
      status: "streaming",
      runId: event.runId,
      startTime: event.timestamp ?? Date.now(),
    },
  };
}

/**
 * Handle RUN_FINISHED event.
 * @param threadState - Current thread state
 * @param event - Run finished event containing the completed run's ID
 * @returns Updated thread state
 */
function handleRunFinished(
  threadState: ThreadState,
  event: RunFinishedEvent,
): ThreadState {
  return {
    ...threadState,
    lastCompletedRunId:
      event.runId ??
      threadState.streaming.runId ??
      threadState.lastCompletedRunId,
    thread: {
      ...threadState.thread,
      status: "idle",
      updatedAt: new Date().toISOString(),
    },
    streaming: {
      ...threadState.streaming,
      status: "idle",
    },
  };
}

/**
 * Handle RUN_ERROR event.
 * Sets lastRunCancelled if the error code is "CANCELLED".
 * @param threadState - Current thread state
 * @param event - Run error event
 * @returns Updated thread state
 */
function handleRunError(
  threadState: ThreadState,
  event: RunErrorEvent,
): ThreadState {
  const isCancelled = event.code === "CANCELLED";

  return {
    ...threadState,
    thread: {
      ...threadState.thread,
      status: "idle",
      updatedAt: new Date().toISOString(),
      lastRunCancelled: isCancelled,
    },
    streaming: {
      ...threadState.streaming,
      status: "idle",
      error: isCancelled
        ? undefined
        : {
            message: event.message,
            code: event.code,
          },
    },
  };
}

/**
 * Handle TEXT_MESSAGE_START event.
 * Creates a new message or reuses an ephemeral reasoning message.
 * @param threadState - Current thread state
 * @param event - Text message start event
 * @returns Updated thread state
 */
function handleTextMessageStart(
  threadState: ThreadState,
  event: TextMessageStartEvent,
): ThreadState {
  const isAssistant = event.role !== "user";
  const messages = threadState.thread.messages;

  // For assistant messages, check if there's an ephemeral message with reasoning
  // that we should merge into instead of creating a new message.
  if (isAssistant) {
    const ephemeralIndex = messages.findIndex(
      (m) =>
        m.role === "assistant" &&
        m.id.startsWith("ephemeral_") &&
        m.reasoning &&
        m.reasoning.length > 0,
    );

    if (ephemeralIndex !== -1) {
      // Update the ephemeral message with the real ID
      const ephemeralMessage = messages[ephemeralIndex];
      const updatedMessages = [...messages];
      updatedMessages[ephemeralIndex] = {
        ...ephemeralMessage,
        id: event.messageId,
      };

      return {
        ...threadState,
        thread: {
          ...threadState.thread,
          messages: updatedMessages,
          updatedAt: new Date().toISOString(),
        },
        streaming: {
          ...threadState.streaming,
          messageId: event.messageId,
        },
      };
    }
  }

  // No ephemeral message to reuse - create a new message
  const newMessage: TamboThreadMessage = {
    id: event.messageId,
    role: isAssistant ? "assistant" : "user",
    content: [],
    createdAt: new Date().toISOString(),
  };

  return {
    ...threadState,
    thread: {
      ...threadState.thread,
      messages: [...messages, newMessage],
      updatedAt: new Date().toISOString(),
    },
    streaming: {
      ...threadState.streaming,
      messageId: event.messageId,
    },
  };
}

/**
 * Handle TEXT_MESSAGE_CONTENT event.
 * Appends text content to the current message.
 * @param threadState - Current thread state
 * @param event - Text message content event
 * @returns Updated thread state
 */
function handleTextMessageContent(
  threadState: ThreadState,
  event: TextMessageContentEvent,
): ThreadState {
  const messageId = event.messageId;
  const messages = threadState.thread.messages;

  // Find the message to update
  const messageIndex = messages.findIndex((m) => m.id === messageId);
  if (messageIndex === -1) {
    throw new Error(
      `Message ${messageId} not found for TEXT_MESSAGE_CONTENT event`,
    );
  }

  const message = messages[messageIndex];
  const content = message.content;

  // Find or create text content block
  const lastContent = content[content.length - 1];
  const isTextBlock = lastContent?.type === "text";

  const updatedContent: Content[] = isTextBlock
    ? [
        ...content.slice(0, -1),
        {
          ...lastContent,
          text: lastContent.text + event.delta,
        },
      ]
    : [
        ...content,
        {
          type: "text",
          text: event.delta,
        },
      ];

  const updatedMessage: TamboThreadMessage = {
    ...message,
    content: updatedContent,
  };

  return updateThreadMessages(
    threadState,
    updateMessageAtIndex(messages, messageIndex, updatedMessage),
  );
}

/**
 * Handle TEXT_MESSAGE_END event.
 * Marks the message as complete.
 * @param threadState - Current thread state
 * @param event - Text message end event
 * @returns Updated thread state
 */
function handleTextMessageEnd(
  threadState: ThreadState,
  event: TextMessageEndEvent,
): ThreadState {
  const activeMessageId = threadState.streaming.messageId;

  if (activeMessageId && event.messageId !== activeMessageId) {
    throw new Error(
      `TEXT_MESSAGE_END messageId mismatch (thread ${threadState.thread.id}): expected ${activeMessageId}, got ${event.messageId}`,
    );
  }

  return {
    ...threadState,
    streaming: {
      ...threadState.streaming,
      messageId: undefined,
    },
  };
}

/**
 * Handle TOOL_CALL_START event.
 * Adds a tool use content block to the current message.
 * If no message exists, creates a synthetic assistant message to hold the tool call.
 * @param threadState - Current thread state
 * @param event - Tool call start event
 * @returns Updated thread state
 */
function handleToolCallStart(
  threadState: ThreadState,
  event: ToolCallStartEvent,
): ThreadState {
  const messageId = event.parentMessageId;
  const messages = threadState.thread.messages;

  // Find the parent message for this tool call.
  // If parentMessageId is provided, look it up directly.
  // Otherwise fall back to the last message, but only if it's an assistant message.
  // If the last message isn't assistant (e.g. it's the user message and the LLM
  // didn't produce any text before the tool call), we'll create a synthetic
  // assistant message below.
  let messageIndex: number;
  if (messageId) {
    messageIndex = messages.findIndex((m) => m.id === messageId);
  } else {
    const lastIndex = messages.length - 1;
    messageIndex =
      lastIndex >= 0 && messages[lastIndex].role === "assistant"
        ? lastIndex
        : -1;
  }

  const newContent: Content = {
    type: "tool_use",
    id: event.toolCallId,
    name: event.toolCallName,
    input: {},
  };

  // If no suitable assistant message found, create a synthetic one for the tool call
  if (messageIndex === -1) {
    const syntheticMessageId = messageId ?? `msg_tool_${event.toolCallId}`;
    const syntheticMessage: TamboThreadMessage = {
      id: syntheticMessageId,
      role: "assistant",
      content: [newContent],
      createdAt: new Date().toISOString(),
    };

    return {
      ...threadState,
      thread: {
        ...threadState.thread,
        messages: [...messages, syntheticMessage],
        updatedAt: new Date().toISOString(),
      },
      streaming: {
        ...threadState.streaming,
        messageId: syntheticMessageId,
      },
    };
  }

  const message = messages[messageIndex];

  const updatedMessage: TamboThreadMessage = {
    ...message,
    content: [...message.content, newContent],
  };

  return updateThreadMessages(
    threadState,
    updateMessageAtIndex(messages, messageIndex, updatedMessage),
  );
}

/**
 * Handle TOOL_CALL_ARGS event.
 * Accumulates JSON string deltas for tool call arguments and optimistically
 * parses the partial JSON to update the tool_use content block in real-time.
 * The final authoritative parse still happens at TOOL_CALL_END.
 * @param threadState - Current thread state
 * @param event - Tool call args event
 * @returns Updated thread state
 */
function handleToolCallArgs(
  threadState: ThreadState,
  event: ToolCallArgsEvent,
  parsedToolArgs?: Record<string, unknown>,
): ThreadState {
  const toolCallId = event.toolCallId;

  // Accumulate the JSON string delta
  const accumulatedArgs = threadState.accumulatingToolArgs;
  const existingArgs = accumulatedArgs.get(toolCallId) ?? "";
  const newAccumulatedJson = existingArgs + event.delta;
  const newAccumulatedArgs = new Map(accumulatedArgs);
  newAccumulatedArgs.set(toolCallId, newAccumulatedJson);

  // Use pre-parsed args if provided, otherwise parse partial JSON ourselves
  let parsedInput: Record<string, unknown> | undefined = parsedToolArgs;
  if (!parsedInput) {
    try {
      const parsed: unknown = parsePartialJson(newAccumulatedJson);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        parsedInput = parsed as Record<string, unknown>;
      }
    } catch {
      // Partial JSON not parseable yet — leave input unchanged
    }
  }

  if (!parsedInput) {
    return {
      ...threadState,
      accumulatingToolArgs: newAccumulatedArgs,
    };
  }

  // Update the tool_use content block with partially parsed input
  const messages = threadState.thread.messages;
  const { messageIndex, contentIndex } = findContentById(
    messages,
    "tool_use",
    toolCallId,
    "TOOL_CALL_ARGS event",
  );

  const message = messages[messageIndex];
  const toolUseContent = message.content[contentIndex];

  if (toolUseContent.type !== "tool_use") {
    throw new Error(
      `Content at index ${contentIndex} is not a tool_use block for TOOL_CALL_ARGS event`,
    );
  }

  const updatedContent: Content = {
    ...toolUseContent,
    input: parsedInput,
  };

  const updatedMessage: TamboThreadMessage = {
    ...message,
    content: updateContentAtIndex(
      message.content,
      contentIndex,
      updatedContent,
    ),
  };

  return {
    ...updateThreadMessages(
      threadState,
      updateMessageAtIndex(messages, messageIndex, updatedMessage),
    ),
    accumulatingToolArgs: newAccumulatedArgs,
  };
}

/**
 * Handle TOOL_CALL_END event.
 * Parses the accumulated JSON arguments and updates the tool_use content block.
 * @param threadState - Current thread state
 * @param event - Tool call end event
 * @returns Updated thread state
 */
function handleToolCallEnd(
  threadState: ThreadState,
  event: ToolCallEndEvent,
): ThreadState {
  const toolCallId = event.toolCallId;
  const messages = threadState.thread.messages;

  // Get accumulated JSON args string
  const accumulatedJson = threadState.accumulatingToolArgs.get(toolCallId);
  if (!accumulatedJson) {
    // No args accumulated - tool call has empty input
    return threadState;
  }

  // Parse the accumulated JSON - tool inputs are always objects
  let parsedInput: Record<string, unknown>;
  try {
    parsedInput = JSON.parse(accumulatedJson) as Record<string, unknown>;
  } catch (error) {
    throw new Error(
      `Failed to parse tool call arguments for ${toolCallId}: ${error instanceof Error ? error.message : String(error)}. JSON: ${accumulatedJson}`,
    );
  }

  // Find the tool_use content block
  const { messageIndex, contentIndex } = findContentById(
    messages,
    "tool_use",
    toolCallId,
    "TOOL_CALL_END event",
  );

  const message = messages[messageIndex];
  const toolUseContent = message.content[contentIndex];

  if (toolUseContent.type !== "tool_use") {
    throw new Error(
      `Content at index ${contentIndex} is not a tool_use block for TOOL_CALL_END event`,
    );
  }

  // Update the tool_use content with parsed input
  const updatedContent: Content = {
    ...toolUseContent,
    input: parsedInput,
  };

  const updatedMessage: TamboThreadMessage = {
    ...message,
    content: updateContentAtIndex(
      message.content,
      contentIndex,
      updatedContent,
    ),
  };

  // Clear accumulated args for this tool call
  const newAccumulatingToolArgs = new Map(threadState.accumulatingToolArgs);
  newAccumulatingToolArgs.delete(toolCallId);

  return {
    ...updateThreadMessages(
      threadState,
      updateMessageAtIndex(messages, messageIndex, updatedMessage),
    ),
    accumulatingToolArgs: newAccumulatingToolArgs,
  };
}

/**
 * Handle TOOL_CALL_RESULT event.
 * Adds tool result to the specified message.
 * @param threadState - Current thread state
 * @param event - Tool call result event
 * @returns Updated thread state
 */
function handleToolCallResult(
  threadState: ThreadState,
  event: ToolCallResultEvent,
): ThreadState {
  const messageId = event.messageId;
  const messages = threadState.thread.messages;

  // Find the message
  const messageIndex = messages.findIndex((m) => m.id === messageId);
  if (messageIndex === -1) {
    throw new Error(
      `Message ${messageId} not found for TOOL_CALL_RESULT event`,
    );
  }

  const message = messages[messageIndex];

  // Add tool result content
  const newContent: Content = {
    type: "tool_result",
    toolUseId: event.toolCallId,
    content: [
      {
        type: "text",
        text: event.content,
      },
    ],
  };

  const updatedMessage: TamboThreadMessage = {
    ...message,
    content: [...message.content, newContent],
  };

  return updateThreadMessages(
    threadState,
    updateMessageAtIndex(messages, messageIndex, updatedMessage),
  );
}

/**
 * Handle custom events (Tambo-specific).
 * @param threadState - Current thread state
 * @param event - Custom event (already narrowed from AGUIEvent)
 * @returns Updated thread state
 */
function handleCustomEvent(
  threadState: ThreadState,
  event: CustomEvent,
): ThreadState {
  // Use centralized casting function to get properly typed Tambo event
  const customEvent = asTamboCustomEvent(event);

  if (!customEvent) {
    // Unknown custom event - log and return unchanged
    console.warn(`[StreamReducer] Unknown custom event name: ${event.name}`);
    return threadState;
  }

  switch (customEvent.name) {
    case "tambo.component.start":
      return handleComponentStart(threadState, customEvent);

    case "tambo.component.props_delta":
      return handleComponentDelta(threadState, customEvent, "props");

    case "tambo.component.state_delta":
      return handleComponentDelta(threadState, customEvent, "state");

    case "tambo.component.end":
      return handleComponentEnd(threadState, customEvent);

    case "tambo.run.awaiting_input":
      return handleRunAwaitingInput(threadState, customEvent);

    default: {
      // Exhaustiveness check: if a new event type is added to TamboCustomEvent
      // and not handled here, TypeScript will error
      const _exhaustiveCheck: never = customEvent;
      throw new UnreachableCaseError(_exhaustiveCheck);
    }
  }
}

/**
 * Handle tambo.component.start event.
 * Adds a component content block to the message with 'started' streaming state.
 * @param threadState - Current thread state
 * @param event - Component start event
 * @returns Updated thread state
 */
function handleComponentStart(
  threadState: ThreadState,
  event: ComponentStartEvent,
): ThreadState {
  const messageId = event.value.messageId;
  let messages = threadState.thread.messages;

  // Find the message, or create it if it doesn't exist.
  // The backend may emit component events before TEXT_MESSAGE_START when
  // the LLM outputs a component tool call without preceding text.
  let messageIndex = messages.findIndex((m) => m.id === messageId);
  if (messageIndex === -1) {
    // Create a new assistant message for this component
    const newMessage: TamboThreadMessage = {
      id: messageId,
      role: "assistant",
      content: [],
      createdAt: new Date().toISOString(),
    };
    messages = [...messages, newMessage];
    messageIndex = messages.length - 1;

    // Update thread state with the new message before adding the component
    threadState = updateThreadMessages(threadState, messages);
  }

  const message = messages[messageIndex];

  // Add component content block with 'started' streaming state
  const newContent: Content = {
    type: "component",
    id: event.value.componentId,
    name: event.value.componentName,
    props: {},
    streamingState: "started",
  };

  const updatedMessage: TamboThreadMessage = {
    ...message,
    content: [...message.content, newContent],
  };

  return updateThreadMessages(
    threadState,
    updateMessageAtIndex(messages, messageIndex, updatedMessage),
  );
}

/**
 * Handle component delta events (both props_delta and state_delta).
 * Applies JSON Patch to the specified field and sets streamingState to 'streaming'.
 * @param threadState - Current thread state
 * @param event - Component delta event (props or state)
 * @param field - Which field to update ('props' or 'state')
 * @returns Updated thread state
 */
function handleComponentDelta(
  threadState: ThreadState,
  event: ComponentPropsDeltaEvent | ComponentStateDeltaEvent,
  field: "props" | "state",
): ThreadState {
  const componentId = event.value.componentId;
  const operations = event.value.operations;
  const messages = threadState.thread.messages;
  const eventName = `tambo.component.${field}_delta`;

  // Find the component content block
  const { messageIndex, contentIndex } = findContentById(
    messages,
    "component",
    componentId,
    `${eventName} event`,
  );

  const message = messages[messageIndex];
  const componentContent = message.content[contentIndex];

  if (componentContent.type !== "component") {
    throw new Error(
      `Content at index ${contentIndex} is not a component block for ${eventName} event`,
    );
  }

  // Get current value (state defaults to {} if undefined)
  const currentValue =
    field === "props"
      ? (componentContent.props as Record<string, unknown>)
      : ((componentContent.state as Record<string, unknown>) ?? {});

  // Apply JSON Patch
  const updatedValue = applyJsonPatch(currentValue, operations);

  // Update field and set streaming state to 'streaming'
  const updatedContent: Content = {
    ...componentContent,
    [field]: updatedValue,
    streamingState: "streaming",
  };

  const updatedMessage: TamboThreadMessage = {
    ...message,
    content: updateContentAtIndex(
      message.content,
      contentIndex,
      updatedContent,
    ),
  };

  return updateThreadMessages(
    threadState,
    updateMessageAtIndex(messages, messageIndex, updatedMessage),
  );
}

/**
 * Handle tambo.component.end event.
 * Sets component streaming state to 'done'.
 * @param threadState - Current thread state
 * @param event - Component end event
 * @returns Updated thread state
 */
function handleComponentEnd(
  threadState: ThreadState,
  event: ComponentEndEvent,
): ThreadState {
  const componentId = event.value.componentId;
  const messages = threadState.thread.messages;

  // Find the component content block
  const { messageIndex, contentIndex } = findContentById(
    messages,
    "component",
    componentId,
    "tambo.component.end event",
  );

  const message = messages[messageIndex];
  const componentContent = message.content[contentIndex];

  if (componentContent.type !== "component") {
    throw new Error(
      `Content at index ${contentIndex} is not a component block for tambo.component.end event`,
    );
  }

  // Set streaming state to 'done'
  const updatedContent: Content = {
    ...componentContent,
    streamingState: "done",
  };

  const updatedMessage: TamboThreadMessage = {
    ...message,
    content: updateContentAtIndex(
      message.content,
      contentIndex,
      updatedContent,
    ),
  };

  return updateThreadMessages(
    threadState,
    updateMessageAtIndex(messages, messageIndex, updatedMessage),
  );
}

/**
 * Handle tambo.run.awaiting_input event.
 * Sets thread status to waiting for client-side tool execution.
 * @param threadState - Current thread state
 * @param _event - Run awaiting input event (unused)
 * @returns Updated thread state
 */
function handleRunAwaitingInput(
  threadState: ThreadState,
  _event: RunAwaitingInputEvent,
): ThreadState {
  return {
    ...threadState,
    thread: {
      ...threadState.thread,
      status: "waiting",
      updatedAt: new Date().toISOString(),
    },
    streaming: {
      ...threadState.streaming,
      status: "waiting",
    },
  };
}

// ============================================================================
// Reasoning Event Handlers (currently mapped from THINKING_TEXT_MESSAGE_* events)
// ============================================================================

/**
 * Generate an ephemeral message ID for reasoning messages that arrive before TEXT_MESSAGE_START.
 * Uses crypto.randomUUID() which is available in Node.js 19+ and modern browsers.
 */
function generateEphemeralMessageId(): string {
  return `ephemeral_${crypto.randomUUID()}`;
}

/**
 * Find or create an assistant message for reasoning events.
 * Reasoning should only be attached to assistant messages.
 * If no suitable assistant message exists, creates an ephemeral one.
 * @param threadState - Current thread state
 * @returns Object with messageIndex, messages array, and updated threadState
 */
function findOrCreateMessageForReasoning(threadState: ThreadState): {
  messageIndex: number;
  messages: TamboThreadMessage[];
  threadState: ThreadState;
} {
  const messageId = threadState.streaming.messageId;
  let messages = threadState.thread.messages;

  // If we have an active streaming messageId, try to find it
  if (messageId) {
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    if (messageIndex !== -1 && messages[messageIndex].role === "assistant") {
      return { messageIndex, messages, threadState };
    }
  }

  // Look for the last assistant message
  const lastAssistantIndex = messages.findLastIndex(
    (m) => m.role === "assistant",
  );

  // If there's an assistant message and it's the most recent message, use it
  // (Don't attach reasoning to an old assistant message if user message came after)
  if (lastAssistantIndex !== -1 && lastAssistantIndex === messages.length - 1) {
    return { messageIndex: lastAssistantIndex, messages, threadState };
  }

  // No suitable assistant message - create an ephemeral one
  const ephemeralId = generateEphemeralMessageId();
  const newMessage: TamboThreadMessage = {
    id: ephemeralId,
    role: "assistant",
    content: [],
    createdAt: new Date().toISOString(),
  };
  messages = [...messages, newMessage];
  const messageIndex = messages.length - 1;

  // Update thread state with new message
  threadState = {
    ...threadState,
    thread: {
      ...threadState.thread,
      messages,
      updatedAt: new Date().toISOString(),
    },
    streaming: {
      ...threadState.streaming,
      messageId: ephemeralId,
    },
  };

  return { messageIndex, messages, threadState };
}

/**
 * Handle THINKING_TEXT_MESSAGE_START event (will become REASONING_MESSAGE_START).
 * Starts a new reasoning chunk by appending an empty string to the message's reasoning array.
 * Records the start time for duration calculation.
 * @param threadState - Current thread state
 * @param event - Thinking text message start event
 * @returns Updated thread state
 */
function handleThinkingTextMessageStart(
  threadState: ThreadState,
  event: ThinkingTextMessageStartEvent,
): ThreadState {
  const {
    messageIndex,
    messages,
    threadState: updatedThreadState,
  } = findOrCreateMessageForReasoning(threadState);
  threadState = updatedThreadState;

  const message = messages[messageIndex];
  const existingReasoning = message.reasoning ?? [];

  const updatedMessage: TamboThreadMessage = {
    ...message,
    reasoning: [...existingReasoning, ""],
  };

  // Record reasoning start time if this is the first reasoning chunk
  const reasoningStartTime =
    threadState.streaming.reasoningStartTime ?? event.timestamp ?? Date.now();

  return {
    ...updateThreadMessages(
      threadState,
      updateMessageAtIndex(messages, messageIndex, updatedMessage),
    ),
    streaming: {
      ...threadState.streaming,
      reasoningStartTime,
    },
  };
}

/**
 * Handle THINKING_TEXT_MESSAGE_CONTENT event (will become REASONING_MESSAGE_CONTENT).
 * Appends delta text to the last reasoning chunk.
 * @param threadState - Current thread state
 * @param event - Thinking text message content event
 * @returns Updated thread state
 */
function handleThinkingTextMessageContent(
  threadState: ThreadState,
  event: ThinkingTextMessageContentEvent,
): ThreadState {
  const {
    messageIndex,
    messages,
    threadState: updatedThreadState,
  } = findOrCreateMessageForReasoning(threadState);
  threadState = updatedThreadState;

  const message = messages[messageIndex];
  const existingReasoning = message.reasoning ?? [];

  if (existingReasoning.length === 0) {
    // No reasoning chunk started - start one implicitly
    const updatedMessage: TamboThreadMessage = {
      ...message,
      reasoning: [event.delta],
    };

    return {
      ...updateThreadMessages(
        threadState,
        updateMessageAtIndex(messages, messageIndex, updatedMessage),
      ),
      streaming: {
        ...threadState.streaming,
        reasoningStartTime:
          threadState.streaming.reasoningStartTime ??
          event.timestamp ??
          Date.now(),
      },
    };
  }

  // Append to the last reasoning chunk
  const updatedReasoning = [
    ...existingReasoning.slice(0, -1),
    existingReasoning[existingReasoning.length - 1] + event.delta,
  ];

  const updatedMessage: TamboThreadMessage = {
    ...message,
    reasoning: updatedReasoning,
  };

  return updateThreadMessages(
    threadState,
    updateMessageAtIndex(messages, messageIndex, updatedMessage),
  );
}

/**
 * Handle THINKING_TEXT_MESSAGE_END event (will become REASONING_MESSAGE_END).
 * Calculates and stores the reasoning duration.
 * @param threadState - Current thread state
 * @param event - Thinking text message end event
 * @returns Updated thread state
 */
function handleThinkingTextMessageEnd(
  threadState: ThreadState,
  event: ThinkingTextMessageEndEvent,
): ThreadState {
  const {
    messageIndex,
    messages,
    threadState: updatedThreadState,
  } = findOrCreateMessageForReasoning(threadState);
  threadState = updatedThreadState;

  const message = messages[messageIndex];

  // Calculate duration if we have a start time
  const reasoningStartTime = threadState.streaming.reasoningStartTime;
  const endTime = event.timestamp ?? Date.now();
  const reasoningDurationMS = reasoningStartTime
    ? endTime - reasoningStartTime
    : undefined;

  const updatedMessage: TamboThreadMessage = {
    ...message,
    reasoningDurationMS:
      reasoningDurationMS ?? message.reasoningDurationMS ?? undefined,
  };

  return updateThreadMessages(
    threadState,
    updateMessageAtIndex(messages, messageIndex, updatedMessage),
  );
}

/**
 * Handle LOAD_THREAD_MESSAGES action.
 * Loads messages from API into stream state for an existing thread.
 * Deduplicates by message ID, keeping existing messages (they may have in-flight updates).
 * Sorts merged messages by createdAt to ensure chronological order.
 * @param state - Current stream state
 * @param action - Load thread messages action
 * @returns Updated stream state
 */
function handleLoadThreadMessages(
  state: StreamState,
  action: LoadThreadMessagesAction,
): StreamState {
  const { threadId, messages, skipIfStreaming } = action;

  // Get or create thread state
  let threadState = state.threadMap[threadId];
  if (!threadState) {
    threadState = createInitialThreadState(threadId);
  }

  // Skip if streaming and skipIfStreaming is true
  if (skipIfStreaming && threadState.streaming.status === "streaming") {
    return state;
  }

  const existingMessages = threadState.thread.messages;

  // Build a set of existing message IDs for fast lookup
  const existingIds = new Set(existingMessages.map((m) => m.id));

  // Filter out messages that already exist (keep existing, add new).
  // API-loaded messages are by definition fully complete, so stamp
  // streamingState: "done" on all component content blocks. This is
  // required by downstream hooks (usePropsStreamingStatus) which check
  // streamingState === "done" to report isSuccess: true.
  const newMessages = messages
    .filter((m) => !existingIds.has(m.id))
    .map((m) => ({
      ...m,
      content: m.content.map((block): Content => {
        if (block.type !== "component") return block;
        if (
          block.streamingState !== undefined &&
          block.streamingState !== "done"
        ) {
          console.warn(
            `LOAD_THREAD_MESSAGES: component "${block.id}" has unexpected ` +
              `streamingState "${block.streamingState}". API-loaded messages ` +
              `should not have in-flight streaming state.`,
          );
        }
        return { ...block, streamingState: "done" as const };
      }),
    }));

  // Merge and sort by createdAt
  const mergedMessages = [...existingMessages, ...newMessages].toSorted(
    (a, b) => {
      // Messages without createdAt go to the end
      if (!a.createdAt && !b.createdAt) return 0;
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return a.createdAt.localeCompare(b.createdAt);
    },
  );

  const updatedThreadState: ThreadState = {
    ...threadState,
    thread: {
      ...threadState.thread,
      messages: mergedMessages,
      updatedAt: new Date().toISOString(),
    },
  };

  return {
    ...state,
    threadMap: {
      ...state.threadMap,
      [threadId]: updatedThreadState,
    },
  };
}
