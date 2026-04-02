import type { Memory } from "./memory";

/** Conservative estimate: 3 characters per token (accounts for non-Latin text, code, URLs) */
const CHARS_PER_TOKEN = 3;

/** Default token budget for memory injection into system prompt */
export const MEMORY_TOKEN_BUDGET = 1000;

/**
 * Selects memories that fit within the given token budget.
 * Assumes input is already sorted by the caller (e.g., importance DESC, createdAt DESC).
 * Uses a conservative chars-per-token heuristic for estimation.
 * Fills greedily in order — stops at the first memory that would exceed the budget.
 * @returns The subset of memories that fit within the budget, preserving input order.
 */
export function selectMemoriesWithinBudget(
  memories: readonly Memory[],
  maxTokens: number = MEMORY_TOKEN_BUDGET,
): Memory[] {
  const maxChars = maxTokens * CHARS_PER_TOKEN;
  let usedChars = 0;
  const selected: Memory[] = [];
  for (const memory of memories) {
    if (usedChars + memory.content.length > maxChars) break;
    usedChars += memory.content.length;
    selected.push(memory);
  }
  return selected;
}

/**
 * Formats selected memories into a text block for injection into the system prompt.
 * Includes memory IDs so agent tools can reference them for deletion.
 * @returns Formatted string, or empty string if no memories.
 */
export function formatMemoriesForPrompt(memories: readonly Memory[]): string {
  if (memories.length === 0) return "";
  return memories
    .map((m) => `- [${m.id}] (importance: ${m.importance}) ${m.content}`)
    .join("\n");
}
