/**
 * Devtools Event Bus
 *
 * A lightweight pub/sub event bus for Tambo devtools integration.
 * Emits raw AG-UI events from the streaming pipeline so devtools
 * can display a real-time timeline of SDK activity.
 *
 * Zero overhead when no listeners are subscribed — emit is a no-op.
 */

import { EventType, type BaseEvent } from "@ag-ui/core";

/**
 * High-frequency event types that are skipped to avoid flooding the timeline.
 * These fire on every chunk/delta and would overwhelm the UI.
 */
const SKIPPED_EVENT_TYPES = new Set<string>([
  EventType.TEXT_MESSAGE_CONTENT,
  EventType.TOOL_CALL_ARGS,
  "tambo.component.props_delta",
  "tambo.component.state_delta",
]);

/**
 * A devtools-consumable event representing a discrete SDK action.
 */
export interface DevtoolsEvent {
  /** Unique event ID. */
  id: string;
  /** AG-UI event type name or synthetic type (e.g. "user_message"). */
  type: string;
  /** High-resolution timestamp from performance.now(). */
  timestamp: number;
  /** Thread this event belongs to. */
  threadId: string;
  /** Run ID, if available. */
  runId?: string;
  /** Event-specific payload (varies by type). */
  detail: Record<string, unknown>;
}

/**
 * Listener callback for devtools events.
 */
export type DevtoolsEventListener = (event: DevtoolsEvent) => void;

let idCounter = 0;

/**
 * Creates a unique event ID.
 * @returns A unique string ID
 */
function nextId(): string {
  return `tdt_${++idCounter}_${Date.now()}`;
}

/**
 * Lightweight event bus for devtools event capture.
 */
class DevtoolsEventBus {
  private listeners = new Set<DevtoolsEventListener>();

  /**
   * Subscribe to devtools events.
   * @param listener - Callback invoked for each emitted event
   * @returns Unsubscribe function
   */
  subscribe(listener: DevtoolsEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Emit a devtools event. No-op when no listeners are subscribed.
   * @param type - Event type string
   * @param threadId - Thread ID
   * @param detail - Event-specific payload
   * @param runId - Optional run ID
   */
  emit(
    type: string,
    threadId: string,
    detail: Record<string, unknown>,
    runId?: string,
  ): void {
    if (this.listeners.size === 0) {
      return;
    }
    const event: DevtoolsEvent = {
      id: nextId(),
      type,
      timestamp:
        typeof performance !== "undefined" ? performance.now() : Date.now(),
      threadId,
      runId,
      detail,
    };
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  /**
   * Emit a devtools event from a raw AG-UI BaseEvent.
   * Extracts relevant fields from the event and emits to listeners.
   * @param agEvent - The raw AG-UI event
   * @param threadId - Thread ID for this event
   * @param runId - Optional run ID
   */
  emitFromAgEvent(agEvent: BaseEvent, threadId: string, runId?: string): void {
    if (this.listeners.size === 0) {
      return;
    }

    // For CUSTOM events, resolve the Tambo event name (e.g. "tambo.component.start")
    // and check that against the skip list too
    const eventRecord = agEvent as Record<string, unknown>;
    const customName =
      agEvent.type === EventType.CUSTOM && typeof eventRecord.name === "string"
        ? eventRecord.name
        : undefined;

    const typeToCheck = customName ?? agEvent.type;
    if (SKIPPED_EVENT_TYPES.has(typeToCheck)) {
      return;
    }

    // Extract useful detail fields from the AG-UI event (type-dependent)
    const detail: Record<string, unknown> = {};

    if ("toolCallId" in eventRecord) {
      detail.toolCallId = eventRecord.toolCallId;
    }
    if ("toolCallName" in eventRecord) {
      detail.toolCallName = eventRecord.toolCallName;
    }
    if ("messageId" in eventRecord) {
      detail.messageId = eventRecord.messageId;
    }
    if ("name" in eventRecord) {
      detail.name = eventRecord.name;
    }
    if ("message" in eventRecord) {
      detail.message = eventRecord.message;
    }
    if ("error" in eventRecord) {
      detail.error = eventRecord.error;
    }
    if ("result" in eventRecord) {
      detail.result = eventRecord.result;
    }
    if ("value" in eventRecord) {
      detail.value = eventRecord.value;
    }

    // Use the Tambo custom event name as the type for better readability
    const emitType = customName ?? agEvent.type;
    this.emit(emitType, threadId, detail, runId);
  }

  /**
   * Whether there are active listeners.
   * @returns true if at least one listener is subscribed
   */
  get hasListeners(): boolean {
    return this.listeners.size > 0;
  }
}

/**
 * Singleton event bus for devtools integration.
 * Import and use this from streaming pipelines to emit events.
 */
export const devtoolsEventBus = new DevtoolsEventBus();
