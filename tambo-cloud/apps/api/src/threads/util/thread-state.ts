import { Logger } from "@nestjs/common";
import {
  getToolsFromSources,
  SystemTools,
  TamboBackend,
} from "@tambo-ai-cloud/backend";
import {
  ActionType,
  ContentPartType,
  GenerationStage,
  getToolName,
  LegacyComponentDecision,
  MessageRole,
  ThreadMessage,
  ToolCallRequest,
  unstrictifyToolCallRequest,
} from "@tambo-ai-cloud/core";
import { HydraDatabase, HydraDb, operations, schema } from "@tambo-ai-cloud/db";
import { eq } from "drizzle-orm";
import OpenAI from "openai";
import { AdvanceThreadDto } from "../dto/advance-thread.dto";
import { MessageRequest } from "../dto/message.dto";
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
  originalTools: OpenAI.Chat.Completions.ChatCompletionTool[],
): Promise<LegacyComponentDecision> {
  let finalDecision: LegacyComponentDecision | undefined;

  for await (const chunk of stream) {
    finalDecision = chunk;
  }

  if (!finalDecision) {
    throw new Error("No decision was received from the stream");
  }

  const strictToolCallRequest = finalDecision.toolCallRequest;
  if (strictToolCallRequest) {
    const originalTool = originalTools.find(
      (tool) => getToolName(tool) === strictToolCallRequest.toolName,
    );
    if (!originalTool) {
      throw new Error("Original tool not found");
    }
    const finalToolCallRequest = unstrictifyToolCallRequest(
      originalTool,
      strictToolCallRequest,
    );
    finalDecision = {
      ...finalDecision,
      toolCallRequest: finalToolCallRequest,
    };
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
  userMessage: ThreadMessage,
  advanceRequestDto: AdvanceThreadDto,
  tamboBackend: TamboBackend,
  systemTools: SystemTools,
  customInstructions: string | undefined,
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

    const toolResponse = extractToolResponse(userMessage);
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
  const { strictTools, originalTools } = getToolsFromSources(
    advanceRequestDto.availableComponents ?? [],
    advanceRequestDto.clientTools ?? [],
    systemTools,
  );

  const decisionStream = await tamboBackend.runDecisionLoop({
    messages,
    strictTools,
    customInstructions,
    forceToolChoice:
      latestMessage.role === MessageRole.User
        ? advanceRequestDto.forceToolChoice
        : undefined,
  });

  return await getFinalDecision(decisionStream, originalTools);
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
        await verifyLatestMessageConsistency(
          tx,
          threadId,
          addedUserMessage.id,
          false,
        );

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
        isolationLevel: "read committed",
      },
    );

    return result;
  } catch (error) {
    logger?.error(
      "Transaction failed: Adding assistant response.",
      (error as Error).stack,
    );
    throw error;
  }
}

/**
 * The purpose if this function is to make sure that we do not stream
 * intermediate tool calls and instead withhold the toolCallRequest and
 * toolCallId until the final message.
 *
 * Messages will come in from the LLM or agent as a stream of component
 * decisions, as a flat stream or messages, even though there may be more than
 * one actual message, and each iteration of the message may contain an
 * incomplete tool call.
 *
 * For LLMs, this mostly just looks like a stream of messages that ultimately
 * results in a single final message, so just the last message in the resulting
 * stream has a tool call in it.
 *
 * For agents, this may be a stream of multiple distinct messages, (like a user
 * message, then two asisstant messages, then another user message, etc) and we
 * distinguish between them because the `id` of the LegacyComponentDecision will
 * change with each message.
 */
export async function* fixStreamedToolCalls(
  stream: AsyncIterableIterator<LegacyComponentDecision>,
): AsyncIterableIterator<LegacyComponentDecision> {
  let currentDecisionId: string | undefined = undefined;

  let currentToolCallRequest: ToolCallRequest | undefined = undefined;
  let currentToolCallId: string | undefined = undefined;
  let currentDecision: LegacyComponentDecision | undefined = undefined;

  for await (const chunk of stream) {
    if (currentDecision?.id && currentDecisionId !== chunk.id) {
      // we're on to a new chunk, so if we have a previous tool call request, emit it
      if (currentToolCallRequest) {
        yield {
          ...currentDecision,
          toolCallRequest: currentToolCallRequest,
          toolCallId: currentToolCallId,
        };
      }
    }
    const { toolCallId, toolCallRequest, ...incompleteChunk } = chunk;
    currentDecision = incompleteChunk;
    currentDecisionId = chunk.id;
    currentToolCallId = toolCallId;
    currentToolCallRequest = toolCallRequest;
    yield incompleteChunk;
  }

  // account for the last iteration
  if (currentDecision && currentToolCallRequest) {
    yield {
      ...currentDecision,
      toolCallRequest: currentToolCallRequest,
      toolCallId: currentToolCallId,
    };
  }
}

export function updateThreadMessageFromLegacyDecision(
  initialMessage: ThreadMessage,
  chunk: LegacyComponentDecision,
): ThreadMessage {
  const currentThreadMessage: ThreadMessage = {
    ...initialMessage,
    componentState: chunk.componentState ?? {},
    content: [
      {
        type: ContentPartType.Text,
        text: chunk.message,
      },
    ],
    component: chunk,
    // If the chunk includes a tool call, propagate it onto the thread message.
    // Intermediate chunks from fixStreamedToolCalls will not include tool calls; only
    // final/synthesized chunks carry tool call metadata.
  };
  if (chunk.toolCallRequest) {
    currentThreadMessage.toolCallRequest = chunk.toolCallRequest;
    currentThreadMessage.tool_call_id = chunk.toolCallId;
    currentThreadMessage.actionType = ActionType.ToolCall;
  }
  return currentThreadMessage;
}

/**
 * Add a placeholder for an in-progress message to a thread, that will be updated later
 * with the final response.
 */
export async function addInitialMessage(
  db: HydraDb,
  threadId: string,
  addedUserMessage: ThreadMessage,
  logger: Logger,
) {
  try {
    const message = await db.transaction(
      async (tx) => {
        await verifyLatestMessageConsistency(
          tx,
          threadId,
          addedUserMessage.id,
          false,
        );

        return await addMessage(tx, threadId, {
          role: MessageRole.Assistant,
          content: [
            {
              type: ContentPartType.Text,
              text: "",
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
          addedUserMessage.id,
          true,
        );

        await updateMessage(tx, inProgressMessageId, {
          ...finalThreadMessage,
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
