/**
 * Thread utility functions for searching and accessing thread content.
 */

import type { StreamState } from "./event-accumulator";
import type { V1ComponentContent } from "../types/message";

/**
 * Find a component content block by ID in a specific thread.
 * Searches from most recent messages first since active components are likely near the tail.
 * Only searches the specified thread to prevent cross-thread data access.
 * @param streamState - The current stream state containing thread data
 * @param threadId - The thread ID to search in
 * @param componentId - The component ID to find
 * @returns The component content block, or undefined if not found
 */
export function findComponentContent(
  streamState: StreamState,
  threadId: string,
  componentId: string,
): V1ComponentContent | undefined {
  const threadState = streamState.threadMap[threadId];
  if (!threadState) {
    return undefined;
  }

  // Search from most recent messages first for better performance
  const messages = threadState.thread.messages;
  for (let i = messages.length - 1; i >= 0; i--) {
    const content = messages[i].content;
    for (let j = content.length - 1; j >= 0; j--) {
      const block = content[j];
      if (block.type === "component" && block.id === componentId) {
        return block;
      }
    }
  }
  return undefined;
}
