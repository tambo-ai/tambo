import { Logger } from "@nestjs/common";
import {
  getToolsFromSources,
  ITamboBackend,
  ToolRegistry,
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
import { createResourceFetcherMap } from "../../common/systemTools";
import { ThreadMcpClient } from "../../mcp-server/elicitations";
import { AdvanceThreadDto } from "../dto/advance-thread.dto";
import { ComponentDecisionV2Dto } from "../dto/component-decision.dto";
import { MessageRequest } from "../dto/message.dto";
import { convertContentPartToDto } from "./content";
import {
  addAssistantMessageToThread,
  addMessage,
  updateMessage,
  verifyLatestMessageConsistency,
} from "./messages";
import { validateToolResponse } from "./tool";

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
 * @param allTools
 * @param mcpClients - MCP clients for resource fetching
 * @returns
 */
export async function processThreadMessage(
  db: HydraDatabase,
  threadId: string,
  messages: ThreadMessage[],
  userMessage: ThreadMessage,
  advanceRequestDto: AdvanceThreadDto,
  tamboBackend: ITamboBackend,
  allTools: ToolRegistry,
  mcpClients: ThreadMcpClient[],
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

    const toolResponse = validateToolResponse(userMessage);
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
    allTools,
    advanceRequestDto.availableComponents ?? [],
  );

  // Build resource fetchers from MCP clients
  const resourceFetchers = createResourceFetcherMap(mcpClients);

  const decisionStream = await tamboBackend.runDecisionLoop({
    messages,
    strictTools,
    forceToolChoice:
      latestMessage.role === MessageRole.User
        ? advanceRequestDto.forceToolChoice
        : undefined,
    resourceFetchers,
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
  newestMessageId: string,
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
          newestMessageId,
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
 * Type for LegacyComponentDecision with internal fields used during streaming.
 * These fields are used to preserve tool call information during streaming
 * before it's moved to the outer fields on the final chunk.
 */
export type LegacyComponentDecisionWithInternalFields =
  LegacyComponentDecision & {
    __toolCallRequest?: ToolCallRequest;
    __toolCallId?: string;
  };

/**
 * Processes a stream of component decisions to handle tool call information.
 *
 * For in-progress tool calls, the tool call info is kept in the component field.
 * For complete tool calls, the tool call info is moved to the outer toolCallRequest field.
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
  stream: AsyncIterableIterator<LegacyComponentDecision>,
): AsyncIterableIterator<LegacyComponentDecisionWithInternalFields> {
  let currentDecisionId: string | undefined = undefined;
  let currentDecision: LegacyComponentDecisionWithInternalFields | undefined =
    undefined;
  let previousToolCallRequest: ToolCallRequest | undefined = undefined;
  let previousToolCallId: string | undefined = undefined;

  for await (const chunk of stream) {
    if (currentDecision?.id && currentDecisionId !== chunk.id) {
      // we're on to a new message, so emit the previous one with complete tool call info
      yield {
        ...currentDecision,
        toolCallRequest: previousToolCallRequest,
        toolCallId: previousToolCallId,
      };
      // and clear the current state
      previousToolCallRequest = undefined;
      previousToolCallId = undefined;
    }

    // Track the tool call info from the incoming chunk
    currentDecisionId = chunk.id;
    const incomingToolCallId = chunk.toolCallId;
    const incomingToolCallRequest = chunk.toolCallRequest;

    // Store the tool call info for when we need to emit the final chunk
    // (either when ID changes or at end of stream)
    if (incomingToolCallRequest) {
      previousToolCallRequest = incomingToolCallRequest;
      previousToolCallId = incomingToolCallId;
    }

    // During streaming, strip tool call info from outer fields but preserve it for component
    // Store original values in hidden properties that updateThreadMessageFromLegacyDecision can access
    const streamingChunk: LegacyComponentDecisionWithInternalFields = {
      ...chunk,
      toolCallRequest: undefined, // Strip from outer fields during streaming
      toolCallId: undefined, // Strip from outer fields during streaming
      // Store original values for component field access
      __toolCallRequest: chunk.toolCallRequest,
      __toolCallId: chunk.toolCallId,
    };

    currentDecision = streamingChunk;
    yield streamingChunk;
  }

  // account for the last iteration - this is the final chunk
  // For the final chunk, if there's a tool call, put it on outer fields
  // (it will also be in component via updateThreadMessageFromLegacyDecision)
  if (currentDecision) {
    const finalChunk: LegacyComponentDecisionWithInternalFields = {
      ...currentDecision,
      // Put tool call on outer fields for complete tool calls
      // It will also be in component field via updateThreadMessageFromLegacyDecision
      toolCallRequest: previousToolCallRequest,
      toolCallId: previousToolCallId,
    };
    yield finalChunk;
  }
}

export function updateThreadMessageFromLegacyDecision(
  initialMessage: ThreadMessage,
  chunk: LegacyComponentDecisionWithInternalFields,
): ThreadMessage {
  // we explicitly remove certain fields from the component decision to avoid
  // duplication, because they appear in the thread message
  const { reasoning, ...simpleDecisionChunk } = chunk;

  // Get tool call info - check both outer fields and hidden properties (for streaming chunks)
  const toolCallRequest = chunk.toolCallRequest ?? chunk.__toolCallRequest;
  const toolCallId = chunk.toolCallId ?? chunk.__toolCallId;

  // Always include tool call info in component field if present
  const componentWithToolCall: LegacyComponentDecision = {
    ...simpleDecisionChunk,
    toolCallRequest,
    toolCallId,
  };

  const currentThreadMessage: ThreadMessage = {
    ...initialMessage,
    componentState: chunk.componentState ?? {},
    content: [
      {
        type: ContentPartType.Text,
        text: chunk.message,
      },
    ],
    component: componentWithToolCall,
    reasoning: reasoning,
    reasoningDurationMS: chunk.reasoningDurationMS,
  };

  // Only set outer tool call fields if tool call is present on outer fields of chunk
  // fixStreamedToolCalls ensures:
  // - During streaming: tool call info NOT on outer fields (stored in __toolCallRequest)
  // - On final chunk: tool call info ON outer fields (chunk.toolCallRequest exists)
  // So if chunk.toolCallRequest exists (not from hidden property), it's complete
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
