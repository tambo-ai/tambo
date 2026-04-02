import { Inject, Injectable, Logger } from "@nestjs/common";
import type { MemoryImportance, ThreadMessage } from "@tambo-ai-cloud/core";
import {
  type ITamboBackend,
  callMemoryExtractionLLM,
} from "@tambo-ai-cloud/backend";
import { type HydraDatabase, operations } from "@tambo-ai-cloud/db";
import { DATABASE } from "../common/database-provider";
import { memoryExtractionResponseSchema } from "./memory-extraction-schema";

/** Maximum number of recent message pairs to send for extraction */
const MAX_EXTRACTION_MESSAGES = 20; // 10 pairs of user+assistant

/** Minimum conversation length to bother extracting */
const MIN_MESSAGES_FOR_EXTRACTION = 4; // At least 2 exchanges

/** Hard cap on active memories per (projectId, contextKey) */
const MEMORY_CAP = 200;

// TODO: Replace this in-memory rate limiting with Redis or a DB-based approach
// as part of a larger rate-limiting effort. This Map doesn't survive restarts
// and doesn't work across multiple server instances.
const EXTRACTION_COOLDOWN_MS = 15_000;
const RATE_LIMIT_MAP_MAX_SIZE = 10_000;
const lastExtractionTimestamps = new Map<string, number>();

/**
 * Check if extraction is allowed for the given key and record the attempt.
 * Returns true if the extraction should proceed, false if rate-limited.
 * Encapsulates all knowledge of the in-memory rate limiting map.
 */
function shouldExtract(rateLimitKey: string): boolean {
  const lastExtraction = lastExtractionTimestamps.get(rateLimitKey);
  if (lastExtraction && Date.now() - lastExtraction < EXTRACTION_COOLDOWN_MS) {
    return false;
  }
  // Evict oldest half of entries if the map grows too large
  if (lastExtractionTimestamps.size >= RATE_LIMIT_MAP_MAX_SIZE) {
    const entries = [...lastExtractionTimestamps.entries()].sort(
      (a, b) => a[1] - b[1],
    );
    const deleteCount = Math.floor(entries.length / 2);
    for (let i = 0; i < deleteCount; i++) {
      lastExtractionTimestamps.delete(entries[i][0]);
    }
  }
  lastExtractionTimestamps.set(rateLimitKey, Date.now());
  return true;
}

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
    const rateLimitKey = `${projectId}:${contextKey}`;

    try {
      if (!shouldExtract(rateLimitKey)) {
        this.logger.debug(
          `Skipping extraction for ${rateLimitKey}: rate limited`,
        );
        return;
      }

      // Only extract from conversations with enough substance
      if (messages.length < MIN_MESSAGES_FOR_EXTRACTION) {
        return;
      }

      // Take only recent messages for extraction
      const recentMessages = messages.slice(-MAX_EXTRACTION_MESSAGES);

      // Call the LLM for extraction
      const rawResponse = await callMemoryExtractionLLM(
        tamboBackend.llmClient,
        recentMessages,
      );

      if (!rawResponse) {
        this.logger.warn(
          `Memory extraction returned no content for ${rateLimitKey}`,
        );
        return;
      }

      // Parse JSON from LLM response (may be wrapped in markdown code blocks)
      const jsonStr = extractJsonFromResponse(rawResponse);
      if (!jsonStr) {
        this.logger.warn(
          `Memory extraction returned unparseable response for ${rateLimitKey}`,
        );
        return;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        this.logger.warn(
          `Memory extraction returned invalid JSON for ${rateLimitKey}`,
        );
        return;
      }

      // Validate with Zod
      const result = memoryExtractionResponseSchema.safeParse(parsed);
      if (!result.success) {
        this.logger.warn(
          `Memory extraction response failed validation for ${rateLimitKey}: ${result.error.message}`,
        );
        return;
      }

      const { memories: extractedMemories } = result.data;
      if (extractedMemories.length === 0) {
        return;
      }

      // Dedup: load existing memories and skip exact matches
      const existingMemories = await operations.getActiveMemories(
        this.db,
        projectId,
        contextKey,
        MEMORY_CAP,
      );
      const existingContentLower = new Set(
        existingMemories.map((m) => m.content.toLowerCase()),
      );

      let insertedCount = 0;
      for (const extracted of extractedMemories) {
        if (existingContentLower.has(extracted.content.toLowerCase())) {
          continue;
        }

        await operations.createMemory(this.db, {
          projectId,
          contextKey,
          content: extracted.content,
          category: extracted.category,
          importance: extracted.importance as MemoryImportance,
        });
        insertedCount++;
        // Add to dedup set so subsequent memories in this batch don't duplicate
        existingContentLower.add(extracted.content.toLowerCase());
      }

      if (insertedCount > 0) {
        this.logger.log(
          `Extracted ${insertedCount} new memories for ${rateLimitKey}`,
        );
      }

      // Enforce cap: evict excess if over limit
      await operations.evictExcessMemories(
        this.db,
        projectId,
        contextKey,
        MEMORY_CAP,
      );
    } catch (error: unknown) {
      this.logger.error(
        `Memory extraction failed for ${rateLimitKey}: ${
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
  // Try to find a JSON object directly
  const objectMatch = raw.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    return objectMatch[0];
  }
  return undefined;
}
