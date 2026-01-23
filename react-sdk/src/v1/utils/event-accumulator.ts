/**
 * Event Accumulation Logic for v1 Streaming API
 *
 * Implements a reducer that transforms AG-UI event streams into React state.
 * Used with useReducer to accumulate events into thread state.
 */

import type {
  BaseEvent,
  RunErrorEvent,
  RunFinishedEvent,
  RunStartedEvent,
  TextMessageContentEvent,
  TextMessageEndEvent,
  TextMessageStartEvent,
  ToolCallArgsEvent,
  ToolCallEndEvent,
  ToolCallResultEvent,
  ToolCallStartEvent,
} from "@ag-ui/core";
import { EventType } from "@ag-ui/core";
import type {
  ComponentEndEvent,
  ComponentPropsDeltaEvent,
  ComponentStartEvent,
  ComponentStateDeltaEvent,
  RunAwaitingInputEvent,
} from "../types/event";
import type { Content, TamboV1Message } from "../types/message";
import type { StreamingState, TamboV1Thread } from "../types/thread";
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
  thread: TamboV1Thread;
  streaming: StreamingState;
  /**
   * Accumulating tool call arguments as JSON strings (for streaming).
   * Maps tool call ID to accumulated JSON string.
   */
  accumulatingToolArgs: Map<string, string>;
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
  currentThreadId: string | null;
}

/**
 * Action type for the stream reducer.
 * Includes threadId to ensure events update the correct thread.
 */
export interface StreamAction {
  type: "EVENT";
  event: BaseEvent;
  threadId: string;
}

/**
 * Initial streaming state.
 */
const initialStreamingState: StreamingState = {
  status: "idle",
};

/**
 * Create initial thread state for a new thread.
 * @param threadId - Unique thread identifier
 * @param projectId - Project ID this thread belongs to
 * @returns Initial thread state
 */
export function createInitialThreadState(
  threadId: string,
  projectId: string,
): ThreadState {
  const now = new Date().toISOString();
  return {
    thread: {
      id: threadId,
      projectId,
      messages: [],
      status: "idle",
      createdAt: now,
      updatedAt: now,
    },
    streaming: initialStreamingState,
    accumulatingToolArgs: new Map(),
  };
}

/**
 * Create initial stream state with empty threadMap.
 * @returns Initial stream state
 */
export function createInitialState(): StreamState {
  return {
    threadMap: {},
    currentThreadId: null,
  };
}

/**
 * Stream reducer that accumulates events into thread state.
 *
 * This reducer handles all AG-UI events and Tambo custom events,
 * transforming them into immutable state updates per thread.
 * @param state - Current stream state
 * @param action - Action containing the event and threadId to process
 * @returns Updated stream state
 */
export function streamReducer(
  state: StreamState,
  action: StreamAction,
): StreamState {
  const { event, threadId } = action;

  // Get the current thread state (or undefined if thread doesn't exist yet)
  const threadState = state.threadMap[threadId];

  // If thread doesn't exist, we need to create it first
  // This can happen when events arrive before thread initialization
  if (!threadState) {
    // For now, we'll skip the event if the thread doesn't exist
    // The provider should initialize threads before dispatching events
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[StreamReducer] Received event for unknown thread: ${threadId}`,
      );
    }
    return state;
  }

  // Process the event for this specific thread
  let updatedThreadState: ThreadState;

  // Switch on event.type (string) - values match EventType enum
  switch (event.type) {
    case EventType.RUN_STARTED:
      updatedThreadState = handleRunStarted(
        threadState,
        event as RunStartedEvent,
      );
      break;

    case EventType.RUN_FINISHED:
      updatedThreadState = handleRunFinished(
        threadState,
        event as RunFinishedEvent,
      );
      break;

    case EventType.RUN_ERROR:
      updatedThreadState = handleRunError(threadState, event as RunErrorEvent);
      break;

    case EventType.TEXT_MESSAGE_START:
      updatedThreadState = handleTextMessageStart(
        threadState,
        event as TextMessageStartEvent,
      );
      break;

    case EventType.TEXT_MESSAGE_CONTENT:
      updatedThreadState = handleTextMessageContent(
        threadState,
        event as TextMessageContentEvent,
      );
      break;

    case EventType.TEXT_MESSAGE_END:
      updatedThreadState = handleTextMessageEnd(
        threadState,
        event as TextMessageEndEvent,
      );
      break;

    case EventType.TOOL_CALL_START:
      updatedThreadState = handleToolCallStart(
        threadState,
        event as ToolCallStartEvent,
      );
      break;

    case EventType.TOOL_CALL_ARGS:
      updatedThreadState = handleToolCallArgs(
        threadState,
        event as ToolCallArgsEvent,
      );
      break;

    case EventType.TOOL_CALL_END:
      updatedThreadState = handleToolCallEnd(
        threadState,
        event as ToolCallEndEvent,
      );
      break;

    case EventType.TOOL_CALL_RESULT:
      updatedThreadState = handleToolCallResult(
        threadState,
        event as ToolCallResultEvent,
      );
      break;

    case EventType.CUSTOM:
      updatedThreadState = handleCustomEvent(threadState, event);
      break;

    // Unsupported AG-UI event types - may be added in future phases
    case EventType.TEXT_MESSAGE_CHUNK:
    case EventType.THINKING_TEXT_MESSAGE_START:
    case EventType.THINKING_TEXT_MESSAGE_CONTENT:
    case EventType.THINKING_TEXT_MESSAGE_END:
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
      // Not supported yet - silently ignore
      return state;

    default:
      // Unknown event type - log warning and return state unchanged
      // Note: Cannot use exhaustiveness check with string types from SDK
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[StreamReducer] Unknown event type: ${event.type}`);
      }
      return state;
  }

  // Return updated state with modified thread
  return {
    ...state,
    threadMap: {
      ...state.threadMap,
      [threadId]: updatedThreadState,
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
 * @param _event - Run finished event (unused)
 * @returns Updated thread state
 */
function handleRunFinished(
  threadState: ThreadState,
  _event: RunFinishedEvent,
): ThreadState {
  return {
    ...threadState,
    thread: {
      ...threadState.thread,
      status: "complete",
      updatedAt: new Date().toISOString(),
    },
    streaming: {
      ...threadState.streaming,
      status: "complete",
    },
  };
}

/**
 * Handle RUN_ERROR event.
 * @param threadState - Current thread state
 * @param event - Run error event
 * @returns Updated thread state
 */
function handleRunError(
  threadState: ThreadState,
  event: RunErrorEvent,
): ThreadState {
  return {
    ...threadState,
    thread: {
      ...threadState.thread,
      status: "error",
      updatedAt: new Date().toISOString(),
    },
    streaming: {
      ...threadState.streaming,
      status: "error",
      error: {
        message: event.message,
        code: event.code,
      },
    },
  };
}

/**
 * Handle TEXT_MESSAGE_START event.
 * Creates a new message in the thread.
 * @param threadState - Current thread state
 * @param event - Text message start event
 * @returns Updated thread state
 */
function handleTextMessageStart(
  threadState: ThreadState,
  event: TextMessageStartEvent,
): ThreadState {
  const newMessage: TamboV1Message = {
    id: event.messageId,
    role: event.role === "user" ? "user" : "assistant",
    content: [],
    createdAt: new Date().toISOString(),
  };

  return {
    ...threadState,
    thread: {
      ...threadState.thread,
      messages: [...threadState.thread.messages, newMessage],
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

  // Create updated message
  const updatedMessage: TamboV1Message = {
    ...message,
    content: updatedContent,
  };

  // Create updated messages array
  const updatedMessages = [
    ...messages.slice(0, messageIndex),
    updatedMessage,
    ...messages.slice(messageIndex + 1),
  ];

  return {
    ...threadState,
    thread: {
      ...threadState.thread,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Handle TEXT_MESSAGE_END event.
 * Marks the message as complete.
 * @param threadState - Current thread state
 * @param _event - Text message end event (unused)
 * @returns Updated thread state
 */
function handleTextMessageEnd(
  threadState: ThreadState,
  _event: TextMessageEndEvent,
): ThreadState {
  // For now, this doesn't change state, but could be used for message finalization
  return threadState;
}

/**
 * Handle TOOL_CALL_START event.
 * Adds a tool use content block to the current message.
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

  // If no parent message ID, use the last message
  const messageIndex = messageId
    ? messages.findIndex((m) => m.id === messageId)
    : messages.length - 1;

  if (messageIndex === -1) {
    throw new Error(
      messageId
        ? `Message ${messageId} not found for TOOL_CALL_START event`
        : `No messages exist for TOOL_CALL_START event`,
    );
  }

  const message = messages[messageIndex];
  const newContent: Content = {
    type: "tool_use",
    id: event.toolCallId,
    name: event.toolCallName,
    input: {},
  };

  const updatedMessage: TamboV1Message = {
    ...message,
    content: [...message.content, newContent],
  };

  const updatedMessages = [
    ...messages.slice(0, messageIndex),
    updatedMessage,
    ...messages.slice(messageIndex + 1),
  ];

  return {
    ...threadState,
    thread: {
      ...threadState.thread,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Handle TOOL_CALL_ARGS event.
 * Accumulates JSON string deltas for tool call arguments.
 * The accumulated string will be parsed at TOOL_CALL_END.
 * @param threadState - Current thread state
 * @param event - Tool call args event
 * @returns Updated thread state
 */
function handleToolCallArgs(
  threadState: ThreadState,
  event: ToolCallArgsEvent,
): ThreadState {
  const toolCallId = event.toolCallId;

  // Accumulate the JSON string delta
  const accumulatedArgs = threadState.accumulatingToolArgs;
  const existingArgs = accumulatedArgs.get(toolCallId) ?? "";
  const newAccumulatedArgs = new Map(accumulatedArgs);
  newAccumulatedArgs.set(toolCallId, existingArgs + event.delta);

  return {
    ...threadState,
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

  // Parse the accumulated JSON
  let parsedInput: unknown;
  try {
    parsedInput = JSON.parse(accumulatedJson);
  } catch (error) {
    throw new Error(
      `Failed to parse tool call arguments for ${toolCallId}: ${error instanceof Error ? error.message : String(error)}. JSON: ${accumulatedJson}`,
    );
  }

  // Find the message and content block containing this tool call
  let messageIndex = -1;
  let contentIndex = -1;

  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    const idx = message.content.findIndex(
      (c) => c.type === "tool_use" && c.id === toolCallId,
    );
    if (idx !== -1) {
      messageIndex = i;
      contentIndex = idx;
      break;
    }
  }

  if (messageIndex === -1 || contentIndex === -1) {
    throw new Error(
      `Tool call ${toolCallId} not found in messages for TOOL_CALL_END event`,
    );
  }

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

  const updatedMessage: TamboV1Message = {
    ...message,
    content: [
      ...message.content.slice(0, contentIndex),
      updatedContent,
      ...message.content.slice(contentIndex + 1),
    ],
  };

  const updatedMessages = [
    ...messages.slice(0, messageIndex),
    updatedMessage,
    ...messages.slice(messageIndex + 1),
  ];

  // Clear accumulated args for this tool call
  const newAccumulatingToolArgs = new Map(threadState.accumulatingToolArgs);
  newAccumulatingToolArgs.delete(toolCallId);

  return {
    ...threadState,
    thread: {
      ...threadState.thread,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    },
    accumulatingToolArgs: newAccumulatingToolArgs,
  };
}

/**
 * Handle TOOL_CALL_RESULT event.
 * Adds tool result to the message.
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

  const updatedMessage: TamboV1Message = {
    ...message,
    content: [...message.content, newContent],
  };

  const updatedMessages = [
    ...messages.slice(0, messageIndex),
    updatedMessage,
    ...messages.slice(messageIndex + 1),
  ];

  return {
    ...threadState,
    thread: {
      ...threadState.thread,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Handle custom events (Tambo-specific).
 * @param threadState - Current thread state
 * @param event - Base event (must be CUSTOM type)
 * @returns Updated thread state
 */
function handleCustomEvent(
  threadState: ThreadState,
  event: BaseEvent,
): ThreadState {
  if (event.type !== EventType.CUSTOM) {
    return threadState;
  }

  const customEvent = event as { type: string; name: string; value: unknown };

  switch (customEvent.name) {
    case "tambo.component.start":
      return handleComponentStart(
        threadState,
        customEvent as unknown as ComponentStartEvent,
      );

    case "tambo.component.props_delta":
      return handleComponentPropsDelta(
        threadState,
        customEvent as unknown as ComponentPropsDeltaEvent,
      );

    case "tambo.component.state_delta":
      return handleComponentStateDelta(
        threadState,
        customEvent as unknown as ComponentStateDeltaEvent,
      );

    case "tambo.component.end":
      return handleComponentEnd(
        threadState,
        customEvent as unknown as ComponentEndEvent,
      );

    case "tambo.run.awaiting_input":
      return handleRunAwaitingInput(
        threadState,
        customEvent as unknown as RunAwaitingInputEvent,
      );

    default:
      return threadState;
  }
}

/**
 * Handle tambo.component.start event.
 * Adds a component content block to the message.
 * @param threadState - Current thread state
 * @param event - Component start event
 * @returns Updated thread state
 */
function handleComponentStart(
  threadState: ThreadState,
  event: ComponentStartEvent,
): ThreadState {
  const messageId = event.value.messageId;
  const messages = threadState.thread.messages;

  // Find the message
  const messageIndex = messages.findIndex((m) => m.id === messageId);
  if (messageIndex === -1) {
    throw new Error(
      `Message ${messageId} not found for tambo.component.start event`,
    );
  }

  const message = messages[messageIndex];

  // Add component content block
  const newContent: Content = {
    type: "component",
    id: event.value.componentId,
    name: event.value.componentName,
    props: {},
  };

  const updatedMessage: TamboV1Message = {
    ...message,
    content: [...message.content, newContent],
  };

  const updatedMessages = [
    ...messages.slice(0, messageIndex),
    updatedMessage,
    ...messages.slice(messageIndex + 1),
  ];

  return {
    ...threadState,
    thread: {
      ...threadState.thread,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Handle tambo.component.props_delta event.
 * Applies JSON Patch to component props.
 * @param threadState - Current thread state
 * @param event - Component props delta event
 * @returns Updated thread state
 */
function handleComponentPropsDelta(
  threadState: ThreadState,
  event: ComponentPropsDeltaEvent,
): ThreadState {
  const componentId = event.value.componentId;
  const operations = event.value.operations;
  const messages = threadState.thread.messages;

  // Find the message containing this component
  let messageIndex = -1;
  let contentIndex = -1;

  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    const idx = message.content.findIndex(
      (c) => c.type === "component" && c.id === componentId,
    );
    if (idx !== -1) {
      messageIndex = i;
      contentIndex = idx;
      break;
    }
  }

  if (messageIndex === -1 || contentIndex === -1) {
    throw new Error(
      `Component ${componentId} not found for tambo.component.props_delta event`,
    );
  }

  const message = messages[messageIndex];
  const componentContent = message.content[contentIndex];

  if (componentContent.type !== "component") {
    throw new Error(
      `Content at index ${contentIndex} is not a component block for tambo.component.props_delta event`,
    );
  }

  // Apply JSON Patch to props
  const updatedProps = applyJsonPatch(
    componentContent.props as Record<string, unknown>,
    operations,
  );

  const updatedContent: Content = {
    ...componentContent,
    props: updatedProps,
  };

  const updatedMessage: TamboV1Message = {
    ...message,
    content: [
      ...message.content.slice(0, contentIndex),
      updatedContent,
      ...message.content.slice(contentIndex + 1),
    ],
  };

  const updatedMessages = [
    ...messages.slice(0, messageIndex),
    updatedMessage,
    ...messages.slice(messageIndex + 1),
  ];

  return {
    ...threadState,
    thread: {
      ...threadState.thread,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Handle tambo.component.state_delta event.
 * Applies JSON Patch to component state.
 * @param threadState - Current thread state
 * @param event - Component state delta event
 * @returns Updated thread state
 */
function handleComponentStateDelta(
  threadState: ThreadState,
  event: ComponentStateDeltaEvent,
): ThreadState {
  const componentId = event.value.componentId;
  const operations = event.value.operations;
  const messages = threadState.thread.messages;

  // Find the message containing this component
  let messageIndex = -1;
  let contentIndex = -1;

  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    const idx = message.content.findIndex(
      (c) => c.type === "component" && c.id === componentId,
    );
    if (idx !== -1) {
      messageIndex = i;
      contentIndex = idx;
      break;
    }
  }

  if (messageIndex === -1 || contentIndex === -1) {
    throw new Error(
      `Component ${componentId} not found for tambo.component.state_delta event`,
    );
  }

  const message = messages[messageIndex];
  const componentContent = message.content[contentIndex];

  if (componentContent.type !== "component") {
    throw new Error(
      `Content at index ${contentIndex} is not a component block for tambo.component.state_delta event`,
    );
  }

  // Apply JSON Patch to state
  const currentState =
    (componentContent.state as Record<string, unknown>) ?? {};
  const updatedState = applyJsonPatch(currentState, operations);

  const updatedContent: Content = {
    ...componentContent,
    state: updatedState,
  };

  const updatedMessage: TamboV1Message = {
    ...message,
    content: [
      ...message.content.slice(0, contentIndex),
      updatedContent,
      ...message.content.slice(contentIndex + 1),
    ],
  };

  const updatedMessages = [
    ...messages.slice(0, messageIndex),
    updatedMessage,
    ...messages.slice(messageIndex + 1),
  ];

  return {
    ...threadState,
    thread: {
      ...threadState.thread,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Handle tambo.component.end event.
 * Marks component as complete.
 * @param threadState - Current thread state
 * @param _event - Component end event (unused)
 * @returns Updated thread state
 */
function handleComponentEnd(
  threadState: ThreadState,
  _event: ComponentEndEvent,
): ThreadState {
  // For now, this doesn't change state
  return threadState;
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
