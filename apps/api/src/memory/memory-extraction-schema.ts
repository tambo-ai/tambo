import { MEMORY_CATEGORIES } from "@tambo-ai-cloud/core";
import { z } from "zod/v3";

const extractedMemorySchema = z.object({
  content: z.string().min(1).max(1000),
  category: z.enum(MEMORY_CATEGORIES),
  importance: z.number().int().min(1).max(5).default(3),
});

export const memoryExtractionResponseSchema = z.object({
  memories: z.array(extractedMemorySchema),
});

export type MemoryExtractionResponse = z.infer<
  typeof memoryExtractionResponseSchema
>;
