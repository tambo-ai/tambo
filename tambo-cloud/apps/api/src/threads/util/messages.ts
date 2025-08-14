import {
  ActionType,
  ComponentDecisionV2,
  ContentPartType,
  LegacyComponentDecision,
  MessageRole,
  ThreadMessage,
} from "@tambo-ai-cloud/core";
import {
  HydraDb,
  HydraTransaction,
  operations,
  schema,
} from "@tambo-ai-cloud/db";
import { and, eq } from "drizzle-orm";
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
  const message = await operations.addMessage(db, {
    threadId,
    role: messageDto.role,
    content: convertContentDtoToContentPart(messageDto.content),
    componentDecision: messageDto.component ?? undefined,
    metadata: messageDto.metadata,
    actionType: messageDto.actionType ?? undefined,
    toolCallRequest: messageDto.toolCallRequest ?? undefined,
    toolCallId: messageDto.tool_call_id,
    componentState: messageDto.componentState ?? {},
    error: messageDto.error,
    isCancelled: messageDto.isCancelled ?? false,
    additionalContext: messageDto.additionalContext ?? {},
  });

  if (messageDto.actionType === ActionType.ToolResponse && messageDto.error) {
    //Update the previous request message with the error
    //Find message with matching toolCallId and action is tool call
    await propagateErrorToPreviousToolCall(
      db,
      threadId,
      messageDto.tool_call_id,
      messageDto.error,
    );
  }

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
    error: message.error ?? undefined,
    isCancelled: message.isCancelled,
    additionalContext: message.additionalContext ?? {},
  };
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
  });

  if (messageDto.actionType === ActionType.ToolResponse && messageDto.error) {
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
    ...message,
    content: convertContentPartToDto(message.content),
    metadata: message.metadata ?? undefined,
    toolCallRequest: message.toolCallRequest ?? undefined,
    tool_call_id: message.toolCallId ?? undefined,
    actionType: message.actionType ?? undefined,
    componentState: message.componentState ?? {},
    error: message.error ?? undefined,
    isCancelled: message.isCancelled,
    additionalContext: message.additionalContext ?? {},
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
    tool_call_id: component.toolCallId,
    componentState: component.componentState ?? {},
  });
}

/**
 * Verify the latest message in a thread is the latest user message in the thread
 */
export async function verifyLatestMessageConsistency(
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
      `Latest message before write is not the same as the added user message: ${messageToCheck.id} !== ${addedUserMessage.id}`,
    );
  }
}

/**
 * Convert a list of serialized thread message DTOs to a list of thread messages
 */
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

/**
 * Find the previous tool call message with a matching tool call ID
 */
export async function findPreviousToolCallMessage(
  db: HydraDb,
  threadId: string,
  toolCallId: string,
): Promise<schema.DBMessage | undefined> {
  return await db.query.messages.findFirst({
    where: and(
      eq(schema.messages.threadId, threadId),
      eq(schema.messages.toolCallId, toolCallId),
      eq(schema.messages.actionType, ActionType.ToolCall),
    ),
  });
}
