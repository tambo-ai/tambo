/**
 * Tool Call Tracker for v1 API
 *
 * Tracks tool calls during streaming, accumulating arguments until complete.
 * Used by the send message hook to collect tool call state for execution.
 */

import {
  EventType,
  type BaseEvent,
  type ToolCallStartEvent,
  type ToolCallArgsEvent,
  type ToolCallEndEvent,
} from "@ag-ui/core";
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
  handleEvent(event: BaseEvent): void {
    if (event.type === EventType.TOOL_CALL_START) {
      const toolCallStart = event as ToolCallStartEvent;
      this.pendingToolCalls.set(toolCallStart.toolCallId, {
        name: toolCallStart.toolCallName,
        input: {},
      });
      this.accumulatingArgs.set(toolCallStart.toolCallId, "");
    } else if (event.type === EventType.TOOL_CALL_ARGS) {
      const toolCallArgs = event as ToolCallArgsEvent;
      const current = this.accumulatingArgs.get(toolCallArgs.toolCallId);
      this.accumulatingArgs.set(
        toolCallArgs.toolCallId,
        (current ?? "") + toolCallArgs.delta,
      );
    } else if (event.type === EventType.TOOL_CALL_END) {
      const toolCallEnd = event as ToolCallEndEvent;
      const jsonStr = this.accumulatingArgs.get(toolCallEnd.toolCallId);
      const toolCall = this.pendingToolCalls.get(toolCallEnd.toolCallId);
      if (toolCall && jsonStr) {
        try {
          toolCall.input = JSON.parse(jsonStr) as Record<string, unknown>;
        } catch (error) {
          // Fail-fast: don't silently continue with empty input
          throw new Error(
            `Failed to parse tool call arguments for ${toolCallEnd.toolCallId}: ${error instanceof Error ? error.message : "Unknown error"}. JSON: ${jsonStr.slice(0, 100)}${jsonStr.length > 100 ? "..." : ""}`,
          );
        }
      }
    }
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
}
