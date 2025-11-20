import { eq, sql } from "drizzle-orm";
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
        updatedAt: sql`now()`,
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
    firstMessageSentAt?: Date;
  },
) {
  const usage = await getProjectMessageUsage(db, projectId);

  if (usage) {
    const [updated] = await db
      .update(schema.projectMessageUsage)
      .set({
        ...data,
        updatedAt: sql`now()`,
        firstMessageSentAt: data.firstMessageSentAt ?? usage.firstMessageSentAt,
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

export async function hasUserReceivedFirstMessageEmail(
  db: HydraDb,
  userId: string,
): Promise<boolean> {
  // Get all projects for the user
  const userProjects = await db.query.projectMembers.findMany({
    where: eq(schema.projectMembers.userId, userId),
    with: {
      project: true,
    },
  });

  // Check if any of their projects have firstMessageSentAt set
  for (const membership of userProjects) {
    const usage = await getProjectMessageUsage(db, membership.project.id);

    if (usage && usage.firstMessageSentAt) {
      return true;
    }
  }

  return false;
}
