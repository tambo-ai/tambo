import { MEMORY_CATEGORIES } from "@tambo-ai-cloud/core";
import { z } from "zod/v3";

/**
 * Shared Zod schema for memory importance (1-5 integer).
 * Produces a typed `MemoryImportance` value, avoiding `as` casts at call sites.
 */
export const memoryImportanceSchema = z
  .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)])
  .default(3);

/** Shared Zod schema for memory category. */
export const memoryCategorySchema = z.enum(MEMORY_CATEGORIES);

const extractedMemorySchema = z.object({
  content: z.string().min(1).max(1000),
  category: memoryCategorySchema,
  importance: memoryImportanceSchema,
});

export const memoryExtractionResponseSchema = z.object({
  memories: z.array(extractedMemorySchema),
});

export type MemoryExtractionResponse = z.infer<
  typeof memoryExtractionResponseSchema
>;
