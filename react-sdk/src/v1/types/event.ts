/**
 * AG-UI Event Types for v1 Streaming API
 *
 * These types represent the Server-Sent Events (SSE) that the v1 API streams.
 * Based on the AG-UI protocol specification.
 *
 * TODO: Once @tambo-ai/typescript-sdk/v1 is released, replace these with
 * imports from the SDK package.
 */

/**
 * Event types from the AG-UI protocol
 */
export enum EventType {
  // Run lifecycle
  RUN_STARTED = "RUN_STARTED",
  RUN_FINISHED = "RUN_FINISHED",
  RUN_ERROR = "RUN_ERROR",

  // Text message events
  TEXT_MESSAGE_START = "TEXT_MESSAGE_START",
  TEXT_MESSAGE_CONTENT = "TEXT_MESSAGE_CONTENT",
  TEXT_MESSAGE_END = "TEXT_MESSAGE_END",

  // Tool call events
  TOOL_CALL_START = "TOOL_CALL_START",
  TOOL_CALL_ARGS = "TOOL_CALL_ARGS",
  TOOL_CALL_END = "TOOL_CALL_END",
  TOOL_CALL_RESULT = "TOOL_CALL_RESULT",

  // Custom events (Tambo-specific)
  CUSTOM = "CUSTOM",
}

/**
 * Base event structure - all events extend this
 */
export interface BaseEvent {
  type: EventType;
  timestamp?: number;
}

/**
 * Run started event - signals beginning of a new run
 */
export interface RunStartedEvent extends BaseEvent {
  type: EventType.RUN_STARTED;
  runId: string;
  threadId: string;
}

/**
 * Run finished event - signals successful completion
 */
export interface RunFinishedEvent extends BaseEvent {
  type: EventType.RUN_FINISHED;
  runId: string;
}

/**
 * Run error event - signals failure
 */
export interface RunErrorEvent extends BaseEvent {
  type: EventType.RUN_ERROR;
  runId: string;
  error: {
    message: string;
    code?: string;
  };
}

/**
 * Text message start event - begins a new message
 */
export interface TextMessageStartEvent extends BaseEvent {
  type: EventType.TEXT_MESSAGE_START;
  messageId: string;
  role: "user" | "assistant";
}

/**
 * Text message content event - streams text delta
 */
export interface TextMessageContentEvent extends BaseEvent {
  type: EventType.TEXT_MESSAGE_CONTENT;
  messageId: string;
  delta: string;
}

/**
 * Text message end event - finalizes message
 */
export interface TextMessageEndEvent extends BaseEvent {
  type: EventType.TEXT_MESSAGE_END;
  messageId: string;
}

/**
 * Tool call start event - begins a tool invocation
 */
export interface ToolCallStartEvent extends BaseEvent {
  type: EventType.TOOL_CALL_START;
  messageId: string;
  toolCallId: string;
  name: string;
}

/**
 * Tool call args event - streams tool arguments (JSON string)
 */
export interface ToolCallArgsEvent extends BaseEvent {
  type: EventType.TOOL_CALL_ARGS;
  toolCallId: string;
  delta: string;
}

/**
 * Tool call end event - finalizes tool call
 */
export interface ToolCallEndEvent extends BaseEvent {
  type: EventType.TOOL_CALL_END;
  toolCallId: string;
}

/**
 * Tool call result event - provides tool execution result (server-side tools)
 */
export interface ToolCallResultEvent extends BaseEvent {
  type: EventType.TOOL_CALL_RESULT;
  toolCallId: string;
  messageId: string;
  result: unknown;
  isError?: boolean;
}

/**
 * Custom event - Tambo-specific extensions
 */
export interface CustomEvent extends BaseEvent {
  type: EventType.CUSTOM;
  name: string;
  value: unknown;
}

/**
 * Component start event (custom: tambo.component.start)
 */
export interface ComponentStartEvent extends CustomEvent {
  name: "tambo.component.start";
  value: {
    messageId: string;
    componentId: string;
    componentName: string;
  };
}

/**
 * Component props delta event (custom: tambo.component.props_delta)
 * Uses JSON Patch (RFC 6902) to update component props
 */
export interface ComponentPropsDeltaEvent extends CustomEvent {
  name: "tambo.component.props_delta";
  value: {
    componentId: string;
    operations: JsonPatchOperation[];
  };
}

/**
 * Component state delta event (custom: tambo.component.state_delta)
 * Uses JSON Patch (RFC 6902) to update component state
 */
export interface ComponentStateDeltaEvent extends CustomEvent {
  name: "tambo.component.state_delta";
  value: {
    componentId: string;
    operations: JsonPatchOperation[];
  };
}

/**
 * Component end event (custom: tambo.component.end)
 */
export interface ComponentEndEvent extends CustomEvent {
  name: "tambo.component.end";
  value: {
    componentId: string;
  };
}

/**
 * Run awaiting input event (custom: tambo.run.awaiting_input)
 * Signals that the run is paused waiting for client-side tool execution
 */
export interface RunAwaitingInputEvent extends CustomEvent {
  name: "tambo.run.awaiting_input";
  value: {
    pendingToolCallIds: string[];
  };
}

/**
 * JSON Patch operation (RFC 6902)
 * TODO: Import from @tambo-ai/typescript-sdk/v1 once available
 */
export interface JsonPatchOperation {
  op: "add" | "remove" | "replace" | "move" | "copy" | "test";
  path: string;
  value?: unknown;
  from?: string; // For 'move' and 'copy' operations
}

/**
 * Union type of all possible events
 * This enables exhaustive type checking in switch statements
 */
export type AnyEvent =
  | RunStartedEvent
  | RunFinishedEvent
  | RunErrorEvent
  | TextMessageStartEvent
  | TextMessageContentEvent
  | TextMessageEndEvent
  | ToolCallStartEvent
  | ToolCallArgsEvent
  | ToolCallEndEvent
  | ToolCallResultEvent
  | ComponentStartEvent
  | ComponentPropsDeltaEvent
  | ComponentStateDeltaEvent
  | ComponentEndEvent
  | RunAwaitingInputEvent
  | CustomEvent; // Catch-all for unknown custom events
