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

/**
 * Validates and converts a loosely-typed message object to a properly-typed ThreadMessage.
 * This function should be used at API boundaries when receiving messages from external sources.
 *
 * @throws Error if the message is invalid (e.g., tool message without tool_call_id)
 */
export function validateThreadMessage(msg: {
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
}): ThreadMessage {
  const base = {
    id: msg.id,
    threadId: msg.threadId,
    parentMessageId: msg.parentMessageId,
    component: msg.component,
    componentState: msg.componentState,
    additionalContext: msg.additionalContext,
    error: msg.error,
    metadata: msg.metadata,
    isCancelled: msg.isCancelled,
    createdAt: msg.createdAt,
    actionType: msg.actionType,
  };

  switch (msg.role) {
    case MessageRole.User:
      return {
        ...base,
        role: MessageRole.User,
        content: msg.content,
      } as ThreadUserMessage;

    case MessageRole.System:
      return {
        ...base,
        role: MessageRole.System,
        content: msg.content,
      } as ThreadSystemMessage;

    case MessageRole.Assistant:
      return {
        ...base,
        role: MessageRole.Assistant,
        content: msg.content,
        toolCallRequest: msg.toolCallRequest,
        tool_call_id: msg.tool_call_id,
        reasoning: msg.reasoning,
        reasoningDurationMS: msg.reasoningDurationMS,
      } as ThreadAssistantMessage;

    case MessageRole.Tool:
      if (!msg.tool_call_id) {
        throw new Error("Tool messages require tool_call_id");
      }
      return {
        ...base,
        role: MessageRole.Tool,
        content: msg.content,
        tool_call_id: msg.tool_call_id,
      } as ThreadToolMessage;

    default:
      throw new Error(`Unknown message role: ${msg.role}`);
  }
}

/**
 * Validates and converts a loosely-typed unsaved message object to a properly-typed UnsavedThreadMessage.
 * This function should be used at API boundaries when receiving messages from external sources.
 *
 * @throws Error if the message is invalid (e.g., tool message without tool_call_id)
 */
export function validateUnsavedThreadMessage(msg: {
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
}): UnsavedThreadMessage {
  const base = {
    parentMessageId: msg.parentMessageId,
    component: msg.component,
    componentState: msg.componentState,
    additionalContext: msg.additionalContext,
    error: msg.error,
    metadata: msg.metadata,
    isCancelled: msg.isCancelled,
    createdAt: msg.createdAt,
    actionType: msg.actionType,
  };

  switch (msg.role) {
    case MessageRole.User:
      return {
        ...base,
        role: MessageRole.User,
        content: msg.content,
      } as UnsavedThreadUserMessage;

    case MessageRole.System:
      return {
        ...base,
        role: MessageRole.System,
        content: msg.content,
      } as UnsavedThreadSystemMessage;

    case MessageRole.Assistant:
      return {
        ...base,
        role: MessageRole.Assistant,
        content: msg.content,
        toolCallRequest: msg.toolCallRequest,
        tool_call_id: msg.tool_call_id,
        reasoning: msg.reasoning,
        reasoningDurationMS: msg.reasoningDurationMS,
      } as UnsavedThreadAssistantMessage;

    case MessageRole.Tool:
      if (!msg.tool_call_id) {
        throw new Error("Tool messages require tool_call_id");
      }
      return {
        ...base,
        role: MessageRole.Tool,
        content: msg.content,
        tool_call_id: msg.tool_call_id,
      } as UnsavedThreadToolMessage;

    default:
      throw new Error(`Unknown message role: ${msg.role}`);
  }
}
