import type TamboAI from "@tambo-ai/typescript-sdk";
import { StagedFile } from "../hooks/use-message-files";

// Content size limits (in characters)
const MAX_TEXT_LENGTH = 100000; // ~100KB of text
const MAX_TEXT_FILE_LENGTH = 50000; // Max 50KB per text file

/**
 * Truncates text content if it exceeds the maximum length
 * @param text - The text to truncate
 * @param maxLength - Maximum allowed length
 * @param _fileName - Optional filename for context (unused but kept for API compatibility)
 * @returns Truncated text with notice if content was cut
 */
function truncateText(
  text: string,
  maxLength: number,
  _fileName?: string,
): string {
  if (text.length <= maxLength) {
    return text;
  }

  const truncated = text.substring(0, maxLength);
  const notice = `\n\n[Content truncated - showing first ${maxLength} characters of ${text.length} total]`;
  return truncated + notice;
}

/**
 * Builds message content with text and files
 * @param text - The text content
 * @param files - Array of staged files (images, PDFs, text files)
 * @returns Array of message content parts
 */
export function buildMessageContent(
  text: string,
  files: StagedFile[],
): TamboAI.Beta.Threads.ChatCompletionContentPart[] {
  const content: TamboAI.Beta.Threads.ChatCompletionContentPart[] = [];

  // Collect all text content (user message + file contents) into one text part
  const textParts: string[] = [];

  if (text.trim()) {
    textParts.push(text.trim());
  }

  // Add text file contents to the text parts
  for (const file of files) {
    if (file.contentType === "text" && file.textContent) {
      const truncatedContent = truncateText(
        file.textContent,
        MAX_TEXT_FILE_LENGTH,
        file.name,
      );
      textParts.push(`\n\n--- File: ${file.name} ---\n${truncatedContent}`);
    }
  }

  // Add combined text as a single content part
  if (textParts.length > 0) {
    const combinedText = textParts.join("\n");
    const finalText = truncateText(combinedText, MAX_TEXT_LENGTH);

    content.push({
      type: "text",
      text: finalText,
    });
  }

  // Add images as separate content parts
  for (const file of files) {
    if (file.contentType === "image" && file.dataUrl) {
      content.push({
        type: "image_url",
        image_url: {
          url: file.dataUrl,
        },
      });
    }
  }

  if (content.length === 0) {
    throw new Error("Message must contain text or files");
  }

  return content;
}
