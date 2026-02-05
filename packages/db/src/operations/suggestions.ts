import { and, asc, eq, gt, or } from "drizzle-orm";
import type { HydraDatabase } from "..";
import { suggestions, type DBSuggestion } from "../schema";

/**
 * Cursor for paginated suggestion queries.
 */
export type SuggestionCursor = {
  createdAt: Date;
  id: string;
};

export async function getSuggestions(db: HydraDatabase, messageId: string) {
  return await db.query.suggestions.findMany({
    where: eq(suggestions.messageId, messageId),
  });
}

/**
 * List suggestions for a message with cursor-based pagination.
 *
 * Uses a compound cursor based on (createdAt, id) for stable pagination.
 *
 * IMPORTANT: This pagination assumes `createdAt` is always server-generated
 * via DEFAULT now() at the database layer and never user-supplied or backfilled.
 * Violating this invariant (e.g., inserting with older timestamps) will cause
 * records to be permanently skipped for clients who have already paged past
 * that cursor position.
 *
 * @param db - Database instance
 * @param messageId - Message ID to get suggestions for
 * @param options - Pagination options
 * @returns Paginated list of suggestions ordered by createdAt (oldest first)
 */
export async function listSuggestionsPaginated(
  db: HydraDatabase,
  messageId: string,
  {
    cursor,
    limit,
  }: {
    cursor?: SuggestionCursor;
    limit: number;
  },
): Promise<DBSuggestion[]> {
  const conditions = [eq(suggestions.messageId, messageId)];

  if (cursor) {
    // createdAt ascending, id ascending tiebreaker
    const cursorCondition = or(
      gt(suggestions.createdAt, cursor.createdAt),
      and(
        eq(suggestions.createdAt, cursor.createdAt),
        gt(suggestions.id, cursor.id),
      ),
    );
    if (cursorCondition) {
      conditions.push(cursorCondition);
    }
  }

  return await db.query.suggestions.findMany({
    where: and(...conditions),
    orderBy: [asc(suggestions.createdAt), asc(suggestions.id)],
    limit,
  });
}

export async function createSuggestion(
  db: HydraDatabase,
  data: {
    messageId: string;
    title: string;
    detailedSuggestion: string;
  },
) {
  const [suggestion] = await db
    .insert(suggestions)
    .values({
      messageId: data.messageId,
      title: data.title,
      detailedSuggestion: data.detailedSuggestion,
    })
    .returning();
  return suggestion;
}

export async function createSuggestions(
  db: HydraDatabase,
  data: Array<{
    messageId: string;
    title: string;
    detailedSuggestion: string;
  }>,
) {
  if (data.length === 0) {
    return [];
  }
  return await db
    .insert(suggestions)
    .values(
      data.map((item) => ({
        messageId: item.messageId,
        title: item.title,
        detailedSuggestion: item.detailedSuggestion,
      })),
    )
    .returning();
}

/**
 * Delete all suggestions for a message.
 * Used to implement replace-on-generate semantics.
 *
 * @param db - Database instance
 * @param messageId - Message ID to delete suggestions for
 * @returns Number of deleted suggestions
 */
export async function deleteSuggestionsForMessage(
  db: HydraDatabase,
  messageId: string,
): Promise<number> {
  const result = await db
    .delete(suggestions)
    .where(eq(suggestions.messageId, messageId));
  return result.rowCount ?? 0;
}
