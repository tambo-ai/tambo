/**
 * Tool Call Tracker
 *
 * Tracks tool calls during streaming, accumulating arguments until complete.
 * Owns the tool name → JSON Schema mapping and handles unstrictification
 * so callers don't need to know about schema conversion.
 */

import { EventType, type AGUIEvent } from "@ag-ui/core";
import type { JSONSchema7 } from "json-schema";
import { parse as parsePartialJson } from "partial-json";
import type { TamboTool } from "../../model/component-metadata";
import { schemaToJsonSchema } from "../../schema/schema";
import type { PendingToolCall } from "./tool-executor";
import { unstrictifyToolCallParamsFromSchema } from "./unstrictify";

/**
 * Build a tool-name → JSONSchema7 map from the tool registry.
 * Handles both modern `inputSchema` and deprecated `toolSchema` formats.
 * Tools whose schema can't be converted are silently skipped.
 * @param toolRegistry - Record of tool name → tool definition
 * @returns Map of tool name → JSON Schema
 */
function buildToolSchemas(
  toolRegistry: Record<string, TamboTool>,
): Map<string, JSONSchema7> {
  const schemas = new Map<string, JSONSchema7>();
  for (const tool of Object.values(toolRegistry)) {
    try {
      if ("inputSchema" in tool && tool.inputSchema) {
        schemas.set(tool.name, schemaToJsonSchema(tool.inputSchema));
      } else if ("toolSchema" in tool && tool.toolSchema) {
        schemas.set(tool.name, schemaToJsonSchema(tool.toolSchema));
      }
    } catch {
      // Schema conversion failed — tool still works, just without unstrictification
    }
  }
  return schemas;
}

/**
 * Tracks tool calls during streaming, accumulating arguments until complete.
 *
 * Tool calls arrive as a sequence of events:
 * 1. TOOL_CALL_START - initializes the tool call with name
 * 2. TOOL_CALL_ARGS (multiple) - streams JSON argument fragments
 * 3. TOOL_CALL_END - marks the tool call as complete, triggers JSON parsing
 *
 * When constructed with a tool registry, the tracker unstrictifies parsed
 * args (both partial and final) using the original JSON Schemas.
 */
export class ToolCallTracker {
  private pendingToolCalls = new Map<string, PendingToolCall>();
  private accumulatingArgs = new Map<string, string>();
  private _toolSchemas: Map<string, JSONSchema7>;

  constructor(toolRegistry?: Record<string, TamboTool>) {
    this._toolSchemas = toolRegistry
      ? buildToolSchemas(toolRegistry)
      : new Map();
  }

  /**
   * The tool-name → JSONSchema7 map, for passing to the reducer.
   * @returns The tool schemas map
   */
  get toolSchemas(): Map<string, JSONSchema7> {
    return this._toolSchemas;
  }

  /**
   * Handles a streaming event, tracking tool call state as needed.
   * @param event - The streaming event to process
   * @throws {Error} If JSON parsing fails on TOOL_CALL_END (fail-fast, no silent fallback)
   */
  handleEvent(event: AGUIEvent): void {
    switch (event.type) {
      case EventType.TOOL_CALL_START:
        this.pendingToolCalls.set(event.toolCallId, {
          name: event.toolCallName,
          input: {},
        });
        this.accumulatingArgs.set(event.toolCallId, "");
        break;

      case EventType.TOOL_CALL_ARGS: {
        const current = this.accumulatingArgs.get(event.toolCallId);
        this.accumulatingArgs.set(
          event.toolCallId,
          (current ?? "") + event.delta,
        );
        break;
      }

      case EventType.TOOL_CALL_END: {
        const jsonStr = this.accumulatingArgs.get(event.toolCallId);
        const toolCall = this.pendingToolCalls.get(event.toolCallId);
        if (toolCall && jsonStr) {
          let parsedInput: Record<string, unknown>;
          try {
            parsedInput = JSON.parse(jsonStr) as Record<string, unknown>;
          } catch (error) {
            // Fail-fast: don't silently continue with empty input
            throw new Error(
              `Failed to parse tool call arguments for ${event.toolCallId}: ${error instanceof Error ? error.message : "Unknown error"}. JSON: ${jsonStr.slice(0, 100)}${jsonStr.length > 100 ? "..." : ""}`,
            );
          }

          parsedInput = this.unstrictify(toolCall.name, parsedInput);
          toolCall.input = parsedInput;
        }
        break;
      }

      default:
        // Other event types are ignored - only tool call events are tracked
        break;
    }
  }

  /**
   * Parses partial JSON from the accumulated args for a tool call and
   * unstrictifies the result. Used during streaming to get the current
   * best-effort parsed args.
   * @param toolCallId - ID of the tool call to parse
   * @returns Parsed and unstrictified args, or undefined if not parseable yet
   */
  parsePartialArgs(toolCallId: string): Record<string, unknown> | undefined {
    const accToolCall = this.getAccumulatingToolCall(toolCallId);
    if (!accToolCall) return undefined;

    try {
      const parsed: unknown = parsePartialJson(accToolCall.accumulatedArgs);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        return this.unstrictify(
          accToolCall.name,
          parsed as Record<string, unknown>,
        );
      }
    } catch {
      /* not parseable yet */
    }
    return undefined;
  }

  /**
   * Gets the name and accumulated args for a tool call that is still accumulating.
   * @param toolCallId - ID of the tool call to look up
   * @returns The tool name and raw accumulated args string, or undefined if not found
   */
  getAccumulatingToolCall(
    toolCallId: string,
  ): { name: string; accumulatedArgs: string } | undefined {
    const toolCall = this.pendingToolCalls.get(toolCallId);
    const args = this.accumulatingArgs.get(toolCallId);
    if (!toolCall || args === undefined) return undefined;
    return { name: toolCall.name, accumulatedArgs: args };
  }

  /**
   * Gets tool calls for the given IDs, filtered to only those that exist.
   * @param toolCallIds - IDs of tool calls to retrieve
   * @returns Map of tool call ID to pending tool call
   */
  getToolCallsById(toolCallIds: string[]): Map<string, PendingToolCall> {
    const result = new Map<string, PendingToolCall>();
    for (const id of toolCallIds) {
      const toolCall = this.pendingToolCalls.get(id);
      if (toolCall) {
        result.set(id, toolCall);
      }
    }
    return result;
  }

  /**
   * Clears tracked tool calls for the given IDs.
   * @param toolCallIds - IDs of tool calls to clear
   */
  clearToolCalls(toolCallIds: string[]): void {
    for (const id of toolCallIds) {
      this.pendingToolCalls.delete(id);
      this.accumulatingArgs.delete(id);
    }
  }

  /**
   * Unstrictify params using the schema for the given tool name.
   * Returns params unchanged if no schema is available.
   */
  private unstrictify(
    toolName: string,
    params: Record<string, unknown>,
  ): Record<string, unknown> {
    const schema = this._toolSchemas.get(toolName);
    if (!schema) return params;
    return unstrictifyToolCallParamsFromSchema(schema, params);
  }
}
