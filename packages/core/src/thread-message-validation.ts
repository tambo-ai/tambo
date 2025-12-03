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
  const {
    id,
    threadId,
    content,
    parentMessageId,
    component,
    componentState,
    additionalContext,
    error,
    metadata,
    isCancelled,
    createdAt,
    actionType,
    tool_call_id,
    toolCallRequest,
    reasoning,
    reasoningDurationMS,
  } = msg;

  const base = {
    id,
    threadId,
    content,
    parentMessageId,
    component,
    componentState,
    additionalContext,
    error,
    metadata,
    isCancelled,
    createdAt,
    actionType,
  };

  if (msg.role === MessageRole.User) {
    return { ...base, role: MessageRole.User } satisfies ThreadUserMessage;
  }
  if (msg.role === MessageRole.System) {
    return { ...base, role: MessageRole.System } satisfies ThreadSystemMessage;
  }
  if (msg.role === MessageRole.Assistant) {
    return {
      ...base,
      role: MessageRole.Assistant,
      toolCallRequest,
      tool_call_id,
      reasoning,
      reasoningDurationMS,
    } satisfies ThreadAssistantMessage;
  }
  if (msg.role === MessageRole.Tool) {
    if (!tool_call_id) {
      throw new Error("Tool messages require tool_call_id");
    }
    return {
      ...base,
      role: MessageRole.Tool,
      tool_call_id,
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
  const {
    content,
    parentMessageId,
    component,
    componentState,
    additionalContext,
    error,
    metadata,
    isCancelled,
    createdAt,
    actionType,
    tool_call_id,
    toolCallRequest,
    reasoning,
    reasoningDurationMS,
  } = msg;

  const base = {
    content,
    parentMessageId,
    component,
    componentState,
    additionalContext,
    error,
    metadata,
    isCancelled,
    createdAt,
    actionType,
  };

  if (msg.role === MessageRole.User) {
    return {
      ...base,
      role: MessageRole.User,
    } satisfies UnsavedThreadUserMessage;
  }
  if (msg.role === MessageRole.System) {
    return {
      ...base,
      role: MessageRole.System,
    } satisfies UnsavedThreadSystemMessage;
  }
  if (msg.role === MessageRole.Assistant) {
    return {
      ...base,
      role: MessageRole.Assistant,
      toolCallRequest,
      tool_call_id,
      reasoning,
      reasoningDurationMS,
    } satisfies UnsavedThreadAssistantMessage;
  }
  if (msg.role === MessageRole.Tool) {
    if (!tool_call_id) {
      throw new Error("Tool messages require tool_call_id");
    }
    return {
      ...base,
      role: MessageRole.Tool,
      tool_call_id,
    } satisfies UnsavedThreadToolMessage;
  }
  throw new Error(`Unknown message role: ${msg.role}`);
}
