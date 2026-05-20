export const MEMORY_CATEGORIES = [
  "preference",
  "fact",
  "goal",
  "relationship",
] as const;

export type MemoryCategory = (typeof MEMORY_CATEGORIES)[number];

export type MemoryImportance = 1 | 2 | 3 | 4 | 5;

export interface Memory {
  readonly id: string;
  readonly content: string;
  readonly category: MemoryCategory;
  readonly importance: MemoryImportance;
}
