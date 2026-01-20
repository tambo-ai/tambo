import {
  ContentPartType,
  MessageRole,
  type UnsavedThreadToolMessage,
} from "@tambo-ai-cloud/core";
import type { V1InputContent, V1InputMessageDto } from "./dto/message.dto";
import type { V1ToolResultContentDto } from "./dto/content.dto";

/**
 * Extracted tool result from a V1 input message.
 */
export interface ExtractedToolResult {
  /** ID of the tool call this result responds to */
  toolUseId: string;
  /** Result content (text or resource blocks) */
  content: V1ToolResultContentDto["content"];
  /** Whether the tool call resulted in an error */
  isError: boolean;
}

/**
 * Result of tool result validation.
 */
export type ToolResultValidationResult =
  | { valid: true }
  | { valid: false; error: ToolResultValidationError };

/**
 * Tool result validation error details.
 */
export interface ToolResultValidationError {
  /** Error code for the validation failure */
  code: "MISSING_RESULTS" | "EXTRA_RESULTS";
  /** Human-readable error message */
  message: string;
  /** Tool call IDs that are missing results */
  missingToolCallIds?: string[];
  /** Tool call IDs that have results but weren't expected */
  extraToolCallIds?: string[];
}

/**
 * Type guard to check if a content block is a tool_result.
 */
function isToolResultContent(
  content: V1InputContent,
): content is V1ToolResultContentDto {
  return content.type === "tool_result";
}

/**
 * Extract tool_result content blocks from a V1 input message.
 *
 * @param message - The V1 input message to extract from
 * @returns Array of extracted tool results
 */
export function extractToolResults(
  message: V1InputMessageDto,
): ExtractedToolResult[] {
  return message.content.filter(isToolResultContent).map((block) => ({
    toolUseId: block.toolUseId,
    content: block.content,
    isError: block.isError ?? false,
  }));
}

export interface DedupeToolResultsResult {
  toolResults: ExtractedToolResult[];
  duplicateToolCallIds: string[];
}

export function dedupeToolResults(
  toolResults: ExtractedToolResult[],
): DedupeToolResultsResult {
  const toolResultsById = new Map<string, ExtractedToolResult>();
  const duplicateToolCallIds: string[] = [];
  const duplicateIdSet = new Set<string>();

  for (const result of toolResults) {
    if (
      toolResultsById.has(result.toolUseId) &&
      !duplicateIdSet.has(result.toolUseId)
    ) {
      duplicateToolCallIds.push(result.toolUseId);
      duplicateIdSet.add(result.toolUseId);
    }

    toolResultsById.set(result.toolUseId, result);
  }

  return {
    toolResults: [...toolResultsById.values()],
    duplicateToolCallIds,
  };
}

/**
 * Validate that tool results match the expected pending tool call IDs.
 *
 * Fail-fast validation:
 * - All pending tool call IDs must have a corresponding result
 * - No extra results for tool calls that weren't pending
 *
 * @param toolResults - Extracted tool results from the message
 * @param pendingToolCallIds - Expected tool call IDs that need results
 * @returns Validation result (success or error details)
 */
export function validateToolResults(
  toolResults: ExtractedToolResult[],
  pendingToolCallIds: string[],
): ToolResultValidationResult {
  const resultIds = new Set(toolResults.map((r) => r.toolUseId));
  const pendingIds = new Set(pendingToolCallIds);

  // Check for missing results (pending IDs without corresponding results)
  const missingToolCallIds = pendingToolCallIds.filter(
    (id) => !resultIds.has(id),
  );

  // Check for extra results (results for IDs that weren't pending)
  const extraToolCallIds = toolResults
    .map((r) => r.toolUseId)
    .filter((id) => !pendingIds.has(id));

  if (missingToolCallIds.length > 0) {
    return {
      valid: false,
      error: {
        code: "MISSING_RESULTS",
        message: `Missing tool results for pending tool calls: ${missingToolCallIds.join(", ")}`,
        missingToolCallIds,
      },
    };
  }

  if (extraToolCallIds.length > 0) {
    return {
      valid: false,
      error: {
        code: "EXTRA_RESULTS",
        message: `Tool results provided for unknown tool calls: ${extraToolCallIds.join(", ")}`,
        extraToolCallIds,
      },
    };
  }

  return { valid: true };
}

/**
 * Check if a thread has pending tool calls that need results.
 *
 * @param pendingToolCallIds - The thread's pending tool call IDs
 * @returns true if there are pending tool calls
 */
export function hasPendingToolCalls(
  pendingToolCallIds: string[] | null | undefined,
): pendingToolCallIds is string[] {
  return (
    pendingToolCallIds !== null &&
    pendingToolCallIds !== undefined &&
    pendingToolCallIds.length > 0
  );
}

/**
 * Convert extracted tool results to internal UnsavedThreadToolMessage format.
 *
 * Each tool result becomes a separate message with:
 * - role: MessageRole.Tool
 * - tool_call_id: the toolUseId from the tool result
 * - content: converted from tool result content
 *
 * @param toolResults - Extracted tool results
 * @returns Array of UnsavedThreadToolMessage for each tool result
 */
export function convertToolResultsToMessages(
  toolResults: ExtractedToolResult[],
): UnsavedThreadToolMessage[] {
  return toolResults.map((result) => ({
    role: MessageRole.Tool as const,
    tool_call_id: result.toolUseId,
    content: result.content.map((block) => {
      switch (block.type) {
        case "text":
          return {
            type: ContentPartType.Text,
            text: block.text,
          };
        case "resource":
          return {
            type: ContentPartType.Resource,
            resource: block.resource,
          };
        default:
          throw new Error(
            `Unknown content type in tool result: ${(block as { type: string }).type}`,
          );
      }
    }),
  }));
}
