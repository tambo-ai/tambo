import type { MemoryCategory, MemoryImportance } from "@tambo-ai-cloud/core";
import { and, count, desc, eq, isNull, sql } from "drizzle-orm";
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
  return memory;
}

/**
 * Soft-delete a memory by setting deletedAt. Scoped to projectId for auth safety.
 * @returns The updated memory, or undefined if not found.
 */
export async function softDeleteMemory(
  db: HydraDb,
  projectId: string,
  memoryId: string,
): Promise<DBMemory | undefined> {
  const [updated] = await db
    .update(schema.memories)
    .set({
      deletedAt: sql`now()`,
      updatedAt: sql`now()`,
    })
    .where(
      and(
        eq(schema.memories.id, memoryId),
        eq(schema.memories.projectId, projectId),
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
 * Supersede an existing memory with a new one, in a single transaction.
 * Reads the existing memory to derive projectId + contextKey (prevents mismatched scoping).
 * Sets deletedAt + supersededBy on the old memory, creates the new one.
 * @returns The newly created memory.
 */
export async function supersedeMemory(
  db: HydraDb,
  params: {
    existingId: string;
    newContent: string;
    newCategory: MemoryCategory;
    newImportance?: MemoryImportance;
  },
): Promise<DBMemory> {
  // Must run in a transaction to prevent orphaned duplicates on partial failure
  const dbWithTx = db as import("../types").HydraDatabase;
  return await dbWithTx.transaction(async (tx) => {
    // Look up the existing memory to derive scoping fields
    const existing = await tx.query.memories.findFirst({
      where: and(
        eq(schema.memories.id, params.existingId),
        isNull(schema.memories.deletedAt),
      ),
    });

    if (!existing) {
      throw new Error(
        `Memory ${params.existingId} not found or already deleted`,
      );
    }

    // Create the replacement memory
    const [newMemory] = await tx
      .insert(schema.memories)
      .values({
        projectId: existing.projectId,
        contextKey: existing.contextKey,
        content: params.newContent,
        category: params.newCategory,
        importance: params.newImportance ?? 3,
      })
      .returning();

    // Mark the old memory as superseded (re-check deletedAt for TOCTOU safety)
    await tx
      .update(schema.memories)
      .set({
        deletedAt: sql`now()`,
        supersededBy: newMemory.id,
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(schema.memories.id, params.existingId),
          isNull(schema.memories.deletedAt),
        ),
      );

    return newMemory;
  });
}

/**
 * Count active (non-deleted) memories for a (projectId, contextKey) pair.
 * Used for cap enforcement.
 * @returns The count of active memories.
 */
export async function getActiveMemoryCount(
  db: HydraDb,
  projectId: string,
  contextKey: string,
): Promise<number> {
  const [result] = await db
    .select({ value: count() })
    .from(schema.memories)
    .where(
      and(
        eq(schema.memories.projectId, projectId),
        eq(schema.memories.contextKey, contextKey),
        isNull(schema.memories.deletedAt),
      ),
    );
  return result.value;
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
