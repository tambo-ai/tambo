import {
  MessageRole,
  ThreadAssistantMessage,
  ThreadMessage,
  ThreadSystemMessage,
  ThreadToolMessage,
  ThreadUserMessage,
} from "@tambo-ai-cloud/core";
import { DBMessage } from "../schema";

/**
 * Converts a database message (DBMessage) to a properly-typed ThreadMessage.
 * Maps DB field names to ThreadMessage field names and converts nulls to undefined.
 * Assumes database data is valid (no validation performed).
 */
export function dbMessageToThreadMessage(dbMsg: DBMessage): ThreadMessage {
  const base = {
    id: dbMsg.id,
    threadId: dbMsg.threadId,
    parentMessageId: dbMsg.parentMessageId ?? undefined,
    component: dbMsg.componentDecision ?? undefined,
    componentState: dbMsg.componentState ?? undefined,
    additionalContext: dbMsg.additionalContext ?? undefined,
    error: dbMsg.error ?? undefined,
    metadata: dbMsg.metadata ?? undefined,
    isCancelled: dbMsg.isCancelled,
    createdAt: dbMsg.createdAt,
    actionType: dbMsg.actionType ?? undefined,
    content: dbMsg.content,
  };

  switch (dbMsg.role) {
    case MessageRole.User: {
      const msg: ThreadUserMessage = {
        ...base,
        role: MessageRole.User,
      };
      return msg;
    }

    case MessageRole.System: {
      const msg: ThreadSystemMessage = {
        ...base,
        role: MessageRole.System,
      };
      return msg;
    }

    case MessageRole.Assistant: {
      const msg: ThreadAssistantMessage = {
        ...base,
        role: MessageRole.Assistant,
        toolCallRequest: dbMsg.toolCallRequest ?? undefined,
        tool_call_id: dbMsg.toolCallId ?? undefined,
        reasoning: dbMsg.reasoning ?? undefined,
        reasoningDurationMS: dbMsg.reasoningDurationMS ?? undefined,
      };
      return msg;
    }

    case MessageRole.Tool: {
      const msg: ThreadToolMessage = {
        ...base,
        role: MessageRole.Tool,
        tool_call_id: dbMsg.toolCallId!,
      };
      return msg;
    }

    default:
      throw new Error(`Unknown message role: ${dbMsg.role}`);
  }
}
