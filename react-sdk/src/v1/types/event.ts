/**
 * Tambo-specific Custom Event Types for v1 Streaming API
 *
 * Defines custom events specific to Tambo functionality.
 * For standard AG-UI events, import directly from `@ag-ui/core`.
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

/**
 * Known Tambo custom event names for type narrowing
 */
const TAMBO_CUSTOM_EVENT_NAMES = [
  "tambo.component.start",
  "tambo.component.props_delta",
  "tambo.component.state_delta",
  "tambo.component.end",
  "tambo.run.awaiting_input",
] as const;

/**
 * Type guard to check if an event is a Tambo custom event.
 * Validates that the event has a name matching known Tambo custom event types.
 * @param event - Event object to check
 * @param event.name - Event name to match against known Tambo event types
 * @returns True if event is a TamboCustomEvent
 */
export function isTamboCustomEvent(event: {
  name?: string;
}): event is TamboCustomEvent {
  return (
    typeof event.name === "string" &&
    (TAMBO_CUSTOM_EVENT_NAMES as readonly string[]).includes(event.name)
  );
}

/**
 * Casts a CustomEvent to the specific TamboCustomEvent type based on its name.
 * Uses exhaustive type checking to ensure all event types are handled.
 * @param event - The CustomEvent to cast
 * @returns The properly typed TamboCustomEvent, or undefined if not a known Tambo event
 */
export function asTamboCustomEvent(
  event: CustomEvent,
): TamboCustomEvent | undefined {
  switch (event.name) {
    case "tambo.component.start":
      return event as ComponentStartEvent;
    case "tambo.component.props_delta":
      return event as ComponentPropsDeltaEvent;
    case "tambo.component.state_delta":
      return event as ComponentStateDeltaEvent;
    case "tambo.component.end":
      return event as ComponentEndEvent;
    case "tambo.run.awaiting_input":
      return event as RunAwaitingInputEvent;
    default:
      return undefined;
  }
}
