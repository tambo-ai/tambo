import type { TamboThreadMessage } from "../model/generate-component-response";

/**
 * Hook to extract reasoning from a message's component decision.
 *
 * Note: The reasoning field is not yet in the published TypeScript SDK types,
 * but this hook is forward-compatible. Currently falls back to the message field.
 * @param message - The message to extract reasoning from
 * @returns The reasoning string if present, null otherwise
 */
export function useTamboMessageReasoning(
  message: TamboThreadMessage,
): string | null {
  // Use type assertion for forward compatibility with upcoming SDK version
  return (
    (message.component as any)?.reasoning ?? message.component?.message ?? null
  );
}
