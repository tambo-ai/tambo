import { Logger } from "@nestjs/common";
import { SystemTools, TamboBackend } from "@tambo-ai-cloud/backend";
import {
  ActionType,
  ContentPartType,
  GenerationStage,
  LegacyComponentDecision,
  MessageRole,
  ThreadMessage,
  ToolCallRequest,
} from "@tambo-ai-cloud/core";
import { HydraDatabase, HydraDb, operations, schema } from "@tambo-ai-cloud/db";
import { eq } from "drizzle-orm";
import { AdvanceThreadDto } from "../dto/advance-thread.dto";
import { ThreadMessageDto } from "../dto/message.dto";
import { convertContentPartToDto } from "./content";
import {
  addAssistantMessageToThread,
  addMessage,
  updateMessage,
  verifyLatestMessageConsistency,
} from "./messages";
import { extractToolResponse } from "./tool";

/**
 * Get the final decision from a stream of component decisions
 * by waiting for the last chunk in the stream.
 */
async function getFinalDecision(
  stream: AsyncIterableIterator<LegacyComponentDecision>,
): Promise<LegacyComponentDecision> {
  let finalDecision: LegacyComponentDecision | undefined;

  for await (const chunk of stream) {
    finalDecision = chunk;
  }

  if (!finalDecision) {
    throw new Error("No decision was received from the stream");
  }

  return finalDecision;
}

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
 * Process the newest message in a thread.
 *
 * If it is a tool message (response to a tool call) then we hydrate the component.
 * Otherwise, we choose a component to generate.
 *
 * @param db
 * @param threadId
 * @param messages
 * @param advanceRequestDto
 * @param tamboBackend
 * @param systemTools
 * @param availableComponentMap
 * @returns
 */
export async function processThreadMessage(
  db: HydraDatabase,
  threadId: string,
  messages: ThreadMessage[],
  advanceRequestDto: AdvanceThreadDto,
  tamboBackend: TamboBackend,
  systemTools: SystemTools,
): Promise<LegacyComponentDecision> {
  const latestMessage = messages[messages.length - 1];
  // For tool responses, we can fully hydrate the component
  if (latestMessage.role === MessageRole.Tool) {
    await updateGenerationStage(
      db,
      threadId,
      GenerationStage.HYDRATING_COMPONENT,
      `Hydrating ${latestMessage.component?.componentName}...`,
    );

    const toolResponse = extractToolResponse(advanceRequestDto.messageToAppend);
    if (!toolResponse) {
      throw new Error("No tool response found");
    }
  } else {
    // For non-tool responses, we need to generate a component
    await updateGenerationStage(
      db,
      threadId,
      GenerationStage.CHOOSING_COMPONENT,
      `Choosing component...`,
    );
  }
  const decisionStream = await tamboBackend.runDecisionLoop({
    messageHistory: messages,
    availableComponents: advanceRequestDto.availableComponents ?? [],
    clientTools: advanceRequestDto.clientTools ?? [],
    systemTools,
    additionalContext: advanceRequestDto.additionalContext,
  });

  return await getFinalDecision(decisionStream);
}

/**
 * Add a user message to a thread, making sure that the thread is not already in the middle of processing.
 */
export async function addUserMessage(
  db: HydraDb,
  threadId: string,
  advanceRequestDto: AdvanceThreadDto,
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

        if (
          currentThread.generationStage ===
            GenerationStage.STREAMING_RESPONSE ||
          currentThread.generationStage ===
            GenerationStage.HYDRATING_COMPONENT ||
          currentThread.generationStage === GenerationStage.CHOOSING_COMPONENT
        ) {
          throw new Error(
            `Thread is already in processing (${currentThread.generationStage}), only one response can be generated at a time`,
          );
        }

        await updateGenerationStage(
          tx,
          threadId,
          GenerationStage.CHOOSING_COMPONENT,
          "Starting processing...",
        );

        return await addMessage(
          tx,
          threadId,
          advanceRequestDto.messageToAppend,
        );
      },
      {
        isolationLevel: "serializable",
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

/**
 * Add an assistant response to a thread, making sure that the thread is not already in the middle of processing.
 */
export async function addAssistantResponse(
  db: HydraDatabase,
  threadId: string,
  addedUserMessage: ThreadMessage,
  responseMessage: LegacyComponentDecision,
  logger?: Logger,
): Promise<{
  responseMessageDto: ThreadMessage;
  resultingGenerationStage: GenerationStage;
  resultingStatusMessage: string;
}> {
  try {
    const result = await db.transaction(
      async (tx) => {
        await verifyLatestMessageConsistency(tx, threadId, addedUserMessage);

        const responseMessageDto = await addAssistantMessageToThread(
          tx,
          responseMessage,
          threadId,
        );

        const resultingGenerationStage = responseMessage.toolCallRequest
          ? GenerationStage.FETCHING_CONTEXT
          : GenerationStage.COMPLETE;
        const resultingStatusMessage = responseMessage.toolCallRequest
          ? `Fetching context...`
          : `Complete`;

        await updateGenerationStage(
          tx,
          threadId,
          resultingGenerationStage,
          resultingStatusMessage,
        );

        return {
          responseMessageDto,
          resultingGenerationStage,
          resultingStatusMessage,
        };
      },
      {
        isolationLevel: "serializable",
      },
    );

    return result;
  } catch (error) {
    logger?.error(
      "Transaction failed: Adding assistant response",
      (error as Error).stack,
    );
    throw error;
  }
}

/**
 * Convert a stream of component decisions to a stream of serialized thread messages
 */
export async function* convertDecisionStreamToMessageStream(
  stream: AsyncIterableIterator<LegacyComponentDecision>,
  inProgressMessage: ThreadMessage,
): AsyncIterableIterator<ThreadMessageDto> {
  let finalThreadMessage: ThreadMessageDto = {
    // Only bring in the bare minimum fields from the inProgressMessage
    componentState: inProgressMessage.componentState,
    content: convertContentPartToDto(inProgressMessage.content),
    createdAt: inProgressMessage.createdAt,
    id: inProgressMessage.id,
    role: inProgressMessage.role,
    threadId: inProgressMessage.threadId,
  };
  let finalToolCallRequest: ToolCallRequest | undefined;
  // let finalToolCallId: string | undefined;

  for await (const chunk of stream) {
    finalThreadMessage = {
      ...inProgressMessage,
      content: [
        {
          type: ContentPartType.Text,
          text: chunk.message,
        },
      ],
      component: chunk,
      actionType: chunk.toolCallRequest ? ActionType.ToolCall : undefined,
      // do NOT set the toolCallRequest or tool_call_id here, we will set them in the final response
    };
    if (chunk.toolCallRequest) {
      finalToolCallRequest = chunk.toolCallRequest;
      // toolCallId is set when streaming the response to a tool response
      // chunk.toolCallId is set when streaming the response to a component
      // finalToolCallId = toolCallId ?? chunk.toolCallId;
    }

    yield finalThreadMessage;
  }

  // now that we're done streaming, add the tool call request and tool call id to the response
  finalThreadMessage = {
    ...finalThreadMessage,
    toolCallRequest: finalToolCallRequest,
    // tool_call_id: finalToolCallId,
  };

  yield finalThreadMessage;
}

/**
 * Add a placeholder for an in-progress message to a thread, that will be updated later
 * with the final response.
 */
export async function addInProgressMessage(
  db: HydraDb,
  threadId: string,
  addedUserMessage: ThreadMessage,
  toolCallId: string | undefined,
  logger: Logger,
) {
  try {
    const message = await db.transaction(
      async (tx) => {
        await verifyLatestMessageConsistency(tx, threadId, addedUserMessage);

        return await addMessage(tx, threadId, {
          role: MessageRole.Assistant,
          content: [
            {
              type: ContentPartType.Text,
              text: "streaming in progress...",
            },
          ],
          tool_call_id: toolCallId,
        });
      },
      {
        isolationLevel: "serializable",
      },
    );

    return message;
  } catch (error) {
    logger.error(
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
  addedUserMessage: ThreadMessage,
  inProgressMessageId: string,
  finalThreadMessage: ThreadMessageDto,
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
          addedUserMessage,
          inProgressMessageId,
        );

        await updateMessage(tx, inProgressMessageId, finalThreadMessage);

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
        isolationLevel: "serializable",
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
