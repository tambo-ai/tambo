export function generateMessageId(): string {
  return `message-${Math.random().toString(36).substring(2, 15)}`;
}
