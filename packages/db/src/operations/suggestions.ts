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
