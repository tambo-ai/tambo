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
import type {
  TamboV1Thread,
  TamboV1Message,
  StreamingState,
  Content,
  ComponentStartEvent,
  ComponentPropsDeltaEvent,
  ComponentStateDeltaEvent,
  ComponentEndEvent,
  RunAwaitingInputEvent,
} from "../types";
import { applyJsonPatch } from "./json-patch";

/**
 * State managed by the stream reducer.
 * Combines thread data with streaming status.
 */
export interface StreamState {
  thread: TamboV1Thread;
  streaming: StreamingState;
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

    // Other event types are ignored for now
    default:
      return state;
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
    // Message not found, ignore event
    return state;
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
    return state;
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
 * Updates the tool call arguments (streaming).
 */
function handleToolCallArgs(
  state: StreamState,
  event: ToolCallArgsEvent,
): StreamState {
  const toolCallId = event.toolCallId;
  const messages = state.thread.messages;

  // Find the message containing this tool call
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
    return state;
  }

  const message = messages[messageIndex];
  const toolUseContent = message.content[contentIndex];

  if (toolUseContent.type !== "tool_use") {
    return state;
  }

  // Parse the delta as JSON and merge with existing input
  let parsedDelta: Record<string, unknown> = {};
  try {
    parsedDelta = JSON.parse(event.delta);
  } catch {
    // If delta is not valid JSON, ignore this event
    return state;
  }

  // Update tool arguments by merging delta
  const existingInput =
    typeof toolUseContent.input === "object" && toolUseContent.input !== null
      ? (toolUseContent.input as Record<string, unknown>)
      : {};

  const updatedContent: Content = {
    ...toolUseContent,
    input: { ...existingInput, ...parsedDelta },
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
 * Handle TOOL_CALL_END event.
 * Marks the tool call as complete.
 * @param state - Current stream state
 * @param _event - Tool call end event (unused)
 * @returns Updated stream state
 */
function handleToolCallEnd(
  state: StreamState,
  _event: ToolCallEndEvent,
): StreamState {
  // For now, this doesn't change state
  return state;
}

/**
 * Handle TOOL_CALL_RESULT event.
 * Adds tool result to the message.
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
    return state;
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
    return state;
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
    return state;
  }

  const message = messages[messageIndex];
  const componentContent = message.content[contentIndex];

  if (componentContent.type !== "component") {
    return state;
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
    return state;
  }

  const message = messages[messageIndex];
  const componentContent = message.content[contentIndex];

  if (componentContent.type !== "component") {
    return state;
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
