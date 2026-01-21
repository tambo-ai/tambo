import type { BaseEvent } from "@ag-ui/core";
import type { AdvanceThreadResponseDto } from "./advance-thread.dto";

/**
 * Compound type for items in the streaming queue.
 *
 * Contains both the traditional AdvanceThreadResponseDto (for backwards
 * compatibility with existing code) and optional AG-UI events (for V1 API).
 *
 * Producers populate aguiEvents from the AI SDK delta events.
 * Consumers can:
 * - Use `response` for existing advanceThread behavior
 * - Use `aguiEvents` for V1 API streaming
 */
export interface StreamQueueItem {
  /**
   * The traditional response object containing the thread message DTO,
   * generation stage, and status information.
   */
  response: AdvanceThreadResponseDto;

  /**
   * AG-UI events generated from the current streaming delta.
   * May contain 0-N events depending on the delta type.
   *
   * Events use types from @ag-ui/core:
   * - TextMessageStartEvent, TextMessageContentEvent, TextMessageEndEvent
   * - ToolCallStartEvent, ToolCallArgsEvent, ToolCallEndEvent
   * - ThinkingTextMessageStartEvent, etc.
   */
  aguiEvents?: BaseEvent[];
}
