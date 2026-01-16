import { parse } from "partial-json";
import { EventType, type BaseEvent } from "@ag-ui/core";

/**
 * Streaming status for component properties.
 */
export type PropStreamingStatus = "started" | "streaming" | "done";

/**
 * RFC 6902 JSON Patch operation.
 */
export interface JsonPatchOperation {
  op: "add" | "replace" | "remove";
  path: string;
  value?: unknown;
}

/**
 * Component streaming state tracker.
 * Tracks incremental JSON parsing and property completion.
 */
export class ComponentStreamTracker {
  private componentId: string;
  private componentName: string;
  private accumulatedJson: string = "";
  private previousProps: Record<string, unknown> = {};
  private streamingStatus: Record<string, PropStreamingStatus> = {};
  private isStarted: boolean = false;

  constructor(componentId: string, componentName: string) {
    this.componentId = componentId;
    this.componentName = componentName;
  }

  /**
   * Process a JSON delta and return any events to emit.
   */
  processJsonDelta(delta: string): BaseEvent[] {
    const events: BaseEvent[] = [];

    // Emit start event if this is the first delta
    if (!this.isStarted) {
      events.push(this.createStartEvent());
      this.isStarted = true;
    }

    // Accumulate JSON
    this.accumulatedJson += delta;

    // Try to parse incrementally
    let currentProps: Record<string, unknown>;
    try {
      currentProps = parse(this.accumulatedJson) as Record<string, unknown>;
    } catch {
      // Can't parse yet, wait for more data
      return events;
    }

    // Check if currentProps is an object
    if (typeof currentProps !== "object" || currentProps === null) {
      return events;
    }

    // Detect newly completed or changed properties
    const { patches, statusUpdates } = this.detectPropertyChanges(
      this.previousProps,
      currentProps,
    );

    // Update streaming status
    for (const [key, status] of Object.entries(statusUpdates)) {
      this.streamingStatus[key] = status;
    }

    // Emit props_delta event if there are changes
    if (patches.length > 0) {
      events.push(this.createPropsDeltaEvent(patches));
    }

    // Update previous props
    this.previousProps = structuredClone(currentProps);

    return events;
  }

  /**
   * Finalize the component and return the end event.
   */
  finalize(): BaseEvent[] {
    const events: BaseEvent[] = [];

    // Parse final JSON
    let finalProps: Record<string, unknown> = {};
    try {
      finalProps = parse(this.accumulatedJson) as Record<string, unknown>;
    } catch {
      // Use what we have
      finalProps = this.previousProps;
    }

    // Mark all properties as done
    for (const key of Object.keys(this.streamingStatus)) {
      this.streamingStatus[key] = "done";
    }

    // Emit end event
    events.push(this.createEndEvent(finalProps));

    return events;
  }

  /**
   * Detect property changes between previous and current props.
   */
  private detectPropertyChanges(
    previousProps: Record<string, unknown>,
    currentProps: Record<string, unknown>,
  ): {
    patches: JsonPatchOperation[];
    statusUpdates: Record<string, PropStreamingStatus>;
  } {
    const patches: JsonPatchOperation[] = [];
    const statusUpdates: Record<string, PropStreamingStatus> = {};

    // Check for new or changed properties
    for (const [key, value] of Object.entries(currentProps)) {
      const prevValue = previousProps[key];
      const currentStatus = this.streamingStatus[key];

      if (!(key in previousProps)) {
        // New property
        patches.push({ op: "add", path: `/${key}`, value });
        statusUpdates[key] = this.isValueComplete(value) ? "done" : "started";
      } else if (!this.deepEqual(prevValue, value)) {
        // Property changed
        patches.push({ op: "replace", path: `/${key}`, value });
        statusUpdates[key] = this.isValueComplete(value) ? "done" : "streaming";
      } else if (currentStatus === "streaming" && this.isValueComplete(value)) {
        // Value completed
        statusUpdates[key] = "done";
      }
    }

    // Check for removed properties (unlikely in streaming but handle it)
    for (const key of Object.keys(previousProps)) {
      if (!(key in currentProps)) {
        patches.push({ op: "remove", path: `/${key}` });
        delete this.streamingStatus[key];
      }
    }

    return { patches, statusUpdates };
  }

  /**
   * Check if a value is complete (not being streamed).
   * Strings are considered incomplete if they look like they might be truncated.
   */
  private isValueComplete(value: unknown): boolean {
    // Primitive values are always complete
    if (typeof value !== "object" || value === null) {
      return true;
    }

    // Arrays are complete if all elements are complete
    if (Array.isArray(value)) {
      return value.every((v) => this.isValueComplete(v));
    }

    // Objects are complete if all values are complete
    return Object.values(value).every((v) => this.isValueComplete(v));
  }

  /**
   * Deep equality check for JSON values.
   */
  private deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (a === null || b === null) return a === b;
    if (typeof a !== "object") return a === b;

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((val, i) => this.deepEqual(val, b[i]));
    }

    if (Array.isArray(a) || Array.isArray(b)) return false;

    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);

    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) => this.deepEqual(aObj[key], bObj[key]));
  }

  /**
   * Create the component start event.
   */
  private createStartEvent(): BaseEvent {
    return {
      type: EventType.CUSTOM,
      name: "tambo.component.start",
      value: {
        componentId: this.componentId,
        name: this.componentName,
      },
      timestamp: Date.now(),
    } as BaseEvent;
  }

  /**
   * Create the props delta event.
   */
  private createPropsDeltaEvent(patches: JsonPatchOperation[]): BaseEvent {
    return {
      type: EventType.CUSTOM,
      name: "tambo.component.props_delta",
      value: {
        componentId: this.componentId,
        patch: patches,
        streamingStatus: { ...this.streamingStatus },
      },
      timestamp: Date.now(),
    } as BaseEvent;
  }

  /**
   * Create the component end event.
   */
  private createEndEvent(finalProps: Record<string, unknown>): BaseEvent {
    return {
      type: EventType.CUSTOM,
      name: "tambo.component.end",
      value: {
        componentId: this.componentId,
        finalProps,
        finalState: undefined, // State is not part of tool call args
      },
      timestamp: Date.now(),
    } as BaseEvent;
  }
}

/**
 * Check if a tool name is a component tool.
 */
export function isComponentTool(toolName: string): boolean {
  return toolName.startsWith("show_component_");
}

/**
 * Extract component name from tool name.
 */
export function extractComponentName(toolName: string): string {
  return toolName.replace("show_component_", "");
}
