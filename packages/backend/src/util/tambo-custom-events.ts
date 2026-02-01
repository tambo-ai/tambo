/**
 * Tambo-specific Custom Event Types for v1 Streaming API
 *
 * These types define the custom events emitted by the Tambo backend that extend
 * the standard AG-UI event protocol. The backend is the source of truth for
 * these event definitions.
 *
 * IMPORTANT: These types MUST be kept in sync with the frontend SDK types at:
 * react-sdk/src/v1/types/event.ts
 *
 * TODO: Find a way to share these type definitions between frontend and backend
 * to avoid manual synchronization. Options to consider:
 * - Move to a shared package (e.g., @tambo-ai-cloud/core)
 * - Generate frontend types from backend definitions
 * - Use a shared schema (e.g., JSON Schema, Zod) to generate both
 */

import { EventType } from "@ag-ui/core";
import type { Operation } from "fast-json-patch";

/**
 * Base fields for all Tambo custom events.
 * This mirrors the AG-UI CustomEvent structure but with explicit typing.
 * The index signature ensures compatibility with AG-UI's Zod passthrough schema.
 */
interface TamboCustomEventBase {
  /** Event type - always CUSTOM for Tambo events */
  type: typeof EventType.CUSTOM;
  /** Unix timestamp in milliseconds */
  timestamp: number;
  /** Optional raw event data */
  rawEvent?: unknown;
  /** Index signature for AG-UI BaseEvent compatibility */
  [key: string]: unknown;
}

/**
 * Helper type to create a strongly-typed custom event envelope.
 * Combines base event fields with specific name and value types.
 */
type TamboCustomEventEnvelope<
  TName extends string,
  TValue,
> = TamboCustomEventBase & {
  name: TName;
  value: TValue;
};

// =============================================================================
// Component Streaming Events
// =============================================================================

/**
 * Value payload for component start event.
 */
export interface ComponentStartEventValue {
  /** ID of the message this component belongs to */
  messageId: string;
  /** Unique identifier for this component instance */
  componentId: string;
  /** Name of the component being rendered */
  componentName: string;
}

/**
 * Component start event (custom: tambo.component.start)
 * Emitted when a component tool call begins streaming.
 */
export type ComponentStartEvent = TamboCustomEventEnvelope<
  "tambo.component.start",
  ComponentStartEventValue
>;

/**
 * Streaming status for individual component properties.
 */
export type PropStreamingStatus = "started" | "streaming" | "done";

/**
 * Value payload for component props delta event.
 */
export interface ComponentPropsDeltaEventValue {
  /** ID of the component being updated */
  componentId: string;
  /** JSON Patch operations (RFC 6902) to apply to props */
  operations: Operation[];
  /** Current streaming status of each property */
  streamingStatus: Record<string, PropStreamingStatus>;
}

/**
 * Component props delta event (custom: tambo.component.props_delta)
 * Uses JSON Patch (RFC 6902) to incrementally update component props.
 */
export type ComponentPropsDeltaEvent = TamboCustomEventEnvelope<
  "tambo.component.props_delta",
  ComponentPropsDeltaEventValue
>;

/**
 * Value payload for component state delta event.
 */
export interface ComponentStateDeltaEventValue {
  /** ID of the component being updated */
  componentId: string;
  /** JSON Patch operations (RFC 6902) to apply to state */
  operations: Operation[];
}

/**
 * Component state delta event (custom: tambo.component.state_delta)
 * Uses JSON Patch (RFC 6902) to incrementally update component state.
 */
export type ComponentStateDeltaEvent = TamboCustomEventEnvelope<
  "tambo.component.state_delta",
  ComponentStateDeltaEventValue
>;

/**
 * Value payload for component end event.
 */
export interface ComponentEndEventValue {
  /** ID of the component that finished streaming */
  componentId: string;
  /** Final resolved props for the component */
  finalProps: Record<string, unknown>;
  /** Final resolved state for the component (if any) */
  finalState: Record<string, unknown> | undefined;
}

/**
 * Component end event (custom: tambo.component.end)
 * Emitted when component streaming completes.
 */
export type ComponentEndEvent = TamboCustomEventEnvelope<
  "tambo.component.end",
  ComponentEndEventValue
>;

// =============================================================================
// Run Lifecycle Events
// =============================================================================

/**
 * Information about a pending tool call awaiting client-side execution.
 */
export interface PendingToolCall {
  /** Unique identifier for this tool call */
  toolCallId: string;
  /** Name of the tool to be executed */
  toolName: string;
  /** JSON-encoded arguments for the tool */
  arguments: string;
}

/**
 * Value payload for run awaiting input event.
 */
export interface RunAwaitingInputEventValue {
  /** Tool calls that need client-side execution */
  pendingToolCalls: PendingToolCall[];
}

/**
 * Run awaiting input event (custom: tambo.run.awaiting_input)
 * Signals that the run is paused waiting for client-side tool execution.
 */
export type RunAwaitingInputEvent = TamboCustomEventEnvelope<
  "tambo.run.awaiting_input",
  RunAwaitingInputEventValue
>;

// =============================================================================
// Union Types and Constants
// =============================================================================

/**
 * Union of all Tambo-specific custom events.
 */
export type TamboCustomEvent =
  | ComponentStartEvent
  | ComponentPropsDeltaEvent
  | ComponentStateDeltaEvent
  | ComponentEndEvent
  | RunAwaitingInputEvent;

/**
 * Known Tambo custom event names.
 */
export const TAMBO_CUSTOM_EVENT_NAMES = [
  "tambo.component.start",
  "tambo.component.props_delta",
  "tambo.component.state_delta",
  "tambo.component.end",
  "tambo.run.awaiting_input",
] as const;

export type TamboCustomEventName = (typeof TAMBO_CUSTOM_EVENT_NAMES)[number];

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a component start event.
 */
export function createComponentStartEvent(
  value: ComponentStartEventValue,
): ComponentStartEvent {
  return {
    type: EventType.CUSTOM,
    name: "tambo.component.start",
    value,
    timestamp: Date.now(),
  };
}

/**
 * Create a component props delta event.
 */
export function createComponentPropsDeltaEvent(
  value: ComponentPropsDeltaEventValue,
): ComponentPropsDeltaEvent {
  return {
    type: EventType.CUSTOM,
    name: "tambo.component.props_delta",
    value,
    timestamp: Date.now(),
  };
}

/**
 * Create a component state delta event.
 */
export function createComponentStateDeltaEvent(
  value: ComponentStateDeltaEventValue,
): ComponentStateDeltaEvent {
  return {
    type: EventType.CUSTOM,
    name: "tambo.component.state_delta",
    value,
    timestamp: Date.now(),
  };
}

/**
 * Create a component end event.
 */
export function createComponentEndEvent(
  value: ComponentEndEventValue,
): ComponentEndEvent {
  return {
    type: EventType.CUSTOM,
    name: "tambo.component.end",
    value,
    timestamp: Date.now(),
  };
}

/**
 * Create a run awaiting input event.
 */
export function createRunAwaitingInputEvent(
  value: RunAwaitingInputEventValue,
): RunAwaitingInputEvent {
  return {
    type: EventType.CUSTOM,
    name: "tambo.run.awaiting_input",
    value,
    timestamp: Date.now(),
  };
}
