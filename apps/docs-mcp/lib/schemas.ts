/**
 * @fileoverview Zod schemas for MCP server validation
 * @module mcp/schemas
 */

import { z } from "zod/v3";

/**
 * Schema for validating RAG document structure
 * @see {@link RAGDocument}
 */
export const InkeepRAGDocumentSchema = z
  .object({
    type: z.string(),
    source: z.record(z.any()),
    title: z.string().nullish(),
    context: z.string().nullish(),
    record_type: z.string().nullish(),
    url: z.string().nullish(),
  })
  .passthrough();

/**
 * Schema for validating RAG API response
 * @see {@link RAGResponse}
 */
export const InkeepRAGResponseSchema = z
  .object({
    content: z.array(InkeepRAGDocumentSchema),
  })
  .passthrough();

/**
 * Schema for Q&A tool parameters
 */
export const QAToolParamsSchema = z.object({
  question: z.string().describe("Question about the product"),
});

/**
 * Schema for RAG search tool parameters
 */
export const RAGToolParamsSchema = z.object({
  query: z.string().describe("The search query to find relevant documentation"),
});
