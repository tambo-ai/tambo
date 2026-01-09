import { randomUUID } from "crypto";

/**
 * Generate a unique message ID using cryptographically secure randomness.
 * Format: message-{uuid}
 */
export function generateMessageId(): string {
  return `message-${randomUUID()}`;
}
