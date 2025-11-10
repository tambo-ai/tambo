import type TamboAI from "@tambo-ai/typescript-sdk";
import { StagedFile } from "../hooks/use-message-files";

/**
 * Builds message content with text and files
 * @param text - The text content
 * @param files - Array of staged files (uploaded to storage)
 * @returns Array of message content parts
 */
export function buildMessageContent(
  text: string,
  files: StagedFile[],
): TamboAI.Beta.Threads.ChatCompletionContentPart[] {
  const content: TamboAI.Beta.Threads.ChatCompletionContentPart[] = [];
  if (text.trim()) {
    content.push({
      type: "text",
      text: text.trim(),
    });
  }
  for (const file of files) {
    if (file.storagePath) {
      if (file.type.startsWith("image/")) {
        content.push({
          type: "image_url",
          image_url: {
            url: `storage://${file.storagePath}`,
            detail: "auto",
          },
        } as TamboAI.Beta.Threads.ChatCompletionContentPart);
      } else {
        content.push({
          type: "text",
          text: `storage://${file.storagePath}|${file.type}|${file.name}`,
        });
      }
    }
  }
  if (content.length === 0) {
    throw new Error("Message must contain text or files");
  }
  return content;
}
