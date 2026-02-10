/**
 * Tool Call Tracker
 *
 * Tracks tool calls during streaming, accumulating arguments until complete.
 * Used by the send message hook to collect tool call state for execution.
 */

import { EventType, type AGUIEvent } from "@ag-ui/core";
import { applyPatch, type Operation } from "fast-json-patch";
import type { PendingToolCall } from "./tool-executor";

/**
 * Tracks tool calls during streaming, accumulating arguments until complete.
 *
 * Tool calls arrive as a sequence of events:
 * 1. TOOL_CALL_START - initializes the tool call with name
 * 2. TOOL_CALL_ARGS (multiple) - streams JSON argument fragments
 * 3. TOOL_CALL_END - marks the tool call as complete, triggers JSON parsing
 *
 * This class accumulates these events and provides the complete tool call
 * data when requested for execution.
 */
export class ToolCallTracker {
  private pendingToolCalls = new Map<string, PendingToolCall>();
  private accumulatingArgs = new Map<string, string>();

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
          try {
            toolCall.input = JSON.parse(jsonStr) as Record<string, unknown>;
          } catch (error) {
            // Fail-fast: don't silently continue with empty input
            throw new Error(
              `Failed to parse tool call arguments for ${event.toolCallId}: ${error instanceof Error ? error.message : "Unknown error"}. JSON: ${jsonStr.slice(0, 100)}${jsonStr.length > 100 ? "..." : ""}`,
            );
          }
        }
        break;
      }

      default:
        // Other event types are ignored - only tool call events are tracked
        break;
    }
  }

  /**
   * Gets the name and accumulated args for a tool call that is still accumulating.
   * Used by the event loop to get tool state for partial JSON parsing.
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
   * Apply JSON Patch operations to a tool call's input, building up args
   * incrementally from `tambo.tool_call.args_delta` events.
   * @param toolCallId - ID of the tool call to patch
   * @param operations - RFC 6902 JSON Patch operations to apply
   * @returns The updated input after applying patches, or undefined if not found
   */
  applyArgsPatch(
    toolCallId: string,
    operations: Operation[],
  ): Record<string, unknown> | undefined {
    const toolCall = this.pendingToolCalls.get(toolCallId);
    if (!toolCall) return undefined;

    const result = applyPatch(toolCall.input, operations, false, false);
    toolCall.input = result.newDocument;
    return toolCall.input;
  }

  /**
   * Set the final clean args for a tool call from a `tambo.tool_call.end` event.
   * @param toolCallId - ID of the tool call
   * @param finalArgs - The final unstrictified arguments
   */
  setFinalArgs(toolCallId: string, finalArgs: Record<string, unknown>): void {
    const toolCall = this.pendingToolCalls.get(toolCallId);
    if (!toolCall) return;
    toolCall.input = finalArgs;
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
}
