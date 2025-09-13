import type TamboAI from "@tambo-ai/typescript-sdk";

export interface StagedImage {
  dataUrl: string;
}

export function buildMessageContent(
  text: string,
  images: StagedImage[],
): TamboAI.Beta.Threads.ChatCompletionContentPart[] {
  const content: TamboAI.Beta.Threads.ChatCompletionContentPart[] = [];
  if (text.trim()) {
    content.push({ type: "text", text: text.trim() });
  }
  for (const image of images) {
    content.push({ type: "image_url", image_url: { url: image.dataUrl } });
  }
  if (content.length === 0) {
    throw new Error("Message must contain text or images");
  }
  return content;
}

