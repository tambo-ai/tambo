import { Logger } from "@nestjs/common";
import type { DecisionStreamItem } from "@tambo-ai-cloud/backend";
import {
  ActionType,
  ContentPartType,
  GenerationStage,
  isUiToolName,
  LegacyComponentDecision,
  MessageRole,
  ThreadAssistantMessage,
  ThreadMessage,
  ThreadSystemMessage,
  ThreadToolMessage,
  ThreadUserMessage,
  ToolCallRequest,
} from "@tambo-ai-cloud/core";
import { HydraDb, operations, schema } from "@tambo-ai-cloud/db";
import { eq } from "drizzle-orm";
import { ComponentDecisionV2Dto } from "../dto/component-decision.dto";
import { MessageRequest } from "../dto/message.dto";
import { convertContentPartToDto } from "./content";
import {
  addMessage,
  updateMessage,
  verifyLatestMessageConsistency,
} from "./messages";

/**
 * Update the generation stage of a thread
 */
export async function updateGenerationStage(
  db: HydraDb,
  id: string,
  generationStage: GenerationStage,
  statusMessage?: string,
) {
  return await operations.updateThread(db, id, {
    generationStage,
    statusMessage,
  });
}

/**
 * Add a user message to a thread, making sure that the thread is not already in the middle of processing.
 */
export async function addUserMessage(
  db: HydraDb,
  threadId: string,
  message: MessageRequest,
  logger?: Logger,
) {
  try {
    const result = await db.transaction(
      async (tx) => {
        const currentThread = await tx.query.threads.findFirst({
          where: eq(schema.threads.id, threadId),
        });

        if (!currentThread) {
          throw new Error(`Thread ${threadId} not found`);
        }

        const generationStage = currentThread.generationStage;
        if (isThreadProcessing(generationStage)) {
          throw new Error(
            `Thread is already in processing (${currentThread.generationStage}), only one response can be generated at a time`,
          );
        }

        await updateGenerationStage(
          tx,
          threadId,
          GenerationStage.FETCHING_CONTEXT,
          "Starting processing...",
        );

        return await addMessage(tx, threadId, message);
      },
      {
        isolationLevel: "read committed",
      },
    );

    return result;
  } catch (error) {
    logger?.error(
      "Transaction failed: Adding user message",
      (error as Error).stack,
    );
    throw error;
  }
}

function isThreadProcessing(generationStage: GenerationStage) {
  return [
    GenerationStage.STREAMING_RESPONSE,
    GenerationStage.HYDRATING_COMPONENT,
    GenerationStage.CHOOSING_COMPONENT,
  ].includes(generationStage);
}

/**
 * Processes a stream of component decisions to handle tool call information.
 *
 * This function preserves tool call info (even if incomplete)in chunks during streaming and uses the
 * `isToolCallFinished` flag to indicate completion status. Sets to false until the final chunk, when it is set to true.
 *
 *
 * Messages will come in from the LLM or agent as a stream of component
 * decisions, as a flat stream or messages, even though there may be more than
 * one actual message, and each iteration of the message may contain an
 * incomplete tool call.
 *
 * For LLMs, this mostly just looks like a stream of messages that ultimately
 * results in a single final message.
 *
 * For agents, this may be a stream of multiple distinct messages, (like a user
 * message, then two assistant messages, then another user message, etc) and we
 * distinguish between them because the `id` of the LegacyComponentDecision will
 * change with each message.
 */
export async function* fixStreamedToolCalls(
  stream: AsyncIterableIterator<DecisionStreamItem>,
): AsyncIterableIterator<DecisionStreamItem> {
  let currentDecisionId: string | undefined = undefined;
  let currentToolCallRequest: ToolCallRequest | undefined = undefined;
  let currentToolCallId: string | undefined = undefined;
  let currentDecision: LegacyComponentDecision | undefined = undefined;

  for await (const streamItem of stream) {
    const chunk = streamItem.decision;

    if (currentDecision?.id && currentDecisionId !== chunk.id) {
      // we're on to a new chunk, so if we have a previous tool call request, emit it
      yield {
        decision: {
          ...currentDecision,
          toolCallRequest: currentToolCallRequest,
          toolCallId: currentToolCallId,
          isToolCallFinished: true,
        },
        aguiEvents: [], // No AG-UI events for this synthetic transition chunk
      };
      // and clear the current tool call request and id
      currentToolCallRequest = undefined;
      currentToolCallId = undefined;
    }

    // now emit the next chunk
    const { toolCallRequest, ...incompleteChunk } = chunk;
    currentDecision = incompleteChunk;
    currentDecisionId = chunk.id;
    currentToolCallId = chunk.toolCallId;
    currentToolCallRequest = toolCallRequest;
    yield {
      decision: { ...chunk, isToolCallFinished: false },
      aguiEvents: streamItem.aguiEvents,
    };
  }

  // account for the last iteration
  if (currentDecision) {
    yield {
      decision: {
        ...currentDecision,
        toolCallRequest: currentToolCallRequest,
        toolCallId: currentToolCallId,
        isToolCallFinished: true,
      },
      aguiEvents: [], // No AG-UI events for this synthetic final chunk
    };
  }
}

export function updateThreadMessageFromLegacyDecision(
  initialMessage: ThreadMessage,
  chunk: LegacyComponentDecision,
): ThreadMessage {
  // we explicitly remove certain fields from the component decision to avoid
  // duplication, because they appear in the thread message
  const { reasoning, isToolCallFinished, ...simpleDecisionChunk } = chunk;

  // For UI tools, strip tool call fields from the component field
  // so the client never sees them as tool calls
  let component = simpleDecisionChunk;
  if (chunk.toolCallRequest && isUiToolName(chunk.toolCallRequest.toolName)) {
    const {
      toolCallRequest: _toolCallRequest,
      toolCallId: _toolCallId,
      ...componentWithoutToolCall
    } = simpleDecisionChunk;
    component = componentWithoutToolCall;
  }

  const commonFields = {
    id: initialMessage.id,
    threadId: initialMessage.threadId,
    parentMessageId: initialMessage.parentMessageId,
    isCancelled: initialMessage.isCancelled,
    createdAt: initialMessage.createdAt,
    error: initialMessage.error,
    metadata: initialMessage.metadata,
    additionalContext: initialMessage.additionalContext,
    actionType: initialMessage.actionType,
    componentState: chunk.componentState ?? {},
    content: [
      {
        type: ContentPartType.Text as const,
        text: chunk.message,
      },
    ],
    component,
  };

  // Handle reasoning and tool calls based on role
  if (initialMessage.role === MessageRole.Assistant) {
    const currentThreadMessage: ThreadAssistantMessage = {
      ...commonFields,
      role: MessageRole.Assistant,
      reasoning: reasoning,
      reasoningDurationMS: chunk.reasoningDurationMS,
    };

    // Handle tool call fields differently for UI tools vs non-UI tools:
    // - UI tools: Set fields as soon as we have valid toolCallRequest and toolCallId
    //   (so they're tracked as tool calls during streaming)
    // - Non-UI tools: Only set fields when isToolCallFinished is true
    //   (so client SDK doesn't call them until complete)
    if (chunk.toolCallRequest && chunk.toolCallId) {
      const isUITool = isUiToolName(chunk.toolCallRequest.toolName);

      if (isUITool || isToolCallFinished) {
        currentThreadMessage.toolCallRequest = chunk.toolCallRequest;
        currentThreadMessage.tool_call_id = chunk.toolCallId;
        currentThreadMessage.actionType = ActionType.ToolCall;
      }
    }

    return currentThreadMessage;
  }

  // For non-assistant messages, reconstruct based on the role
  switch (initialMessage.role) {
    case MessageRole.User: {
      const msg: ThreadUserMessage = {
        ...commonFields,
        role: MessageRole.User,
      };
      return msg;
    }
    case MessageRole.System: {
      const msg: ThreadSystemMessage = {
        ...commonFields,
        role: MessageRole.System,
      };
      return msg;
    }
    case MessageRole.Tool: {
      const msg: ThreadToolMessage = {
        ...commonFields,
        role: MessageRole.Tool,
        tool_call_id: initialMessage.tool_call_id,
      };
      return msg;
    }
    default: {
      const _exhaustive: never = initialMessage;
      throw new Error(
        `Unexpected role: ${(_exhaustive as ThreadMessage).role}`,
      );
    }
  }
}

/**
 * Add a placeholder for an in-progress message to a thread, that will be updated later
 * with the final response.
 */
export async function appendNewMessageToThread(
  db: HydraDb,
  threadId: string,
  newestMessageId: string,
  role: MessageRole = MessageRole.Assistant,
  initialText: string = "",
  logger?: Logger,
) {
  try {
    const message = await db.transaction(
      async (tx) => {
        await verifyLatestMessageConsistency(
          tx,
          threadId,
          newestMessageId,
          false,
        );

        return await addMessage(tx, threadId, {
          role,
          content: [
            {
              type: ContentPartType.Text,
              text: initialText,
            },
          ],
        });
      },
      {
        isolationLevel: "read committed",
      },
    );

    return message;
  } catch (error) {
    logger?.error(
      "Transaction failed: Adding in-progress message",
      (error as Error).stack,
    );
    throw error;
  }
}

/**
 * Finish an in-progress message, updating the thread with the final response.
 */
export async function finishInProgressMessage(
  db: HydraDb,
  threadId: string,
  newestMessageId: string,
  inProgressMessageId: string,
  finalThreadMessage: ThreadMessage,
  logger?: Logger,
): Promise<{
  resultingGenerationStage: GenerationStage;
  resultingStatusMessage: string;
}> {
  try {
    const result = await db.transaction(
      async (tx) => {
        await verifyLatestMessageConsistency(
          tx,
          threadId,
          newestMessageId,
          true,
        );

        await updateMessage(tx, inProgressMessageId, {
          ...finalThreadMessage,
          component: finalThreadMessage.component as ComponentDecisionV2Dto,
          content: convertContentPartToDto(finalThreadMessage.content),
        });

        const resultingGenerationStage = finalThreadMessage.toolCallRequest
          ? GenerationStage.FETCHING_CONTEXT
          : GenerationStage.COMPLETE;
        const resultingStatusMessage = finalThreadMessage.toolCallRequest
          ? `Fetching context...`
          : `Complete`;

        await updateGenerationStage(
          tx,
          threadId,
          resultingGenerationStage,
          resultingStatusMessage,
        );

        return {
          resultingGenerationStage,
          resultingStatusMessage,
        };
      },
      {
        isolationLevel: "read committed",
      },
    );

    return result;
  } catch (error) {
    logger?.error(
      "Transaction failed: Finishing in-progress message",
      (error as Error).stack,
    );
    throw error;
  }
}
