/**
 * Tambo-specific Custom Event Types for v1 Streaming API
 *
 * Defines custom events specific to Tambo functionality.
 * For standard AG-UI events, import directly from @ag-ui/core.
 */

import type { CustomEvent } from "@ag-ui/core";
import type { Operation } from "fast-json-patch";

type TamboCustomEventEnvelope<TName extends string, TValue> = Omit<
  CustomEvent,
  "name" | "value"
> & {
  name: TName;
  value: TValue;
};

/**
 * Component start event (custom: tambo.component.start)
 */
export type ComponentStartEvent = TamboCustomEventEnvelope<
  "tambo.component.start",
  {
    messageId: string;
    componentId: string;
    componentName: string;
  }
>;

/**
 * Component props delta event (custom: tambo.component.props_delta)
 * Uses JSON Patch (RFC 6902) to update component props
 */
export type ComponentPropsDeltaEvent = TamboCustomEventEnvelope<
  "tambo.component.props_delta",
  {
    componentId: string;
    operations: Operation[];
  }
>;

/**
 * Component state delta event (custom: tambo.component.state_delta)
 * Uses JSON Patch (RFC 6902) to update component state
 */
export type ComponentStateDeltaEvent = TamboCustomEventEnvelope<
  "tambo.component.state_delta",
  {
    componentId: string;
    operations: Operation[];
  }
>;

/**
 * Component end event (custom: tambo.component.end)
 */
export type ComponentEndEvent = TamboCustomEventEnvelope<
  "tambo.component.end",
  {
    componentId: string;
  }
>;

/**
 * Run awaiting input event (custom: tambo.run.awaiting_input)
 * Signals that the run is paused waiting for client-side tool execution
 */
export type RunAwaitingInputEvent = TamboCustomEventEnvelope<
  "tambo.run.awaiting_input",
  {
    pendingToolCallIds: string[];
  }
>;

/**
 * Union type of Tambo-specific custom events
 */
export type TamboCustomEvent =
  | ComponentStartEvent
  | ComponentPropsDeltaEvent
  | ComponentStateDeltaEvent
  | ComponentEndEvent
  | RunAwaitingInputEvent;
