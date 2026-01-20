import { parse } from "partial-json";
import { EventType, type BaseEvent } from "@ag-ui/core";
import deepEqual from "fast-deep-equal";
import { escapePathComponent, type Operation } from "fast-json-patch";

/** Maximum size for accumulated JSON (10MB) */
const MAX_JSON_SIZE = 10 * 1024 * 1024;

const COMPONENT_TOOL_PREFIX = "show_component_";

/**
 * Component streaming utilities.
 *
 * `tambo.component.props_delta` uses RFC 6902 JSON Patch operations, where
 * operation paths are RFC 6901 JSON Pointers. Prop keys are always escaped via
 * `escapePathComponent` from `fast-json-patch` so `~` becomes `~0` and `/`
 * becomes `~1`.
 *
 * This module also relies on the incremental JSON parser returning a fresh,
 * plain-object snapshot on each parse. If that ever changes (parser swap,
 * pooling, in-place mutation), this tracker must reintroduce a cloning
 * strategy.
 *
 * Consumers are expected to apply patches in-order to the same canonical props
 * tree, and avoid out-of-band mutations that would invalidate JSON Pointer
 * paths.
 */

/**
 * Streaming status for component properties.
 */
export type PropStreamingStatus = "started" | "streaming" | "done";

type JsonPatchOperation = Operation;

/**
 * Build a single-segment JSON Pointer path for a top-level prop key.
 *
 * Note: the `key` here is a literal object key, not an already-encoded JSON
 * Pointer. We must escape it per RFC 6901 so keys can safely contain `/` or `~`.
 * An empty-string key intentionally becomes `/` (RFC 6901), and is covered by
 * unit tests.
 *
 * Callers must pass raw object keys here; never pass pre-escaped JSON Pointer
 * segments.
 *
 * This helper is the only supported way to build JSON Patch paths in this
 * module.
 *
 * If nested paths ever become necessary, extend this helper to accept multiple
 * path segments rather than concatenating raw strings.
 */
function createJsonPatchPath(key: string): string {
  return `/${escapePathComponent(key)}`;
}

/**
 * Component streaming state tracker.
 * Tracks incremental JSON parsing and property completion.
 *
 * Performance note: this runs on every tool-input delta. Avoid full deep clones
 * (`structuredClone`, JSON stringify, etc.) of the parsed props tree on each
 * delta. `partial-json` returns a fresh plain object per parse, and we treat
 * those values as immutable snapshots.
 */
export class ComponentStreamTracker {
  private componentId: string;
  private componentName: string;
  private accumulatedJson: string = "";
  private accumulatedJsonSize: number = 0;
  // `partial-json` parses into plain objects. It also returns a fresh object on
  // each parse, so we can treat these values as immutable snapshots and avoid a
  // deep clone on every delta.
  private previousProps: Readonly<Record<string, unknown>> = {};
  private streamingStatus: Record<string, PropStreamingStatus> = {};
  private isStarted: boolean = false;
  /** Set of property keys that have been seen, used to determine done-ness */
  private seenPropertyKeys: Set<string> = new Set();
  /** Properties that were seen in the last parse, used to detect new properties */
  private previousPropertyKeys: Set<string> = new Set();

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

    // Fail fast if size limit exceeded - don't silently truncate
    if (this.accumulatedJsonSize + delta.length > MAX_JSON_SIZE) {
      throw new Error(
        `Component ${this.componentId} (${this.componentName}) JSON exceeds maximum size of ${MAX_JSON_SIZE} bytes`,
      );
    }

    this.accumulatedJson += delta;
    this.accumulatedJsonSize += delta.length;

    // Try to parse incrementally
    let currentProps: Readonly<Record<string, unknown>>;
    try {
      // IMPORTANT: `parse()` must return a fresh object tree on each call.
      // This tracker relies on treating `previousProps` as an immutable
      // snapshot without deep-cloning on every delta.
      currentProps = parse(this.accumulatedJson) as Readonly<
        Record<string, unknown>
      >;
    } catch {
      // Can't parse yet, wait for more data
      return events;
    }

    // Check if currentProps is an object
    if (typeof currentProps !== "object" || currentProps === null) {
      return events;
    }

    // Detect newly completed or changed properties
    const { patches, statusUpdates, newPropertyKeys } =
      this.detectPropertyChanges(this.previousProps, currentProps);

    // Mark previous properties as "done" when new properties appear
    // (A property is only done when we move on to parsing a new property)
    if (newPropertyKeys.length > 0) {
      for (const key of this.previousPropertyKeys) {
        if (
          this.streamingStatus[key] !== "done" &&
          !newPropertyKeys.includes(key)
        ) {
          this.streamingStatus[key] = "done";
        }
      }
    }

    // Update streaming status for current properties
    for (const [key, status] of Object.entries(statusUpdates)) {
      this.streamingStatus[key] = status;
    }

    // Update tracking of seen properties
    this.previousPropertyKeys = new Set(Object.keys(currentProps));
    for (const key of this.previousPropertyKeys) {
      this.seenPropertyKeys.add(key);
    }

    // Emit props_delta event if there are changes
    if (patches.length > 0) {
      events.push(this.createPropsDeltaEvent(patches));
    }

    // Treat parsed props as immutable snapshots; do not mutate `currentProps`
    // or `previousProps`. If we ever need to change parsers (or mutate props),
    // revisit this assignment and the performance tradeoffs of cloning.
    this.previousProps = currentProps;

    return events;
  }

  /**
   * Finalize the component and return the end event.
   */
  finalize(): BaseEvent[] {
    const events: BaseEvent[] = [];

    // Parse final JSON - fail fast if unparseable
    let finalProps: Record<string, unknown>;
    try {
      const parsed = JSON.parse(this.accumulatedJson) as unknown;
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        throw new Error("final JSON is not an object");
      }
      finalProps = parsed as Record<string, unknown>;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown parse error";
      throw new Error(
        `Component ${this.componentId} (${this.componentName}) failed to parse final JSON: ${errorMessage}`,
      );
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
   *
   * Property "done-ness" logic:
   * - A property starts as "started" when first seen
   * - A property becomes "streaming" when its value changes
   * - A property becomes "done" ONLY when a NEW property is first seen
   *   (not based on whether the value is a primitive or complex type)
   */
  private detectPropertyChanges(
    previousProps: Readonly<Record<string, unknown>>,
    currentProps: Readonly<Record<string, unknown>>,
  ): {
    patches: JsonPatchOperation[];
    statusUpdates: Record<string, PropStreamingStatus>;
    newPropertyKeys: string[];
  } {
    const patches: JsonPatchOperation[] = [];
    const statusUpdates: Record<string, PropStreamingStatus> = {};
    const newPropertyKeys: string[] = [];

    // Check for new or changed properties
    for (const [key, value] of Object.entries(currentProps)) {
      const prevValue = previousProps[key];
      const path = createJsonPatchPath(key);

      if (!this.seenPropertyKeys.has(key)) {
        // Truly new property (never seen before)
        patches.push({ op: "add", path, value });
        statusUpdates[key] = "started";
        newPropertyKeys.push(key);
      } else if (!(key in previousProps)) {
        // Property was seen before but not in previous props (edge case)
        patches.push({ op: "add", path, value });
        statusUpdates[key] = "streaming";
      } else if (!deepEqual(prevValue, value)) {
        // Property changed
        patches.push({ op: "replace", path, value });
        // Keep status as "streaming" - it will become "done" when a new prop appears
        if (this.streamingStatus[key] !== "done") {
          statusUpdates[key] = "streaming";
        }
      }
    }

    // Check for removed properties (unlikely in streaming but handle it)
    for (const key of Object.keys(previousProps)) {
      if (!(key in currentProps)) {
        patches.push({ op: "remove", path: createJsonPatchPath(key) });
        delete this.streamingStatus[key];
      }
    }

    return { patches, statusUpdates, newPropertyKeys };
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
 *
 * A component tool must start with the component prefix and have a non-empty
 * component name suffix.
 */
export function isComponentTool(toolName: string): boolean {
  return (
    toolName.startsWith(COMPONENT_TOOL_PREFIX) &&
    toolName.length > COMPONENT_TOOL_PREFIX.length
  );
}

/**
 * Try to extract component name from tool name.
 *
 * @returns The extracted component name, or undefined if the tool name is not a
 * valid component tool name.
 */
export function tryExtractComponentName(toolName: string): string | undefined {
  if (!isComponentTool(toolName)) {
    return undefined;
  }

  return toolName.slice(COMPONENT_TOOL_PREFIX.length);
}

/**
 * Extract component name from tool name.
 *
 * Prefer {@link tryExtractComponentName} for unvalidated names.
 *
 * Callers must guard with {@link isComponentTool} before calling this; this
 * will throw if the name is not a valid component tool name.
 */
export function extractComponentName(toolName: string): string {
  const componentName = tryExtractComponentName(toolName);

  if (!componentName) {
    throw new Error(`Invalid component tool name: ${toolName}`);
  }

  return componentName;
}
