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

  // Add user text as the first content part
  if (text.trim()) {
    content.push({
      type: "text",
      text: text.trim(),
    });
  }

  // Add files as document content parts
  for (const file of files) {
    if (file.storagePath) {
      content.push({
        type: "document",
        document: {
          storagePath: file.storagePath,
          mimeType: file.type,
        },
      } as TamboAI.Beta.Threads.ChatCompletionContentPart);
    }
  }

  if (content.length === 0) {
    throw new Error("Message must contain text or files");
  }

  return content;
}
