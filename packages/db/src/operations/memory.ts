import type { MemoryCategory, MemoryImportance } from "@tambo-ai-cloud/core";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import * as schema from "../schema";
import type { DBMemory } from "../schema";
import type { HydraDb } from "../types";

/**
 * Fetch active (non-deleted) memories for a (projectId, contextKey) pair.
 * Ordered by importance DESC, then createdAt DESC (most important + recent first).
 * @returns Array of active memories.
 */
export async function getActiveMemories(
  db: HydraDb,
  projectId: string,
  contextKey: string,
  limit: number = 50,
): Promise<DBMemory[]> {
  return await db.query.memories.findMany({
    where: and(
      eq(schema.memories.projectId, projectId),
      eq(schema.memories.contextKey, contextKey),
      isNull(schema.memories.deletedAt),
    ),
    orderBy: [
      desc(schema.memories.importance),
      desc(schema.memories.createdAt),
    ],
    limit,
  });
}

/**
 * Create a new memory.
 * @returns The created memory row.
 */
export async function createMemory(
  db: HydraDb,
  params: {
    projectId: string;
    contextKey: string;
    content: string;
    category: MemoryCategory;
    importance?: MemoryImportance;
  },
): Promise<DBMemory> {
  const [memory] = await db
    .insert(schema.memories)
    .values({
      projectId: params.projectId,
      contextKey: params.contextKey,
      content: params.content,
      category: params.category,
      importance: params.importance ?? 3,
    })
    .returning();
  if (!memory) {
    throw new Error("Failed to create memory");
  }
  return memory;
}

/**
 * Batch-create multiple memories in a single insert.
 * @returns The created memory rows.
 */
export async function createMemories(
  db: HydraDb,
  rows: {
    projectId: string;
    contextKey: string;
    content: string;
    category: MemoryCategory;
    importance?: MemoryImportance;
  }[],
): Promise<DBMemory[]> {
  if (rows.length === 0) {
    return [];
  }
  return await db
    .insert(schema.memories)
    .values(
      rows.map((r) => ({
        projectId: r.projectId,
        contextKey: r.contextKey,
        content: r.content,
        category: r.category,
        importance: r.importance ?? 3,
      })),
    )
    .returning();
}

/**
 * Soft-delete a memory by setting deletedAt. Scoped to projectId + contextKey for auth safety.
 * Content is scrubbed to "[deleted]" for GDPR compliance.
 * @returns The updated memory, or undefined if not found.
 */
export async function softDeleteMemory(
  db: HydraDb,
  projectId: string,
  memoryId: string,
  contextKey: string,
): Promise<DBMemory | undefined> {
  const [updated] = await db
    .update(schema.memories)
    .set({
      content: "[deleted]",
      deletedAt: sql`now()`,
      updatedAt: sql`now()`,
    })
    .where(
      and(
        eq(schema.memories.id, memoryId),
        eq(schema.memories.projectId, projectId),
        eq(schema.memories.contextKey, contextKey),
        isNull(schema.memories.deletedAt),
      ),
    )
    .returning();
  return updated;
}

/**
 * Soft-delete ALL active memories for a (projectId, contextKey) pair.
 * This is the "forget me" operation for GDPR compliance.
 * @returns The number of memories soft-deleted.
 */
export async function softDeleteAllMemoriesForContextKey(
  db: HydraDb,
  projectId: string,
  contextKey: string,
): Promise<number> {
  const result = await db
    .update(schema.memories)
    .set({
      content: "[deleted]",
      deletedAt: sql`now()`,
      updatedAt: sql`now()`,
    })
    .where(
      and(
        eq(schema.memories.projectId, projectId),
        eq(schema.memories.contextKey, contextKey),
        isNull(schema.memories.deletedAt),
      ),
    )
    .returning();
  return result.length;
}

/**
 * Soft-delete the oldest, lowest-importance active memories that exceed the cap.
 * Keeps the top `cap` memories by importance DESC, createdAt DESC.
 * @returns The number of memories evicted.
 */
export async function evictExcessMemories(
  db: HydraDb,
  projectId: string,
  contextKey: string,
  cap: number = 200,
): Promise<number> {
  // Single SQL: soft-delete all active memories NOT in the top `cap` by importance/recency
  const result = await db
    .update(schema.memories)
    .set({
      deletedAt: sql`now()`,
      updatedAt: sql`now()`,
    })
    .where(
      and(
        eq(schema.memories.projectId, projectId),
        eq(schema.memories.contextKey, contextKey),
        isNull(schema.memories.deletedAt),
        sql`${schema.memories.id} NOT IN (
          SELECT id FROM memories
          WHERE project_id = ${projectId}
            AND context_key = ${contextKey}
            AND deleted_at IS NULL
          ORDER BY importance DESC, created_at DESC
          LIMIT ${cap}
        )`,
      ),
    )
    .returning({ id: schema.memories.id });
  return result.length;
}
