import { nanoid } from "nanoid";

/**
 * Generate a unique message ID using cryptographically secure randomness.
 * Format: message-{nanoid}
 */
export function generateMessageId(): string {
  return `message-${nanoid()}`;
}
