import { ThreadMessage, validateThreadMessage } from "@tambo-ai-cloud/core";
import { type DBMessage } from "../schema";

/**
 * Converts a database message (DBMessage) to a properly-typed ThreadMessage.
 * Maps DB field names to ThreadMessage field names and converts nulls to undefined,
 * then passes the result through validateThreadMessage to enforce core invariants
 * (for example, tool messages must include tool_call_id).
 */
export function dbMessageToThreadMessage(dbMsg: DBMessage): ThreadMessage {
  return validateThreadMessage({
    id: dbMsg.id,
    threadId: dbMsg.threadId,
    role: dbMsg.role,
    content: dbMsg.content,
    parentMessageId: dbMsg.parentMessageId ?? undefined,
    component: dbMsg.componentDecision ?? undefined,
    componentState: dbMsg.componentState ?? undefined,
    additionalContext: dbMsg.additionalContext ?? undefined,
    error: dbMsg.error ?? undefined,
    metadata: dbMsg.metadata ?? undefined,
    isCancelled: dbMsg.isCancelled,
    createdAt: dbMsg.createdAt,
    actionType: dbMsg.actionType ?? undefined,
    tool_call_id: dbMsg.toolCallId ?? undefined,
    toolCallRequest: dbMsg.toolCallRequest ?? undefined,
    reasoning: dbMsg.reasoning ?? undefined,
    reasoningDurationMS: dbMsg.reasoningDurationMS ?? undefined,
  });
}
