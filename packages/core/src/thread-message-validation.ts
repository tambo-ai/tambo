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
} from "./threads";

/**
 * Loosens a strictly-typed message for validation.
 * Allows component and toolCallRequest to be any type for external input.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loosen<T extends { component?: any; toolCallRequest?: any }> = Omit<
  T,
  "component" | "toolCallRequest"
> & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toolCallRequest?: any;
};

type LooseThreadMessage = Loosen<ThreadMessage>;

/**
 * Validates and converts a loosely-typed message object to a properly-typed ThreadMessage.
 * This function should be used at API boundaries when receiving messages from external sources.
 *
 * @throws Error if the message is invalid (e.g., tool message without tool_call_id)
 */
export function validateThreadMessage(msg: LooseThreadMessage): ThreadMessage {
  const {
    tool_call_id,
    toolCallRequest,
    reasoning,
    reasoningDurationMS,
    ...base
  } = msg;

  if (msg.role === MessageRole.User) {
    return { ...base, role: MessageRole.User } satisfies ThreadUserMessage;
  }
  if (msg.role === MessageRole.System) {
    return { ...base, role: MessageRole.System } satisfies ThreadSystemMessage;
  }
  if (msg.role === MessageRole.Assistant) {
    if (tool_call_id && !toolCallRequest) {
      throw new Error(
        "Assistant messages with tool_call_id must include toolCallRequest",
      );
    }
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

type LooseUnsavedThreadMessage = Loosen<UnsavedThreadMessage>;

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
    tool_call_id,
    toolCallRequest,
    reasoning,
    reasoningDurationMS,
    ...base
  } = msg;

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
    if (tool_call_id && !toolCallRequest) {
      throw new Error(
        "Assistant messages with tool_call_id must include toolCallRequest",
      );
    }
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
