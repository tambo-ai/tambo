import {
  MessageRole,
  ThreadMessage,
  ThreadUserMessage,
  ThreadSystemMessage,
  ThreadAssistantMessage,
  ThreadToolMessage,
  UnsavedThreadMessage,
  UnsavedThreadUserMessage,
  UnsavedThreadSystemMessage,
  UnsavedThreadAssistantMessage,
  UnsavedThreadToolMessage,
  ChatCompletionContentPart,
} from "./threads";

type LooseThreadMessage = {
  id: string;
  threadId: string;
  role: MessageRole;
  content: ChatCompletionContentPart[];
  parentMessageId?: string;
  component?: any;
  componentState?: Record<string, unknown>;
  additionalContext?: Record<string, unknown>;
  error?: string;
  metadata?: Record<string, unknown>;
  isCancelled?: boolean;
  createdAt: Date;
  actionType?: any;
  tool_call_id?: string;
  toolCallRequest?: any;
  reasoning?: string[];
  reasoningDurationMS?: number;
};

/**
 * Validates and converts a loosely-typed message object to a properly-typed ThreadMessage.
 * This function should be used at API boundaries when receiving messages from external sources.
 *
 * @throws Error if the message is invalid (e.g., tool message without tool_call_id)
 */
export function validateThreadMessage(msg: LooseThreadMessage): ThreadMessage {
  if (msg.role === MessageRole.User) {
    return {
      id: msg.id,
      threadId: msg.threadId,
      role: MessageRole.User,
      content: msg.content,
      parentMessageId: msg.parentMessageId,
      component: msg.component,
      componentState: msg.componentState,
      additionalContext: msg.additionalContext,
      error: msg.error,
      metadata: msg.metadata,
      isCancelled: msg.isCancelled,
      createdAt: msg.createdAt,
      actionType: msg.actionType,
    } satisfies ThreadUserMessage;
  }
  if (msg.role === MessageRole.System) {
    return {
      id: msg.id,
      threadId: msg.threadId,
      role: MessageRole.System,
      content: msg.content,
      parentMessageId: msg.parentMessageId,
      component: msg.component,
      componentState: msg.componentState,
      additionalContext: msg.additionalContext,
      error: msg.error,
      metadata: msg.metadata,
      isCancelled: msg.isCancelled,
      createdAt: msg.createdAt,
      actionType: msg.actionType,
    } satisfies ThreadSystemMessage;
  }
  if (msg.role === MessageRole.Assistant) {
    return {
      id: msg.id,
      threadId: msg.threadId,
      role: MessageRole.Assistant,
      content: msg.content,
      parentMessageId: msg.parentMessageId,
      component: msg.component,
      componentState: msg.componentState,
      additionalContext: msg.additionalContext,
      error: msg.error,
      metadata: msg.metadata,
      isCancelled: msg.isCancelled,
      createdAt: msg.createdAt,
      actionType: msg.actionType,
      toolCallRequest: msg.toolCallRequest,
      tool_call_id: msg.tool_call_id,
      reasoning: msg.reasoning,
      reasoningDurationMS: msg.reasoningDurationMS,
    } satisfies ThreadAssistantMessage;
  }
  if (msg.role === MessageRole.Tool) {
    if (!msg.tool_call_id) {
      throw new Error("Tool messages require tool_call_id");
    }
    return {
      id: msg.id,
      threadId: msg.threadId,
      role: MessageRole.Tool,
      content: msg.content,
      parentMessageId: msg.parentMessageId,
      component: msg.component,
      componentState: msg.componentState,
      additionalContext: msg.additionalContext,
      error: msg.error,
      metadata: msg.metadata,
      isCancelled: msg.isCancelled,
      createdAt: msg.createdAt,
      actionType: msg.actionType,
      tool_call_id: msg.tool_call_id,
    } satisfies ThreadToolMessage;
  }
  throw new Error(`Unknown message role: ${msg.role}`);
}

type LooseUnsavedThreadMessage = {
  role: MessageRole;
  content: ChatCompletionContentPart[];
  parentMessageId?: string;
  component?: any;
  componentState?: Record<string, unknown>;
  additionalContext?: Record<string, unknown>;
  error?: string;
  metadata?: Record<string, unknown>;
  isCancelled?: boolean;
  createdAt: Date;
  actionType?: any;
  tool_call_id?: string;
  toolCallRequest?: any;
  reasoning?: string[];
  reasoningDurationMS?: number;
};

/**
 * Validates and converts a loosely-typed unsaved message object to a properly-typed UnsavedThreadMessage.
 * This function should be used at API boundaries when receiving messages from external sources.
 *
 * @throws Error if the message is invalid (e.g., tool message without tool_call_id)
 */
export function validateUnsavedThreadMessage(
  msg: LooseUnsavedThreadMessage,
): UnsavedThreadMessage {
  if (msg.role === MessageRole.User) {
    return {
      role: MessageRole.User,
      content: msg.content,
      parentMessageId: msg.parentMessageId,
      component: msg.component,
      componentState: msg.componentState,
      additionalContext: msg.additionalContext,
      error: msg.error,
      metadata: msg.metadata,
      isCancelled: msg.isCancelled,
      createdAt: msg.createdAt,
      actionType: msg.actionType,
    } satisfies UnsavedThreadUserMessage;
  }
  if (msg.role === MessageRole.System) {
    return {
      role: MessageRole.System,
      content: msg.content,
      parentMessageId: msg.parentMessageId,
      component: msg.component,
      componentState: msg.componentState,
      additionalContext: msg.additionalContext,
      error: msg.error,
      metadata: msg.metadata,
      isCancelled: msg.isCancelled,
      createdAt: msg.createdAt,
      actionType: msg.actionType,
    } satisfies UnsavedThreadSystemMessage;
  }
  if (msg.role === MessageRole.Assistant) {
    return {
      role: MessageRole.Assistant,
      content: msg.content,
      parentMessageId: msg.parentMessageId,
      component: msg.component,
      componentState: msg.componentState,
      additionalContext: msg.additionalContext,
      error: msg.error,
      metadata: msg.metadata,
      isCancelled: msg.isCancelled,
      createdAt: msg.createdAt,
      actionType: msg.actionType,
      toolCallRequest: msg.toolCallRequest,
      tool_call_id: msg.tool_call_id,
      reasoning: msg.reasoning,
      reasoningDurationMS: msg.reasoningDurationMS,
    } satisfies UnsavedThreadAssistantMessage;
  }
  if (msg.role === MessageRole.Tool) {
    if (!msg.tool_call_id) {
      throw new Error("Tool messages require tool_call_id");
    }
    return {
      role: MessageRole.Tool,
      content: msg.content,
      parentMessageId: msg.parentMessageId,
      component: msg.component,
      componentState: msg.componentState,
      additionalContext: msg.additionalContext,
      error: msg.error,
      metadata: msg.metadata,
      isCancelled: msg.isCancelled,
      createdAt: msg.createdAt,
      actionType: msg.actionType,
      tool_call_id: msg.tool_call_id,
    } satisfies UnsavedThreadToolMessage;
  }
  throw new Error(`Unknown message role: ${msg.role}`);
}
