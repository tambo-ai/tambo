import { MessageRole } from "@tambo-ai-cloud/core";
import * as schema from "../schema";

/**
 * Older messages used the "hydra" role to represent a message from the
 * Tambo assistant. This function fixes the role of those messages to be
 * "assistant" instead.
 */
export function fixLegacyRole<T extends typeof schema.messages.$inferSelect>(
  messages: T[],
) {
  return messages.map((message) => {
    if (message.role === "hydra") {
      return { ...message, role: MessageRole.Assistant };
    }
    return message;
  });
}
