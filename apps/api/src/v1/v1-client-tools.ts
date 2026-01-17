import {
  EventType,
  type BaseEvent,
  type ToolCallStartEvent,
  type ToolCallArgsEvent,
  type ToolCallEndEvent,
  type ToolCallResultEvent,
} from "@ag-ui/client";

/** Maximum size for tool call arguments (1MB) */
const MAX_ARGS_SIZE = 1024 * 1024;

/**
 * Information about a pending tool call that needs client-side execution.
 */
export interface PendingToolCall {
  /** Unique identifier for the tool call */
  toolCallId: string;
  /** Name of the tool being called */
  toolName: string;
  /** Arguments passed to the tool (as JSON string) */
  arguments: string;
}

/**
 * Tracks tool call state during streaming.
 * Records which tool calls have started and which have received results.
 */
export class ToolCallTracker {
  /** Tool calls that have started but not yet received results */
  private startedToolCalls: Map<
    string,
    { toolName: string; arguments: string }
  > = new Map();

  /** Tool call IDs that have received results (system or UI tools) */
  private completedToolCallIds: Set<string> = new Set();

  /** Accumulated argument chunks for each tool call (more efficient than string concat) */
  private toolCallArgumentChunks: Map<string, string[]> = new Map();

  /** Track accumulated size per tool call to enforce limits */
  private toolCallArgumentSizes: Map<string, number> = new Map();

  /**
   * Process an AG-UI event and update tracking state.
   */
  processEvent(event: BaseEvent): void {
    switch (event.type) {
      case EventType.TOOL_CALL_START: {
        const e = event as unknown as ToolCallStartEvent;
        this.startedToolCalls.set(e.toolCallId, {
          toolName: e.toolCallName,
          arguments: "",
        });
        this.toolCallArgumentChunks.set(e.toolCallId, []);
        this.toolCallArgumentSizes.set(e.toolCallId, 0);
        break;
      }
      case EventType.TOOL_CALL_ARGS:
      case EventType.TOOL_CALL_CHUNK: {
        const e = event as unknown as ToolCallArgsEvent;
        const chunks = this.toolCallArgumentChunks.get(e.toolCallId);
        const currentSize = this.toolCallArgumentSizes.get(e.toolCallId) ?? 0;

        // Fail fast if size limit exceeded - don't silently truncate
        if (currentSize + e.delta.length > MAX_ARGS_SIZE) {
          throw new Error(
            `Tool call ${e.toolCallId} arguments exceed maximum size of ${MAX_ARGS_SIZE} bytes`,
          );
        }

        if (chunks) {
          chunks.push(e.delta);
          this.toolCallArgumentSizes.set(
            e.toolCallId,
            currentSize + e.delta.length,
          );
        }
        break;
      }
      case EventType.TOOL_CALL_END: {
        const e = event as unknown as ToolCallEndEvent;
        const toolCall = this.startedToolCalls.get(e.toolCallId);
        if (toolCall) {
          // Join accumulated chunks into final arguments string
          const chunks = this.toolCallArgumentChunks.get(e.toolCallId) ?? [];
          toolCall.arguments = chunks.join("");
        }
        break;
      }
      case EventType.TOOL_CALL_RESULT: {
        // Tool call has been handled (either system tool or UI tool)
        const e = event as unknown as ToolCallResultEvent;
        this.completedToolCallIds.add(e.toolCallId);
        break;
      }
    }
  }

  /**
   * Get pending tool calls that haven't received results.
   * These are client-side tools that need external execution.
   */
  getPendingToolCalls(): PendingToolCall[] {
    const pending: PendingToolCall[] = [];

    for (const [toolCallId, info] of this.startedToolCalls) {
      if (!this.completedToolCallIds.has(toolCallId)) {
        pending.push({
          toolCallId,
          toolName: info.toolName,
          arguments: info.arguments,
        });
      }
    }

    return pending;
  }

  /**
   * Check if there are any pending tool calls.
   */
  hasPendingToolCalls(): boolean {
    for (const toolCallId of this.startedToolCalls.keys()) {
      if (!this.completedToolCallIds.has(toolCallId)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get the IDs of all pending tool calls.
   */
  getPendingToolCallIds(): string[] {
    return this.getPendingToolCalls().map((tc) => tc.toolCallId);
  }
}

/**
 * Create the tambo.run.awaiting_input event payload.
 */
export function createAwaitingInputEvent(
  pendingToolCalls: PendingToolCall[],
): BaseEvent {
  return {
    type: EventType.CUSTOM,
    name: "tambo.run.awaiting_input",
    value: {
      pendingToolCalls: pendingToolCalls.map((tc) => ({
        toolCallId: tc.toolCallId,
        toolName: tc.toolName,
        arguments: tc.arguments,
      })),
    },
    timestamp: Date.now(),
  } as BaseEvent;
}
