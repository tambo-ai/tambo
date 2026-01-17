import * as Sentry from "@sentry/nestjs";
import {
  ContentPartType,
  GenerationStage,
  MessageRole,
  ThreadMessage,
  ToolCallRequest,
} from "@tambo-ai-cloud/core";
import { HydraDb, operations } from "@tambo-ai-cloud/db";
import { StreamQueueItem } from "../dto/stream-queue-item";
import { MessageRequest, ThreadMessageDto } from "../dto/message.dto";
import { updateMessage } from "./messages";

/**
 * The maximum number of identical tool calls we will make. This is to prevent
 * infinite loops.
 */
const MAX_IDENTICAL_TOOL_CALLS = 3;

/**
 * The maximum total number of tool calls we will make. This is to prevent
 * infinite loops.
 */
export const DEFAULT_MAX_TOTAL_TOOL_CALLS = 10;

/**
 * Creates a unique signature for a tool call request for tracking purposes.
 * Excludes the tool_call_id as it's not part of the actual tool call logic.
 */
function createToolCallSignature(toolCallRequest: ToolCallRequest): string {
  const sortedParams = toolCallRequest.parameters
    .map(({ parameterName, parameterValue }) => ({
      parameterName,
      parameterValue,
    }))
    .sort((a, b) => a.parameterName.localeCompare(b.parameterName));

  // TODO: deal with order of keys if data within the parameters themselves are objects
  return JSON.stringify({
    toolName: toolCallRequest.toolName,
    parameters: sortedParams,
  });
}

/**
 * Validates tool call limits to prevent infinite loops.
 * @param finalThreadMessage - The final thread message that will be added to the thread
 * @param messages - All messages in the thread (usually from the db)
 * @param currentToolCounts - Dictionary mapping tool call signatures to their counts, within the current request
 * @param newToolCallRequest - The new tool call request to validate
 * @param maxToolCallLimit - The maximum total number of tool calls allowed (from project settings)
 * @returns An error message if limits are exceeded, undefined if valid
 */
export function validateToolCallLimits(
  finalThreadMessage: ThreadMessage,
  messages: ThreadMessage[],
  currentToolCounts: Record<string, number>,
  newToolCallRequest: ToolCallRequest,
  maxToolCallLimit: number,
  // Optional per-tool counts (toolName -> count). If not provided, we will
  // use currentToolCounts directly (which is already in per-tool format).
  perToolCounts?: Record<string, number>,
  // Optional tool limits metadata mapping: toolName -> { maxCalls?: number }
  toolLimits?: Record<string, { maxCalls?: number }>,
): string | undefined {
  // Handle cases where tool calls are happening across requests - like we're
  // bouncing to the browser to make tool calls multiple times in a row
  if (isIdenticalToolLoop(finalThreadMessage, messages)) {
    return `I've detected that I'm making the same tool call repeatedly (${newToolCallRequest.toolName}). This suggests I'm stuck in a loop. Please try a different approach or contact support if this persists.`;
  }

  // Ensure we have per-tool totals. If not supplied, use currentToolCounts directly.
  const resolvedPerToolCounts: Record<string, number> = perToolCounts
    ? { ...perToolCounts }
    : { ...currentToolCounts };

  const toolName = newToolCallRequest.toolName;

  // If a per-tool override exists, honor it for this tool only. This means
  // the project-wide max is not applied to this tool when an override is set.
  const perToolLimit = toolLimits?.[toolName]?.maxCalls;
  if (perToolLimit != null) {
    const currentToolTotal = resolvedPerToolCounts[toolName] || 0;
    if (currentToolTotal >= perToolLimit) {
      return `I've reached the maximum number of calls for tool ${toolName} (${perToolLimit}). This usually indicates I'm stuck in a loop. Please try a different approach or contact support if this persists.`;
    }
    // Per-tool limit passed; still need to check identical-signature limit below.
  } else {
    // No per-tool override: fall back to project-wide total
    const totalCalls = Object.values(currentToolCounts).reduce(
      (sum, count) => sum + count,
      0,
    );

    if (totalCalls >= maxToolCallLimit) {
      return `I've reached the maximum number of tool calls (${maxToolCallLimit}). This usually indicates I'm stuck in a loop. Please try a different approach or contact support if this persists.`;
    }
  }

  // Signature-level identical-call protection (independent of per-tool/project limits)
  // Check if this EXACT call (tool + specific parameters) has been made too many times
  const signature = createToolCallSignature(newToolCallRequest);
  const currentSignatureCount = currentToolCounts[signature] || 0;

  if (currentSignatureCount >= MAX_IDENTICAL_TOOL_CALLS) {
    return `I've detected that I'm making the same tool call repeatedly (${newToolCallRequest.toolName}). This suggests I'm stuck in a loop. Please try a different approach or contact support if this persists.`;
  }

  return undefined;
}

/**
 * Updates the tool call counts with a new tool call request.
 * @param toolCallCounts - Current tool call counts
 * @param toolCallRequest - The tool call request to add
 * @returns Updated tool call counts
 */
export function updateToolCallCounts(
  toolCallCounts: Record<string, number>,
  toolCallRequest: ToolCallRequest,
): Record<string, number> {
  const signature = createToolCallSignature(toolCallRequest);
  return {
    ...toolCallCounts,
    [signature]: (toolCallCounts[signature] || 0) + 1,
  };
}

/**
 * Check if we are in an identical tool loop.
 * @param responseToCaller - The response message to the caller.
 * @param previousMessages - The messages in the thread.
 * @returns True if we are in an identical tool loop.
 */
function isIdenticalToolLoop(
  responseToCaller: ThreadMessage,
  previousMessages: ThreadMessage[],
): boolean {
  // Only check for loops if there's a tool call request
  if (!responseToCaller.toolCallRequest?.toolName) {
    return false;
  }
  let identicalToolCallCount = 0;

  const responseToCallerSignature = createToolCallSignature(
    responseToCaller.toolCallRequest,
  );
  // Loop backwards through messages
  for (let i = previousMessages.length - 2; i >= 0; i--) {
    const message = previousMessages[i];

    // If we hit a message without a tool call, we can stop checking
    if (!message.tool_call_id || !message.toolCallRequest) {
      return false;
    }
    const messageSignature = createToolCallSignature(message.toolCallRequest);

    if (
      message.role === "assistant" &&
      messageSignature === responseToCallerSignature
    ) {
      identicalToolCallCount++;
      if (identicalToolCallCount >= MAX_IDENTICAL_TOOL_CALLS - 1) {
        return true;
      }
    }
  }
  return false;
}
/**
 * Handles a tool call limit violation by creating an error message.
 * @param errorMessage - The error message to display
 * @param messageId - The message ID to update
 * @returns A message to return to the client in place of the tool call request message.
 */

async function handleToolCallLimitViolation(
  db: HydraDb,
  errorMessage: string,
  threadId: string,
  messageId: string,
): Promise<ThreadMessageDto> {
  const updatedMessage: MessageRequest = {
    role: MessageRole.Assistant,
    content: [
      {
        type: ContentPartType.Text,
        text: errorMessage,
      },
    ],
    componentState: {},
    // Remove any tool call request to break the loop
    toolCallRequest: undefined,
    tool_call_id: undefined,
    actionType: undefined,
  };
  // Perform both operations in a single transaction
  return await db.transaction(async (tx) => {
    // Update thread generation status
    await operations.updateThreadGenerationStatus(
      tx,
      threadId,
      GenerationStage.COMPLETE,
      "Tool call limit reached",
    );

    // Update the message and return the result
    return await updateMessage(tx, messageId, updatedMessage);
  });
}
/**
 * Validate a pending tool call against loop and limit protections.
 * Returns undefined when validation passes. If validation fails, it
 * updates the message/thread state and returns a ready response DTO
 * to be sent to the client.
 */
export async function checkToolCallLimitViolation(
  db: HydraDb,
  threadId: string,
  messageId: string,
  finalThreadMessage: ThreadMessage,
  messages: ThreadMessage[],
  currentToolCounts: Record<string, number>,
  newToolCallRequest: ToolCallRequest | undefined,
  maxToolCallLimit: number,
  mcpAccessToken: string | undefined,
  // Optional per-tool aggregated counts (toolName -> count). If provided
  // this avoids recalculating them from signature counts.
  perToolCounts?: Record<string, number>,
  // Optional tool limits metadata mapping: toolName -> { maxCalls?: number }
  toolLimits?: Record<string, { maxCalls?: number }>,
): Promise<StreamQueueItem | undefined> {
  if (!newToolCallRequest) {
    // not a tool call
    return;
  }
  Sentry.addBreadcrumb({
    message: `Processing tool call: ${newToolCallRequest.toolName}`,
    category: "tools",
    level: "info",
    data: { threadId, toolName: newToolCallRequest.toolName },
  });

  const errorMessage = validateToolCallLimits(
    finalThreadMessage,
    messages,
    currentToolCounts,
    newToolCallRequest,
    maxToolCallLimit,
    perToolCounts,
    toolLimits,
  );

  if (!errorMessage) {
    // tool call is fine
    return;
  }

  const errorThreadMessage = await handleToolCallLimitViolation(
    db,
    errorMessage,
    threadId,
    messageId,
  );
  Sentry.captureMessage("Tool call limit reached", "warning");

  return {
    response: {
      responseMessageDto: errorThreadMessage,
      generationStage: GenerationStage.COMPLETE,
      statusMessage: "Tool call limit reached",
      ...(mcpAccessToken && { mcpAccessToken }),
    },
    aguiEvents: [], // Error condition, no AG-UI events
  };
}
