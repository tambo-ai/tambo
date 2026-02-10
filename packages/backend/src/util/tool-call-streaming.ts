import { parse } from "partial-json";
import deepEqual from "fast-deep-equal";
import { escapePathComponent, type Operation } from "fast-json-patch";
import { JSONSchema7 } from "json-schema";
import { unstrictifyToolCallParamsFromSchema } from "@tambo-ai-cloud/core";
import {
  createToolCallArgsDeltaEvent,
  createToolCallEndEvent,
  type ToolCallArgsDeltaEvent,
  type ToolCallEndEvent,
  type PropStreamingStatus,
} from "./tambo-custom-events";

/** Maximum size for accumulated JSON (10MB) */
const MAX_JSON_SIZE = 10 * 1024 * 1024;

type ToolCallStreamEvent = ToolCallArgsDeltaEvent | ToolCallEndEvent;

/**
 * Build a single-segment JSON Pointer path for a top-level property key.
 * Escapes per RFC 6901 so keys can safely contain `/` or `~`.
 */
function createJsonPatchPath(key: string): string {
  return `/${escapePathComponent(key)}`;
}

/**
 * Tracks incremental JSON streaming for a single client tool call.
 *
 * Accumulates raw JSON deltas, partial-parses them, unstrictifies the parsed
 * result (stripping strictification-induced nulls), then emits JSON Patch
 * (RFC 6902) operations for changed properties.
 *
 * Follows the same pattern as `ComponentStreamTracker` for component props.
 */
export class ToolCallStreamTracker {
  private toolCallId: string;
  private originalSchema: JSONSchema7;
  private accumulatedJson = "";
  private accumulatedJsonSize = 0;
  private previousArgs: Readonly<Record<string, unknown>> = {};
  private streamingStatus: Record<string, PropStreamingStatus> = {};
  private seenPropertyKeys = new Set<string>();
  private previousPropertyKeys = new Set<string>();

  constructor(toolCallId: string, originalSchema: JSONSchema7) {
    this.toolCallId = toolCallId;
    this.originalSchema = originalSchema;
  }

  /**
   * Process a JSON delta chunk and return any events to emit.
   */
  processJsonDelta(delta: string): ToolCallStreamEvent[] {
    const events: ToolCallStreamEvent[] = [];

    if (this.accumulatedJsonSize + delta.length > MAX_JSON_SIZE) {
      throw new Error(
        `Tool call ${this.toolCallId} JSON exceeds maximum size of ${MAX_JSON_SIZE} bytes`,
      );
    }

    this.accumulatedJson += delta;
    this.accumulatedJsonSize += delta.length;

    let currentRawArgs: Readonly<Record<string, unknown>>;
    try {
      currentRawArgs = parse(this.accumulatedJson) as Readonly<
        Record<string, unknown>
      >;
    } catch {
      return events;
    }

    if (typeof currentRawArgs !== "object" || currentRawArgs === null) {
      return events;
    }

    // Unstrictify: strip nulls for optional non-nullable params, preserve _tambo_* pass-through
    const currentArgs = unstrictifyToolCallParamsFromSchema(
      this.originalSchema,
      currentRawArgs as Record<string, unknown>,
    ) as Readonly<Record<string, unknown>>;

    const { patches, statusUpdates, newPropertyKeys } =
      this.detectPropertyChanges(this.previousArgs, currentArgs);

    // Apply status updates from detectPropertyChanges first
    for (const [key, status] of Object.entries(statusUpdates)) {
      this.streamingStatus[key] = status;
    }

    // Mark previous properties as "done" when new properties appear.
    // This runs AFTER statusUpdates so "done" takes precedence over "streaming"
    // for properties that changed in the same delta where a new property appeared.
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

    this.previousPropertyKeys = new Set(Object.keys(currentArgs));
    for (const key of this.previousPropertyKeys) {
      this.seenPropertyKeys.add(key);
    }

    if (patches.length > 0) {
      events.push(this.createArgsDeltaEvent(patches));
    }

    this.previousArgs = currentArgs;

    return events;
  }

  /**
   * Finalize the tool call and return the end event with clean args.
   */
  finalize(): ToolCallStreamEvent[] {
    const events: ToolCallStreamEvent[] = [];

    let rawArgs: Record<string, unknown>;
    try {
      const parsed = JSON.parse(this.accumulatedJson) as unknown;
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        throw new Error("final JSON is not an object");
      }
      rawArgs = parsed as Record<string, unknown>;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown parse error";
      throw new Error(
        `Tool call ${this.toolCallId} failed to parse final JSON: ${errorMessage}`,
      );
    }

    const finalArgs = unstrictifyToolCallParamsFromSchema(
      this.originalSchema,
      rawArgs,
    );

    // Mark all properties as done
    for (const key of Object.keys(this.streamingStatus)) {
      this.streamingStatus[key] = "done";
    }

    events.push(
      createToolCallEndEvent({
        toolCallId: this.toolCallId,
        finalArgs,
      }),
    );

    return events;
  }

  /**
   * Get the accumulated raw JSON string (for backwards-compatible arg storage).
   * @returns The raw accumulated JSON before unstrictification.
   */
  getAccumulatedJson(): string {
    return this.accumulatedJson;
  }

  /**
   * Detect property changes between previous and current args.
   */
  private detectPropertyChanges(
    previousArgs: Readonly<Record<string, unknown>>,
    currentArgs: Readonly<Record<string, unknown>>,
  ): {
    patches: Operation[];
    statusUpdates: Record<string, PropStreamingStatus>;
    newPropertyKeys: string[];
  } {
    const patches: Operation[] = [];
    const statusUpdates: Record<string, PropStreamingStatus> = {};
    const newPropertyKeys: string[] = [];

    for (const [key, value] of Object.entries(currentArgs)) {
      const prevValue = previousArgs[key];
      const path = createJsonPatchPath(key);

      if (!this.seenPropertyKeys.has(key)) {
        patches.push({ op: "add", path, value });
        statusUpdates[key] = "started";
        newPropertyKeys.push(key);
      } else if (!(key in previousArgs)) {
        patches.push({ op: "add", path, value });
        statusUpdates[key] = "streaming";
      } else if (!deepEqual(prevValue, value)) {
        patches.push({ op: "replace", path, value });
        if (this.streamingStatus[key] !== "done") {
          statusUpdates[key] = "streaming";
        }
      }
    }

    for (const key of Object.keys(previousArgs)) {
      if (!(key in currentArgs)) {
        patches.push({ op: "remove", path: createJsonPatchPath(key) });
        delete this.streamingStatus[key];
      }
    }

    return { patches, statusUpdates, newPropertyKeys };
  }

  private createArgsDeltaEvent(patches: Operation[]): ToolCallArgsDeltaEvent {
    return createToolCallArgsDeltaEvent({
      toolCallId: this.toolCallId,
      operations: patches,
      streamingStatus: { ...this.streamingStatus },
    });
  }
}
