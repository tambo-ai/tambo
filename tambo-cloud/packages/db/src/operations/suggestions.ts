import { eq } from "drizzle-orm";
import type { HydraDatabase } from "..";
import { suggestions } from "../schema";

export async function getSuggestions(db: HydraDatabase, messageId: string) {
  return await db.query.suggestions.findMany({
    where: eq(suggestions.messageId, messageId),
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
