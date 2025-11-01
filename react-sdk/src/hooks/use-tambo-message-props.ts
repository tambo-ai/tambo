import type { TamboThreadMessage } from "../model/generate-component-response";
import {
  getSafeContent,
  checkHasContent,
  getMessageAttachments,
  type TamboMessageAttachment,
} from "../util/message-content";

/**
 * Hook to extract all relevant props from a message.
 * Useful for custom message rendering.
 * @param message - The message to extract props from
 * @returns Object containing content, hasContent, attachments, images, reasoning, and toolCall
 */
export function useTamboMessageProps(message: TamboThreadMessage) {
  const content = getSafeContent(message.content);
  const hasContent = checkHasContent(message.content);
  const attachments: TamboMessageAttachment[] = Array.isArray(message.content)
    ? getMessageAttachments(message.content)
    : [];
  const images = attachments
    .filter((attachment) => attachment.kind === "image" && attachment.url)
    .map((attachment) => attachment.url!) as string[];

  // Get reasoning from component decision
  // Note: reasoning field is not yet in the published SDK, but will be added
  const reasoning =
    (message.component as any)?.reasoning ?? message.component?.message ?? null;

  // Get tool call request
  const toolCall =
    message.toolCallRequest ?? message.component?.toolCallRequest ?? null;

  return {
    content,
    hasContent,
    attachments,
    images,
    reasoning,
    toolCall,
  };
}
