import { Logger } from "@nestjs/common";
import { SystemTools, TamboBackend } from "@tambo-ai-cloud/backend";
import {
  ActionType,
  ChatCompletionContentPart,
  ComponentDecisionV2,
  ContentPartType,
  GenerationStage,
  LegacyComponentDecision,
  MessageRole,
  ThreadMessage,
} from "@tambo-ai-cloud/core";
import type {
  HydraDatabase,
  HydraDb,
  HydraTransaction,
} from "@tambo-ai-cloud/db";
import { operations, schema } from "@tambo-ai-cloud/db";
import { eq } from "drizzle-orm";
import { AvailableComponentDto } from "src/components/dto/generate-component.dto";
import { AdvanceThreadDto } from "./dto/advance-thread.dto";
import {
  ChatCompletionContentPartDto,
  MessageRequest,
  ThreadMessageDto,
} from "./dto/message.dto";

export async function finishInProgressMessage(
  db: HydraDb,
  threadId: string,
  addedUserMessage: ThreadMessage,
  inProgressMessage: ThreadMessage,
  finalResponse: {
    responseMessageDto: ThreadMessageDto;
    generationStage: GenerationStage;
    statusMessage: string;
  },
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
          inProgressMessage.id,
        );

        await updateMessage(
          tx,
          inProgressMessage.id,
          finalResponse.responseMessageDto,
        );

        const resultingGenerationStage = finalResponse.responseMessageDto
          .toolCallRequest
          ? GenerationStage.FETCHING_CONTEXT
          : GenerationStage.COMPLETE;
        const resultingStatusMessage = finalResponse.responseMessageDto
          .toolCallRequest
          ? `Fetching context...`
          : `Complete`;

        await updateGenerationStage(
          tx,
          threadId,
          resultingGenerationStage,
          resultingStatusMessage,
        );
        return { resultingGenerationStage, resultingStatusMessage };
      },
      {
        isolationLevel: "read committed",
      },
    );
    return result;
  } catch (error) {
    logger?.error(
      "Transaction failed: Finalizing streamed message",
      (error as Error).stack,
    );
    throw error;
  }
}
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
          actionType: undefined,
          toolCallRequest: undefined,
          tool_call_id: toolCallId,
          metadata: {},
        });
      },
      {
        isolationLevel: "repeatable read",
      },
    );
    return message;
  } catch (error) {
    logger?.error(
      "Transaction failed: Creating in-progress message",
      (error as Error).stack,
    );
    throw error;
  }
}

async function verifyLatestMessageConsistency(
  db: HydraTransaction,
  threadId: string,
  addedUserMessage: ThreadMessage,
  inProgressMessageId?: string | undefined,
) {
  const latestMessages = await db.query.messages.findMany({
    where: eq(schema.messages.threadId, threadId),
    orderBy: (messages, { desc }) => [desc(messages.createdAt)],
  });

  // If we have an in-progress message (streaming), we need to check the message before it
  // Otherwise, we check the latest message
  const messageToCheck = inProgressMessageId
    ? latestMessages[1] // Check message before our in-progress message
    : latestMessages[0]; // Check latest message directly

  if (
    !(
      messageToCheck.id === addedUserMessage.id &&
      messageToCheck.createdAt.toISOString() ===
        addedUserMessage.createdAt.toISOString()
    )
  ) {
    throw new Error(
      "Latest message before write is not the same as the added user message",
    );
  }
}

async function addResponseToThread(
  db: HydraDb,
  component: LegacyComponentDecision,
  threadId: string,
) {
  const serializedMessage: ComponentDecisionV2 = {
    message: component.message,
    componentName: component.componentName,
    props: component.props,
    componentState: component.componentState,
    reasoning: component.reasoning,
  };
  return await addMessage(db, threadId, {
    role: MessageRole.Assistant,
    content: [
      {
        type: ContentPartType.Text,
        text: component.message,
      },
    ],
    component: serializedMessage,
    actionType: component.toolCallRequest ? ActionType.ToolCall : undefined,
    toolCallRequest: component.toolCallRequest,
    tool_call_id: component.toolCallRequest?.tool_call_id,
    componentState: component.componentState ?? {},
  });
}
export async function updateGenerationStage(
  db: HydraDb,
  id: string,
  generationStage: GenerationStage,
  statusMessage: string | undefined,
) {
  return await operations.updateThread(db, id, {
    generationStage,
    statusMessage,
  });
}
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

        const responseMessageDto = await addResponseToThread(
          tx,
          responseMessage,
          threadId,
        );

        const resultingGenerationStage = responseMessage.toolCallRequest
          ? GenerationStage.FETCHING_CONTEXT
          : GenerationStage.COMPLETE;
        const resultingStatusMessage = responseMessage.toolCallRequest
          ? `Fetching context...`
          : `Generation complete`;

        await updateGenerationStage(
          tx ?? db,
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
        isolationLevel: "repeatable read",
      },
    );

    return result;
  } catch (error) {
    logger?.error(
      "Transaction failed: Adding response to thread",
      (error as Error).stack,
    );
    throw error;
  }
}
export async function addUserMessage(
  db: HydraDb,
  threadId: string,
  advanceRequestDto: AdvanceThreadDto,
  logger?: Logger,
) {
  try {
    const result = await db.transaction(
      async (tx) => {
        const [currentThread] = await tx
          .select()
          .from(schema.threads)
          .where(eq(schema.threads.id, threadId))
          .for("update");

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

        await operations.updateThread(tx, threadId, {
          generationStage: GenerationStage.CHOOSING_COMPONENT,
          statusMessage: "Starting processing...",
        });

        return await addMessage(
          tx,
          threadId,
          advanceRequestDto.messageToAppend,
        );
      },
      {
        isolationLevel: "repeatable read",
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
export async function updateMessage(
  db: HydraDb,
  messageId: string,
  messageDto: MessageRequest,
): Promise<ThreadMessageDto> {
  const message = await operations.updateMessage(db, messageId, {
    content: convertContentDtoToContentPart(messageDto.content),
    componentDecision: messageDto.component ?? undefined,
    metadata: messageDto.metadata,
    actionType: messageDto.actionType ?? undefined,
    toolCallRequest: messageDto.toolCallRequest,
    toolCallId: messageDto.tool_call_id ?? undefined,
  });
  return {
    ...message,
    content: convertContentPartToDto(message.content),
    metadata: message.metadata ?? undefined,
    toolCallRequest: message.toolCallRequest ?? undefined,
    tool_call_id: message.toolCallId ?? undefined,
    actionType: message.actionType ?? undefined,
    componentState: message.componentState ?? {},
  };
}
export async function addMessage(
  db: HydraDb,
  threadId: string,
  messageDto: MessageRequest,
): Promise<ThreadMessage> {
  const message = await operations.addMessage(db, {
    threadId,
    role: messageDto.role,
    content: convertContentDtoToContentPart(messageDto.content),
    componentDecision: messageDto.component ?? undefined,
    metadata: messageDto.metadata,
    actionType: messageDto.actionType ?? undefined,
    toolCallRequest: messageDto.toolCallRequest ?? undefined,
    toolCallId: messageDto?.tool_call_id,
    componentState: messageDto.componentState ?? {},
  });
  return {
    id: message.id,
    threadId: message.threadId,
    role: message.role,
    metadata: message.metadata ?? undefined,
    actionType: message.actionType ?? undefined,
    toolCallRequest: message.toolCallRequest ?? undefined,
    componentState: message.componentState ?? {},
    createdAt: message.createdAt,

    component: message.componentDecision ?? undefined,

    content: message.content,

    tool_call_id: message.toolCallId ?? undefined,
  };
}
function convertContentDtoToContentPart(
  content: string | ChatCompletionContentPartDto[],
): ChatCompletionContentPart[] {
  if (!Array.isArray(content)) {
    return [{ type: ContentPartType.Text, text: content }];
  }
  return content
    .map((part): ChatCompletionContentPart | null => {
      switch (part.type) {
        case ContentPartType.Text:
          if (!part.text) {
            throw new Error("Text content is required for text type");
          }
          return {
            type: ContentPartType.Text,
            text: part.text,
          };
        case ContentPartType.ImageUrl:
          return {
            type: ContentPartType.ImageUrl,
            image_url: part.image_url ?? {
              url: "",
              detail: "auto",
            },
          };
        case ContentPartType.InputAudio:
          return {
            type: ContentPartType.InputAudio,
            input_audio: part.input_audio ?? {
              data: "",
              format: "wav",
            },
          };
        case "resource" as ContentPartType:
          // TODO: we get back "resource" from MCP servers, but it is not supported yet
          console.warn(
            "Ignoring 'resource' content part: it is not supported yet",
            part,
          );
          return null;
        default:
          throw new Error(`Unknown content part type: ${part.type}`);
      }
    })
    .filter((part): part is ChatCompletionContentPart => !!part);
}
export function threadMessageDtoToThreadMessage(
  messages: ThreadMessageDto[],
): ThreadMessage[] {
  return messages.map(
    (message): ThreadMessage => ({
      ...message,
      content: convertContentDtoToContentPart(message.content),
    }),
  );
}
export function convertContentPartToDto(
  part: ChatCompletionContentPart[] | string,
): ChatCompletionContentPartDto[] {
  if (typeof part === "string") {
    return [{ type: ContentPartType.Text, text: part }];
  }
  return part as ChatCompletionContentPartDto[];
}
export function extractToolResponse(message: MessageRequest): any {
  // need to prioritize toolResponse over content, because that is where the API started.
  if (message.toolResponse) {
    return message.toolResponse;
  }
  // TODO: we get back "resource" from MCP servers, but it is not supported yet
  const nonResourceContent = message.content.filter(
    (part) => (part.type as string) !== "resource",
  );
  if (nonResourceContent.every((part) => part.type === ContentPartType.Text)) {
    const contentString = nonResourceContent.map((part) => part.text).join("");
    const jsonResponse = tryParseJson(contentString);
    if (jsonResponse) {
      return jsonResponse;
    }
    return contentString;
  }
  return null;
}
function tryParseJson(text: string): any {
  // we are assuming that JSON is only ever an object or an array,
  // so we don't need to check for other types of JSON structures
  if (!text.startsWith("{") && !text.startsWith("[")) {
    return text;
  }
  try {
    return JSON.parse(text);
  } catch (_error) {
    return text;
  }
}

/** Processes the "next" thread message, hydrating the component if necessary */
export async function processThreadMessage(
  db: HydraDatabase,
  threadId: string,
  messages: ThreadMessage[],
  advanceRequestDto: AdvanceThreadDto,
  tamboBackend: TamboBackend,
  systemTools: SystemTools,
  availableComponentMap: Record<string, AvailableComponentDto>,
): Promise<LegacyComponentDecision> {
  const latestMessage = messages[messages.length - 1];
  // For tool responses, we can fully hydrate the component and return it
  if (latestMessage.role === MessageRole.Tool) {
    await updateGenerationStage(
      db,
      threadId,
      GenerationStage.HYDRATING_COMPONENT,
      `Hydrating ${latestMessage.component?.componentName}...`,
    );
    // Since we don't a store tool responses in the db, assumes that the tool response is the messageToAppend
    const toolResponse = extractToolResponse(advanceRequestDto.messageToAppend);

    if (!toolResponse) {
      throw new Error("No tool response found");
    }

    const componentDef = advanceRequestDto.availableComponents?.find(
      (c) => c.name === latestMessage.component?.componentName,
    );
    if (!componentDef) {
      throw new Error("Component definition not found");
    }

    return await tamboBackend.hydrateComponentWithData(
      messages,
      componentDef,
      toolResponse,
      latestMessage.tool_call_id,
      threadId,
      systemTools,
    );
  }

  // For non-tool responses, we need to generate a component
  await updateGenerationStage(
    db,
    threadId,
    GenerationStage.CHOOSING_COMPONENT,
    `Choosing component...`,
  );

  return await tamboBackend.generateComponent(
    messages,
    availableComponentMap,
    threadId,
    systemTools,
    false,
    advanceRequestDto.additionalContext,
  );
}
