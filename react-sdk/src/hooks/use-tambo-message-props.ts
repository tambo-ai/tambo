import type TamboAI from "@tambo-ai/typescript-sdk";
import type { TamboThreadMessage } from "../model/generate-component-response";
import {
  getSafeContent,
  checkHasContent,
  getMessageAttachments,
  getMessageImages,
} from "../util/message-content";
import {
  hasReasoningProperty,
  hasMessageProperty,
  hasToolCallRequestProperty,
} from "../util/type-guards";

/**
 * Hook to extract commonly used properties from a TamboThreadMessage.
 * Provides easy access to message content, attachments, images, reasoning, and tool calls.
 * @param message - The thread message to extract properties from
 * @returns Object containing extracted message properties
 * @example
 * ```tsx
 * const { content, hasContent, images, reasoning, toolCall } = useTamboMessageProps(message);
 * ```
 */
export function useTamboMessageProps(message: TamboThreadMessage) {
  const content = getSafeContent(message.content);
  const hasContent = checkHasContent(message.content);
  const attachments = getMessageAttachments(message.content);
  const images = getMessageImages(message.content);

  let reasoning: string | null = null;
  if (hasReasoningProperty(message.component)) {
    reasoning = message.component.reasoning;
  } else if (hasMessageProperty(message.component)) {
    reasoning = message.component.message;
  }

  let toolCall: TamboAI.ToolCallRequest | null = null;
  if (message.toolCallRequest) {
    toolCall = message.toolCallRequest;
  } else if (hasToolCallRequestProperty(message.component)) {
    toolCall = message.component.toolCallRequest;
  }

  return {
    content,
    hasContent,
    attachments,
    images,
    reasoning,
    toolCall,
  };
}
