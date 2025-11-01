import type TamboAI from "@tambo-ai/typescript-sdk";
import { StagedAttachment } from "../hooks/use-message-images";

export type AttachmentContentMapper = (
  attachment: StagedAttachment,
) => TamboAI.Beta.Threads.ChatCompletionContentPart[] | null | undefined;

const defaultAttachmentContentMapper: AttachmentContentMapper = (
  attachment,
) => {
  // Only image attachments are supported for now. When new attachment types are allowed,
  // add their mapping logic here and update `detectAttachmentKind` accordingly.
  if (attachment.kind === "image") {
    return [
      {
        type: "image_url",
        image_url: {
          url: attachment.dataUrl,
        },
      } satisfies TamboAI.Beta.Threads.ChatCompletionContentPart,
    ];
  }

  throw new Error(`Unsupported attachment type: ${attachment.kind}`);
};

interface BuildMessageContentOptions {
  mapAttachmentToContentParts?: AttachmentContentMapper;
}

/**
 * Builds message content with text and attachments.
 * @param text - The text content
 * @param attachments - Array of staged attachments
 * @param options - Optional customization for attachment mapping
 * @returns Array of message content parts
 */
export function buildMessageContent(
  text: string,
  attachments: StagedAttachment[],
  options?: BuildMessageContentOptions,
): TamboAI.Beta.Threads.ChatCompletionContentPart[] {
  const content: TamboAI.Beta.Threads.ChatCompletionContentPart[] = [];

  if (text.trim()) {
    content.push({
      type: "text",
      text: text.trim(),
    });
  }

  const mapAttachment =
    options?.mapAttachmentToContentParts ?? defaultAttachmentContentMapper;

  for (const attachment of attachments) {
    const parts = mapAttachment(attachment);
    if (parts && parts.length > 0) {
      content.push(...parts);
    }
  }

  if (content.length === 0) {
    throw new Error("Message must contain text or attachments");
  }

  return content;
}
