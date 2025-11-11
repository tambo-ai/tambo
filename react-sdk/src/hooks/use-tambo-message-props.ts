import type { TamboThreadMessage } from "../model/generate-component-response";
import {
  getSafeContent,
  checkHasContent,
  getMessageAttachments,
  getMessageImages,
} from "../util/message-content";

/**
 * Type guard to check if component has reasoning property
 * @returns true if component has a reasoning string property
 */
function hasReasoningProperty(
  component: unknown,
): component is { reasoning: string } {
  return (
    typeof component === "object" &&
    component !== null &&
    "reasoning" in component &&
    typeof (component as any).reasoning === "string"
  );
}

/**
 * Type guard to check if component has message property
 * @returns true if component has a message string property
 */
function hasMessageProperty(
  component: unknown,
): component is { message: string } {
  return (
    typeof component === "object" &&
    component !== null &&
    "message" in component &&
    typeof (component as any).message === "string"
  );
}

/**
 * Type guard to check if component has toolCallRequest property
 * @returns true if component has a toolCallRequest property
 */
function hasToolCallRequestProperty(
  component: unknown,
): component is { toolCallRequest: any } {
  return (
    typeof component === "object" &&
    component !== null &&
    "toolCallRequest" in component
  );
}

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

  let toolCall: any = null;
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
