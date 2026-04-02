import type { Memory } from "./memory";
import {
  MEMORY_TOKEN_BUDGET,
  formatMemoriesForPrompt,
  selectMemoriesWithinBudget,
} from "./memory-budget";

function makeMemory(
  id: string,
  content: string,
  importance: 1 | 2 | 3 | 4 | 5 = 3,
): Memory {
  return { id, content, category: "fact", importance };
}

describe("selectMemoriesWithinBudget", () => {
  it("returns all memories when within budget", () => {
    const memories = [makeMemory("1", "short"), makeMemory("2", "also short")];
    const result = selectMemoriesWithinBudget(memories, 100);
    expect(result).toHaveLength(2);
  });

  it("truncates when exceeding budget", () => {
    // 3 chars per token, so 10 tokens = 30 chars budget
    const memories = [
      makeMemory("1", "a".repeat(20)),
      makeMemory("2", "b".repeat(20)),
    ];
    const result = selectMemoriesWithinBudget(memories, 10);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("returns empty array when first memory exceeds budget", () => {
    const memories = [makeMemory("1", "a".repeat(100))];
    const result = selectMemoriesWithinBudget(memories, 1);
    expect(result).toHaveLength(0);
  });

  it("returns empty array for empty input", () => {
    const result = selectMemoriesWithinBudget([], 1000);
    expect(result).toHaveLength(0);
  });

  it("uses default budget when not specified", () => {
    const result = selectMemoriesWithinBudget([]);
    expect(result).toHaveLength(0);
    // Just verify it doesn't throw with default
  });

  it("preserves input order", () => {
    const memories = [
      makeMemory("a", "first"),
      makeMemory("b", "second"),
      makeMemory("c", "third"),
    ];
    const result = selectMemoriesWithinBudget(memories, 1000);
    expect(result.map((m) => m.id)).toEqual(["a", "b", "c"]);
  });

  it("does not mutate the input array", () => {
    const memories = Object.freeze([
      makeMemory("1", "hello"),
      makeMemory("2", "world"),
    ]);
    const result = selectMemoriesWithinBudget(memories, 1000);
    expect(result).toHaveLength(2);
  });

  it("MEMORY_TOKEN_BUDGET is 1000", () => {
    expect(MEMORY_TOKEN_BUDGET).toBe(1000);
  });
});

describe("formatMemoriesForPrompt", () => {
  it("returns empty string for empty array", () => {
    expect(formatMemoriesForPrompt([])).toBe("");
  });

  it("formats memories with IDs and importance", () => {
    const memories = [
      makeMemory("mem_abc", "Prefers dark mode", 5),
      makeMemory("mem_def", "Works at Acme Corp", 3),
    ];
    const result = formatMemoriesForPrompt(memories);
    expect(result).toBe(
      "- [mem_abc] (importance: 5) Prefers dark mode\n- [mem_def] (importance: 3) Works at Acme Corp",
    );
  });

  it("formats a single memory", () => {
    const memories = [makeMemory("mem_1", "Uses TypeScript", 4)];
    const result = formatMemoriesForPrompt(memories);
    expect(result).toBe("- [mem_1] (importance: 4) Uses TypeScript");
  });
});
