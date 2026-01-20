import { Logger } from "@nestjs/common";
import {
  EventType,
  type BaseEvent,
  type CustomEvent,
  type ToolCallStartEvent,
  type ToolCallArgsEvent,
  type ToolCallEndEvent,
  type ToolCallResultEvent,
} from "@ag-ui/client";

const logger = new Logger("ClientToolCallTracker");

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
  /**
   * Arguments passed to the tool (as JSON string).
   *
   * Note: arguments are populated when TOOL_CALL_END is received.
   */
  arguments: string;
}

/**
 * Tracks client-executable tool call state during streaming.
 *
 * This is used to determine whether a V1 run should emit
 * `tambo.run.awaiting_input`.
 *
 * Instances are intended to be used for a single streamed run only and should
 * not be reused across requests.
 *
 * Tool calls not present in the client tool allowlist are ignored.
 *
 * Pending tool calls remain pending until TOOL_CALL_RESULT is received. In the
 * V1 client-tool pause flow, TOOL_CALL_RESULT generally will not be sent by the
 * server for client tools (the tool completes out-of-band via a follow-up
 * request).
 *
 * This tracker treats any allow-listed tool that has started but has not
 * produced a TOOL_CALL_RESULT as pending. It does not attempt to distinguish
 * between an intentional client-tool pause and a tool call that is stuck due to
 * a misconfiguration.
 */
export class ClientToolCallTracker {
  private readonly clientToolNames: ReadonlySet<string>;

  /**
   * Client tool calls (names in `clientToolNames`) that have started and have
   * not yet emitted a TOOL_CALL_RESULT event.
   *
   * Note: TOOL_CALL_END indicates argument streaming is complete but does not
   * remove the call from this map.
   */
  private pendingClientToolCalls: Map<
    string,
    { toolName: string; arguments: string }
  > = new Map();

  /** Accumulated argument chunks for each tool call (more efficient than string concat) */
  private toolCallArgumentChunks: Map<string, string[]> = new Map();

  /** Track accumulated size per tool call to enforce limits */
  private toolCallArgumentSizes: Map<string, number> = new Map();

  constructor(clientToolNames: ReadonlySet<string>) {
    this.clientToolNames = clientToolNames;
  }

  /**
   * Process an AG-UI event and update tracking state.
   */
  processEvent(event: BaseEvent): void {
    switch (event.type) {
      case EventType.TOOL_CALL_START: {
        const e = event as unknown as ToolCallStartEvent;
        if (!this.clientToolNames.has(e.toolCallName)) {
          break;
        }
        this.pendingClientToolCalls.set(e.toolCallId, {
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

        // Warn if we receive args for an unknown tool call (likely a bug in event ordering)
        if (!chunks) {
          logger.warn(
            `Received TOOL_CALL_ARGS for unknown tool call ID "${e.toolCallId}". ` +
              `This may indicate events arrived out of order or TOOL_CALL_START was missed.`,
          );
          break;
        }

        const currentSize = this.toolCallArgumentSizes.get(e.toolCallId) ?? 0;

        // Fail fast if size limit exceeded - don't silently truncate
        if (currentSize + e.delta.length > MAX_ARGS_SIZE) {
          throw new Error(
            `Tool call ${e.toolCallId} arguments exceed maximum size of ${MAX_ARGS_SIZE} bytes`,
          );
        }

        chunks.push(e.delta);
        this.toolCallArgumentSizes.set(
          e.toolCallId,
          currentSize + e.delta.length,
        );
        break;
      }
      case EventType.TOOL_CALL_END: {
        const e = event as unknown as ToolCallEndEvent;
        const toolCall = this.pendingClientToolCalls.get(e.toolCallId);
        if (toolCall) {
          // Join accumulated chunks into final arguments string
          const chunks = this.toolCallArgumentChunks.get(e.toolCallId) ?? [];
          toolCall.arguments = chunks.join("");
        }

        // Free memory for completed args once we have the final string
        this.toolCallArgumentChunks.delete(e.toolCallId);
        this.toolCallArgumentSizes.delete(e.toolCallId);
        break;
      }
      case EventType.TOOL_CALL_RESULT: {
        const e = event as unknown as ToolCallResultEvent;
        this.pendingClientToolCalls.delete(e.toolCallId);
        this.toolCallArgumentChunks.delete(e.toolCallId);
        this.toolCallArgumentSizes.delete(e.toolCallId);
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

    for (const [toolCallId, info] of this.pendingClientToolCalls) {
      pending.push({
        toolCallId,
        toolName: info.toolName,
        arguments: info.arguments,
      });
    }

    return pending;
  }

  /**
   * Check if there are any pending tool calls.
   */
  hasPendingToolCalls(): boolean {
    return this.pendingClientToolCalls.size > 0;
  }

  /**
   * Get the IDs of all pending tool calls.
   */
  getPendingToolCallIds(): string[] {
    return this.getPendingToolCalls().map((tc) => tc.toolCallId);
  }
}

export type AwaitingInputEvent = CustomEvent & {
  // NOTE: if `CustomEvent` gains additional required fields upstream, this type
  // and `createAwaitingInputEvent` should be updated accordingly.
  name: "tambo.run.awaiting_input";
  value: {
    pendingToolCalls: PendingToolCall[];
  };
};

/**
 * Create the tambo.run.awaiting_input event payload.
 */
export function createAwaitingInputEvent(
  pendingToolCalls: PendingToolCall[],
): AwaitingInputEvent {
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
  };
}
