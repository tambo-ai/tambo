import { Inject, Injectable, Logger } from "@nestjs/common";
import * as Sentry from "@sentry/nestjs";
import type { ThreadMessage } from "@tambo-ai-cloud/core";
import {
  type ITamboBackend,
  callMemoryExtractionLLM,
} from "@tambo-ai-cloud/backend";
import { type HydraDatabase, operations } from "@tambo-ai-cloud/db";
import { DATABASE } from "../common/database-provider";
import { memoryExtractionResponseSchema } from "./memory-extraction-schema";

/** Maximum number of recent message pairs to send for extraction */
const MAX_EXTRACTION_MESSAGES = 20; // 10 pairs of user+assistant

/** Hard cap on active memories per (projectId, contextKey) */
const MEMORY_CAP = 200;

@Injectable()
export class MemoryExtractionService {
  private readonly logger = new Logger(MemoryExtractionService.name);

  constructor(
    @Inject(DATABASE)
    private readonly db: HydraDatabase,
  ) {}

  /**
   * Extract and save memories from a completed run's conversation.
   * Intended to be called fire-and-forget after run completion.
   * Handles its own errors — never throws to the caller.
   */
  async extractAndSaveMemories(
    projectId: string,
    contextKey: string,
    messages: ThreadMessage[],
    tamboBackend: ITamboBackend,
  ): Promise<void> {
    const logKey = `${projectId}:${contextKey}`;

    try {
      // Take only recent messages for extraction
      const recentMessages = messages.slice(-MAX_EXTRACTION_MESSAGES);

      // Call the LLM for extraction
      const rawResponse = await callMemoryExtractionLLM(
        tamboBackend.llmClient,
        recentMessages,
      );

      if (!rawResponse) {
        this.logger.warn(`Memory extraction returned no content for ${logKey}`);
        return;
      }

      // Parse JSON from LLM response (may be wrapped in markdown code blocks)
      const jsonStr = extractJsonFromResponse(rawResponse);
      if (!jsonStr) {
        this.logger.warn(
          `Memory extraction returned unparseable response for ${logKey}`,
        );
        return;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        this.logger.warn(
          `Memory extraction returned invalid JSON for ${logKey}`,
        );
        return;
      }

      // Validate with Zod
      const result = memoryExtractionResponseSchema.safeParse(parsed);
      if (!result.success) {
        this.logger.warn(
          `Memory extraction response failed validation for ${logKey}: ${result.error.message}`,
        );
        return;
      }

      const { memories: extractedMemories } = result.data;
      if (extractedMemories.length === 0) {
        return;
      }

      // Wrap read-dedup-insert-evict in a transaction for consistency
      await this.db.transaction(async (tx) => {
        // Dedup: load existing memories and skip exact matches
        const existingMemories = await operations.getActiveMemories(
          tx,
          projectId,
          contextKey,
          MEMORY_CAP,
        );
        const existingContentLower = new Set(
          existingMemories.map((m) => m.content.toLowerCase()),
        );

        // Filter out duplicates, deduping within the batch as well
        const newMemories = extractedMemories.filter((extracted) => {
          const lower = extracted.content.toLowerCase();
          if (existingContentLower.has(lower)) {
            return false;
          }
          existingContentLower.add(lower);
          return true;
        });

        if (newMemories.length > 0) {
          await operations.createMemories(
            tx,
            newMemories.map((m) => ({
              projectId,
              contextKey,
              content: m.content,
              category: m.category,
              importance: m.importance,
            })),
          );
          this.logger.log(
            `Extracted ${newMemories.length} new memories for ${logKey}`,
          );
        }

        // Enforce cap: evict excess if over limit
        await operations.evictExcessMemories(
          tx,
          projectId,
          contextKey,
          MEMORY_CAP,
        );
      });
    } catch (error: unknown) {
      Sentry.captureException(error);
      this.logger.error(
        `Memory extraction failed for ${logKey}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

/**
 * Extract JSON from an LLM response that may be wrapped in markdown code blocks.
 */
function extractJsonFromResponse(raw: string): string | undefined {
  // Try to find JSON in a code block
  const codeBlockMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  // Try to find a JSON object directly.
  // Uses a greedy match (not lazy) to capture from the first `{` to the last `}`.
  // This is intentional: lazy matching would stop at the first `}`, breaking
  // valid nested JSON like `{"a": {"b": 1}}`. The greedy approach correctly
  // captures the full object. If trailing text contains extra curlies, the
  // subsequent JSON.parse will reject the invalid match.
  const objectMatch = raw.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    return objectMatch[0];
  }
  return undefined;
}
