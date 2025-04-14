import { eq } from "drizzle-orm";
import * as schema from "../schema";
import type { HydraDb } from "../types";

export async function getProjectMessageUsage(db: HydraDb, projectId: string) {
  return await db.query.projectMessageUsage.findFirst({
    where: eq(schema.projectMessageUsage.projectId, projectId),
  });
}

export async function incrementMessageCount(db: HydraDb, projectId: string) {
  const usage = await getProjectMessageUsage(db, projectId);

  if (usage) {
    const [updated] = await db
      .update(schema.projectMessageUsage)
      .set({
        messageCount: usage.messageCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(schema.projectMessageUsage.projectId, projectId))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(schema.projectMessageUsage)
    .values({
      projectId,
      messageCount: 1,
    })
    .returning();
  return created;
}

export async function updateProjectMessageUsage(
  db: HydraDb,
  projectId: string,
  data: {
    messageCount?: number;
    hasApiKey?: boolean;
    notificationSentAt?: Date;
  },
) {
  const usage = await getProjectMessageUsage(db, projectId);

  if (usage) {
    const [updated] = await db
      .update(schema.projectMessageUsage)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(schema.projectMessageUsage.projectId, projectId))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(schema.projectMessageUsage)
    .values({
      projectId,
      ...data,
    })
    .returning();
  return created;
}
