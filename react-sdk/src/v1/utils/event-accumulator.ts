/**
 * Event Accumulation Logic for v1 Streaming API
 *
 * Implements a reducer that transforms AG-UI event streams into React state.
 * Used with useReducer to accumulate events into thread state.
 */

import type {
  BaseEvent,
  RunStartedEvent,
  RunFinishedEvent,
  RunErrorEvent,
  TextMessageStartEvent,
  TextMessageContentEvent,
  TextMessageEndEvent,
  ToolCallStartEvent,
  ToolCallArgsEvent,
  ToolCallEndEvent,
  ToolCallResultEvent,
} from "@ag-ui/core";
import { EventType } from "@ag-ui/core";
import type { TamboV1Thread, StreamingState } from "../types/thread";
import type { TamboV1Message, Content } from "../types/message";
import type {
  ComponentStartEvent,
  ComponentPropsDeltaEvent,
  ComponentStateDeltaEvent,
  ComponentEndEvent,
  RunAwaitingInputEvent,
} from "../types/event";
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
 * State managed by the stream reducer.
 * Combines thread data with streaming status.
 */
export interface StreamState {
  thread: TamboV1Thread;
  streaming: StreamingState;
  /**
   * Accumulating tool call arguments as JSON strings (for streaming).
   * Maps tool call ID to accumulated JSON string.
   */
  accumulatingToolArgs: Map<string, string>;
}

/**
 * Action type for the stream reducer.
 */
export interface StreamAction {
  type: "EVENT";
  event: BaseEvent;
}

/**
 * Initial streaming state.
 */
const initialStreamingState: StreamingState = {
  status: "idle",
};

/**
 * Create initial state for a new thread.
 * @param threadId - Unique thread identifier
 * @param projectId - Project ID this thread belongs to
 * @returns Initial stream state
 */
export function createInitialState(
  threadId: string,
  projectId: string,
): StreamState {
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
 * Stream reducer that accumulates events into thread state.
 *
 * This reducer handles all AG-UI events and Tambo custom events,
 * transforming them into immutable state updates.
 * @param state - Current stream state
 * @param action - Action containing the event to process
 * @returns Updated stream state
 */
export function streamReducer(
  state: StreamState,
  action: StreamAction,
): StreamState {
  const { event } = action;

  switch (event.type) {
    case EventType.RUN_STARTED:
      return handleRunStarted(state, event as RunStartedEvent);

    case EventType.RUN_FINISHED:
      return handleRunFinished(state, event as RunFinishedEvent);

    case EventType.RUN_ERROR:
      return handleRunError(state, event as RunErrorEvent);

    case EventType.TEXT_MESSAGE_START:
      return handleTextMessageStart(state, event as TextMessageStartEvent);

    case EventType.TEXT_MESSAGE_CONTENT:
      return handleTextMessageContent(state, event as TextMessageContentEvent);

    case EventType.TEXT_MESSAGE_END:
      return handleTextMessageEnd(state, event as TextMessageEndEvent);

    case EventType.TOOL_CALL_START:
      return handleToolCallStart(state, event as ToolCallStartEvent);

    case EventType.TOOL_CALL_ARGS:
      return handleToolCallArgs(state, event as ToolCallArgsEvent);

    case EventType.TOOL_CALL_END:
      return handleToolCallEnd(state, event as ToolCallEndEvent);

    case EventType.TOOL_CALL_RESULT:
      return handleToolCallResult(state, event as ToolCallResultEvent);

    case EventType.CUSTOM:
      return handleCustomEvent(state, event);

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

    default: {
      // Exhaustiveness check - TypeScript will error if we add new event types and forget to handle them
      const _exhaustiveCheck: never = event.type;
      throw new UnreachableCaseError(_exhaustiveCheck);
    }
  }
}

/**
 * Handle RUN_STARTED event.
 * @param state - Current stream state
 * @param event - Run started event
 * @returns Updated stream state
 */
function handleRunStarted(
  state: StreamState,
  event: RunStartedEvent,
): StreamState {
  return {
    ...state,
    thread: {
      ...state.thread,
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
 * @param state - Current stream state
 * @param _event - Run finished event (unused)
 * @returns Updated stream state
 */
function handleRunFinished(
  state: StreamState,
  _event: RunFinishedEvent,
): StreamState {
  return {
    ...state,
    thread: {
      ...state.thread,
      status: "complete",
      updatedAt: new Date().toISOString(),
    },
    streaming: {
      ...state.streaming,
      status: "complete",
    },
  };
}

/**
 * Handle RUN_ERROR event.
 * @param state - Current stream state
 * @param event - Run error event
 * @returns Updated stream state
 */
function handleRunError(state: StreamState, event: RunErrorEvent): StreamState {
  return {
    ...state,
    thread: {
      ...state.thread,
      status: "error",
      updatedAt: new Date().toISOString(),
    },
    streaming: {
      ...state.streaming,
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
 * @param state - Current stream state
 * @param event - Text message start event
 * @returns Updated stream state
 */
function handleTextMessageStart(
  state: StreamState,
  event: TextMessageStartEvent,
): StreamState {
  const newMessage: TamboV1Message = {
    id: event.messageId,
    role: event.role === "user" ? "user" : "assistant",
    content: [],
    createdAt: new Date().toISOString(),
  };

  return {
    ...state,
    thread: {
      ...state.thread,
      messages: [...state.thread.messages, newMessage],
      updatedAt: new Date().toISOString(),
    },
    streaming: {
      ...state.streaming,
      messageId: event.messageId,
    },
  };
}

/**
 * Handle TEXT_MESSAGE_CONTENT event.
 * Appends text content to the current message.
 * @param state - Current stream state
 * @param event - Text message content event
 * @returns Updated stream state
 */
function handleTextMessageContent(
  state: StreamState,
  event: TextMessageContentEvent,
): StreamState {
  const messageId = event.messageId;
  const messages = state.thread.messages;

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
    ...state,
    thread: {
      ...state.thread,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Handle TEXT_MESSAGE_END event.
 * Marks the message as complete.
 * @param state - Current stream state
 * @param _event - Text message end event (unused)
 * @returns Updated stream state
 */
function handleTextMessageEnd(
  state: StreamState,
  _event: TextMessageEndEvent,
): StreamState {
  // For now, this doesn't change state, but could be used for message finalization
  return state;
}

/**
 * Handle TOOL_CALL_START event.
 * Adds a tool use content block to the current message.
 * @param state - Current stream state
 * @param event - Tool call start event
 * @returns Updated stream state
 */
function handleToolCallStart(
  state: StreamState,
  event: ToolCallStartEvent,
): StreamState {
  const messageId = event.parentMessageId;
  const messages = state.thread.messages;

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
    ...state,
    thread: {
      ...state.thread,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Handle TOOL_CALL_ARGS event.
 * Accumulates JSON string deltas for tool call arguments.
 * The accumulated string will be parsed at TOOL_CALL_END.
 * @param state - Current stream state
 * @param event - Tool call args event
 * @returns Updated stream state
 */
function handleToolCallArgs(
  state: StreamState,
  event: ToolCallArgsEvent,
): StreamState {
  const toolCallId = event.toolCallId;

  // Accumulate the JSON string delta
  const accumulatedArgs = state.accumulatingToolArgs;
  const existingArgs = accumulatedArgs.get(toolCallId) ?? "";
  const newAccumulatedArgs = new Map(accumulatedArgs);
  newAccumulatedArgs.set(toolCallId, existingArgs + event.delta);

  return {
    ...state,
    accumulatingToolArgs: newAccumulatedArgs,
  };
}

/**
 * Handle TOOL_CALL_END event.
 * Parses the accumulated JSON arguments and updates the tool_use content block.
 * @param state - Current stream state
 * @param event - Tool call end event
 * @returns Updated stream state
 */
function handleToolCallEnd(
  state: StreamState,
  event: ToolCallEndEvent,
): StreamState {
  const toolCallId = event.toolCallId;
  const messages = state.thread.messages;

  // Get accumulated JSON args string
  const accumulatedJson = state.accumulatingToolArgs.get(toolCallId);
  if (!accumulatedJson) {
    // No args accumulated - tool call has empty input
    return state;
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
  const newAccumulatingToolArgs = new Map(state.accumulatingToolArgs);
  newAccumulatingToolArgs.delete(toolCallId);

  return {
    ...state,
    thread: {
      ...state.thread,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    },
    accumulatingToolArgs: newAccumulatingToolArgs,
  };
}

/**
 * Handle TOOL_CALL_RESULT event.
 * Adds tool result to the message.
 * @param state - Current stream state
 * @param event - Tool call result event
 * @returns Updated stream state
 */
function handleToolCallResult(
  state: StreamState,
  event: ToolCallResultEvent,
): StreamState {
  const messageId = event.messageId;
  const messages = state.thread.messages;

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
    ...state,
    thread: {
      ...state.thread,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Handle custom events (Tambo-specific).
 * @param state - Current stream state
 * @param event - Base event (must be CUSTOM type)
 * @returns Updated stream state
 */
function handleCustomEvent(state: StreamState, event: BaseEvent): StreamState {
  if (event.type !== EventType.CUSTOM) {
    return state;
  }

  const customEvent = event as { type: "CUSTOM"; name: string; value: unknown };

  switch (customEvent.name) {
    case "tambo.component.start":
      return handleComponentStart(
        state,
        customEvent as unknown as ComponentStartEvent,
      );

    case "tambo.component.props_delta":
      return handleComponentPropsDelta(
        state,
        customEvent as unknown as ComponentPropsDeltaEvent,
      );

    case "tambo.component.state_delta":
      return handleComponentStateDelta(
        state,
        customEvent as unknown as ComponentStateDeltaEvent,
      );

    case "tambo.component.end":
      return handleComponentEnd(
        state,
        customEvent as unknown as ComponentEndEvent,
      );

    case "tambo.run.awaiting_input":
      return handleRunAwaitingInput(
        state,
        customEvent as unknown as RunAwaitingInputEvent,
      );

    default:
      return state;
  }
}

/**
 * Handle tambo.component.start event.
 * Adds a component content block to the message.
 * @param state - Current stream state
 * @param event - Component start event
 * @returns Updated stream state
 */
function handleComponentStart(
  state: StreamState,
  event: ComponentStartEvent,
): StreamState {
  const messageId = event.value.messageId;
  const messages = state.thread.messages;

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
    ...state,
    thread: {
      ...state.thread,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Handle tambo.component.props_delta event.
 * Applies JSON Patch to component props.
 * @param state - Current stream state
 * @param event - Component props delta event
 * @returns Updated stream state
 */
function handleComponentPropsDelta(
  state: StreamState,
  event: ComponentPropsDeltaEvent,
): StreamState {
  const componentId = event.value.componentId;
  const operations = event.value.operations;
  const messages = state.thread.messages;

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
    ...state,
    thread: {
      ...state.thread,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Handle tambo.component.state_delta event.
 * Applies JSON Patch to component state.
 * @param state - Current stream state
 * @param event - Component state delta event
 * @returns Updated stream state
 */
function handleComponentStateDelta(
  state: StreamState,
  event: ComponentStateDeltaEvent,
): StreamState {
  const componentId = event.value.componentId;
  const operations = event.value.operations;
  const messages = state.thread.messages;

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
    ...state,
    thread: {
      ...state.thread,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Handle tambo.component.end event.
 * Marks component as complete.
 * @param state - Current stream state
 * @param _event - Component end event (unused)
 * @returns Updated stream state
 */
function handleComponentEnd(
  state: StreamState,
  _event: ComponentEndEvent,
): StreamState {
  // For now, this doesn't change state
  return state;
}

/**
 * Handle tambo.run.awaiting_input event.
 * Sets thread status to waiting for client-side tool execution.
 * @param state - Current stream state
 * @param _event - Run awaiting input event (unused)
 * @returns Updated stream state
 */
function handleRunAwaitingInput(
  state: StreamState,
  _event: RunAwaitingInputEvent,
): StreamState {
  return {
    ...state,
    thread: {
      ...state.thread,
      status: "waiting",
      updatedAt: new Date().toISOString(),
    },
    streaming: {
      ...state.streaming,
      status: "waiting",
    },
  };
}
