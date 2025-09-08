import { StagedImage } from "../hooks/use-message-images";

// Match Vercel AI SDK CoreMessage format
export interface MessageContentPart {
  type: "text" | "image";
  image?: string | URL;
  text?: string;
}

/**
 * Builds message content with text and images
 * @param text - The text content
 * @param images - Array of staged images
 * @returns Array of message content parts
 */
export function buildMessageContent(
  text: string,
  images: StagedImage[],
): MessageContentPart[] {
  const content: MessageContentPart[] = [];

  if (text.trim()) {
    content.push({
      type: "text",
      text: text.trim(),
    });
  }

  for (const image of images) {
    content.push({
      type: "image",
      image: image.dataUrl,
    });
  }

  if (content.length === 0) {
    throw new Error("Message must contain text or images");
  }

  return content;
}
