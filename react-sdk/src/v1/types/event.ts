/**
 * Tambo-specific Custom Event Types for v1 Streaming API
 *
 * Defines custom events specific to Tambo functionality.
 * For standard AG-UI events, import directly from @ag-ui/core.
 */

/**
 * Component start event (custom: tambo.component.start)
 */
export interface ComponentStartEvent {
  type: "CUSTOM";
  name: "tambo.component.start";
  value: {
    messageId: string;
    componentId: string;
    componentName: string;
  };
  timestamp?: number;
}

/**
 * Component props delta event (custom: tambo.component.props_delta)
 * Uses JSON Patch (RFC 6902) to update component props
 */
export interface ComponentPropsDeltaEvent {
  type: "CUSTOM";
  name: "tambo.component.props_delta";
  value: {
    componentId: string;
    operations: JsonPatchOperation[];
  };
  timestamp?: number;
}

/**
 * Component state delta event (custom: tambo.component.state_delta)
 * Uses JSON Patch (RFC 6902) to update component state
 */
export interface ComponentStateDeltaEvent {
  type: "CUSTOM";
  name: "tambo.component.state_delta";
  value: {
    componentId: string;
    operations: JsonPatchOperation[];
  };
  timestamp?: number;
}

/**
 * Component end event (custom: tambo.component.end)
 */
export interface ComponentEndEvent {
  type: "CUSTOM";
  name: "tambo.component.end";
  value: {
    componentId: string;
  };
  timestamp?: number;
}

/**
 * Run awaiting input event (custom: tambo.run.awaiting_input)
 * Signals that the run is paused waiting for client-side tool execution
 */
export interface RunAwaitingInputEvent {
  type: "CUSTOM";
  name: "tambo.run.awaiting_input";
  value: {
    pendingToolCallIds: string[];
  };
  timestamp?: number;
}

/**
 * JSON Patch operation (RFC 6902)
 */
export interface JsonPatchOperation {
  op: "add" | "remove" | "replace" | "move" | "copy" | "test";
  path: string;
  value?: unknown;
  from?: string; // For 'move' and 'copy' operations
}

/**
 * Union type of Tambo-specific custom events
 */
export type TamboCustomEvent =
  | ComponentStartEvent
  | ComponentPropsDeltaEvent
  | ComponentStateDeltaEvent
  | ComponentEndEvent
  | RunAwaitingInputEvent;
