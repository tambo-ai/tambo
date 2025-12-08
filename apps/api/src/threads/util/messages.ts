import {
  ActionType,
  ComponentDecisionV2,
  ContentPartType,
  LegacyComponentDecision,
  MessageRole,
  ThreadMessage,
  UnsavedThreadMessage,
  validateThreadMessage,
} from "@tambo-ai-cloud/core";
import {
  dbMessageToThreadMessage,
  HydraDb,
  HydraTransaction,
  operations,
  schema,
} from "@tambo-ai-cloud/db";
import { and, eq, isNull } from "drizzle-orm";
import { MessageRequest, ThreadMessageDto } from "../dto/message.dto";
import {
  convertContentDtoToContentPart,
  convertContentPartToDto,
} from "./content";

/**
 * Add a message to a thread
 */
export async function addMessage(
  db: HydraDb,
  threadId: string,
  messageDto: MessageRequest,
): Promise<ThreadMessage> {
  // Build the base message properties
  const baseMessage = {
    content: convertContentDtoToContentPart(messageDto.content),
    component: messageDto.component ?? undefined,
    metadata: messageDto.metadata,
    actionType: messageDto.actionType ?? undefined,
    componentState: messageDto.componentState ?? {},
    error: messageDto.error,
    isCancelled: messageDto.isCancelled ?? false,
    additionalContext: messageDto.additionalContext ?? {},
  };

  // Construct the message based on role to satisfy discriminated union types
  let unsavedMessage: UnsavedThreadMessage;
  if (messageDto.role === MessageRole.Tool) {
    // Tool messages REQUIRE tool_call_id
    if (!messageDto.tool_call_id) {
      throw new Error("Tool messages must have a tool_call_id");
    }
    unsavedMessage = {
      ...baseMessage,
      role: MessageRole.Tool,
      tool_call_id: messageDto.tool_call_id,
    };
  } else if (messageDto.role === MessageRole.Assistant) {
    // Assistant messages can optionally have tool_call_id, toolCallRequest, reasoning
    unsavedMessage = {
      ...baseMessage,
      role: MessageRole.Assistant,
      tool_call_id: messageDto.tool_call_id,
      toolCallRequest: messageDto.toolCallRequest ?? undefined,
      reasoning: messageDto.reasoning ?? undefined,
      reasoningDurationMS: messageDto.reasoningDurationMS ?? undefined,
    };
  } else if (messageDto.role === MessageRole.System) {
    // System messages don't have tool-related fields
    unsavedMessage = {
      ...baseMessage,
      role: MessageRole.System,
    };
  } else {
    // User messages don't have tool-related fields
    unsavedMessage = {
      ...baseMessage,
      role: MessageRole.User,
    };
  }

  const message = await operations.addMessage(db, threadId, unsavedMessage);

  if (messageDto.role === MessageRole.Tool && messageDto.error) {
    //Update the previous request message with the error
    //Find message with matching toolCallId and action is tool call
    await propagateErrorToPreviousToolCall(
      db,
      threadId,
      messageDto.tool_call_id,
      messageDto.error,
    );
  }

  return dbMessageToThreadMessage(message);
}

/**
 * Update a message in a thread
 */
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
    error: messageDto.error,
    isCancelled: messageDto.isCancelled,
    additionalContext: messageDto.additionalContext ?? {},
    reasoning: messageDto.reasoning ?? undefined,
    reasoningDurationMS: messageDto.reasoningDurationMS ?? undefined,
  });

  if (messageDto.role === MessageRole.Tool && messageDto.error) {
    //Update the previous request message with the error
    //Find message with matching toolCallId and action is tool call
    await propagateErrorToPreviousToolCall(
      db,
      message.threadId,
      messageDto.tool_call_id,
      messageDto.error,
    );
  }

  return {
    id: message.id,
    threadId: message.threadId,
    role: message.role,
    parentMessageId: message.parentMessageId ?? undefined,
    content: convertContentPartToDto(message.content),
    metadata: message.metadata ?? undefined,
    toolCallRequest: message.toolCallRequest ?? undefined,
    tool_call_id: message.toolCallId ?? undefined,
    actionType: message.actionType ?? undefined,
    componentState: message.componentState ?? {},
    error: message.error ?? undefined,
    isCancelled: message.isCancelled,
    createdAt: message.createdAt,
    additionalContext: message.additionalContext ?? {},
    reasoning: message.reasoning ?? undefined,
    reasoningDurationMS: message.reasoningDurationMS ?? undefined,
  };
}

/**
 * Update the previous tool call message with an error when a tool response fails
 */
async function propagateErrorToPreviousToolCall(
  db: HydraDb,
  threadId: string,
  toolCallId: string | undefined,
  error: string | undefined,
) {
  if (!toolCallId || !error) return;

  const previousMessage = await operations.findPreviousToolCallMessage(
    db,
    threadId,
    toolCallId,
  );

  if (previousMessage) {
    await operations.updateMessage(db, previousMessage.id, {
      error: error,
    });
  }
}

/**
 * Add a response to a thread
 */
export async function addAssistantMessageToThread(
  db: HydraDb,
  component: LegacyComponentDecision,
  threadId: string,
) {
  const serializedMessage: ComponentDecisionV2 = {
    message: component.message,
    componentName: component.componentName,
    props: component.props ?? {},
    componentState: component.componentState,
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
    tool_call_id: component.toolCallId,
    componentState: component.componentState ?? {},
    reasoning: component.reasoning,
    reasoningDurationMS: component.reasoningDurationMS,
  });
}

/**
 * Verify the latest message in a thread is the specified message
 */
export async function verifyLatestMessageConsistency(
  db: HydraTransaction,
  threadId: string,
  newestMessageId: string,
  hasNewMessageId: boolean,
) {
  const latestMessages = await db.query.messages.findMany({
    where: and(
      eq(schema.messages.threadId, threadId),
      isNull(schema.messages.parentMessageId),
    ),
    orderBy: (messages, { desc }) => [desc(messages.createdAt)],
    limit: 2,
    columns: {
      id: true,
    },
  });

  // If we have an in-progress message (streaming), we need to check the message before it
  // Otherwise, we check the latest message
  const messageToCheck = hasNewMessageId
    ? latestMessages[1] // Check message before our in-progress message
    : latestMessages[0]; // Check latest message directly

  if (!(messageToCheck.id === newestMessageId)) {
    throw new Error(
      `Latest message before write is not the same as the added user message: ${messageToCheck.id} !== ${newestMessageId}`,
    );
  }
}

/**
 * Convert a thread message to its DTO representation for HTTP responses
 */
export function threadMessageToDto(message: ThreadMessage): ThreadMessageDto {
  return {
    id: message.id,
    threadId: message.threadId,
    role: message.role,
    parentMessageId: message.parentMessageId,
    createdAt: message.createdAt,
    component: message.component as ComponentDecisionV2 | undefined,
    content: convertContentPartToDto(message.content),
    metadata: message.metadata,
    componentState: message.componentState ?? {},
    toolCallRequest: message.toolCallRequest,
    actionType: message.actionType,
    tool_call_id: message.tool_call_id,
    error: message.error,
    isCancelled: message.isCancelled,
    additionalContext: message.additionalContext ?? {},
    reasoning: message.reasoning,
    reasoningDurationMS: message.reasoningDurationMS,
  };
}

/**
 * Convert a list of serialized thread message DTOs to a list of thread messages
 */
export function threadMessageDtoToThreadMessage(
  messages: ThreadMessageDto[],
): ThreadMessage[] {
  return messages.map((message) =>
    validateThreadMessage({
      ...message,
      content: convertContentDtoToContentPart(message.content),
    }),
  );
}
