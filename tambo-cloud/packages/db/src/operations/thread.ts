import { and, eq, isNull } from "drizzle-orm";
import * as schema from "../schema";
import type { HydraDb } from "../types";

export type ThreadMetadata = Record<string, unknown>;
export type MessageContent = string | Record<string, unknown>;
export type MessageMetadata = Record<string, unknown>;
export async function createThread(
  db: HydraDb,
  {
    projectId,
    contextKey,
    metadata,
  }: {
    projectId: string;
    contextKey?: string;
    metadata?: ThreadMetadata;
  },
) {
  const [thread] = await db
    .insert(schema.threads)
    .values({
      projectId,
      contextKey,
      metadata,
    })
    .returning();

  return thread;
}

export async function getThreadForProjectId(
  db: HydraDb,
  threadId: string,
  projectId: string,
  includeInternal: boolean = false,
) {
  return await db.query.threads.findFirst({
    where: and(
      eq(schema.threads.id, threadId),
      eq(schema.threads.projectId, projectId),
    ),
    with: {
      messages: {
        where: includeInternal ? undefined : isNull(schema.messages.actionType),
        orderBy: (messages, { asc }) => [asc(messages.createdAt)],
        with: {
          suggestions: true,
        },
      },
    },
  });
}

export async function getThreadForUserId(
  db: HydraDb,
  threadId: string,
  userId: string,
) {
  return await db.query.threads.findFirst({
    where: (threads, { eq, inArray }) =>
      and(
        eq(threads.id, threadId),
        inArray(
          threads.projectId,
          db
            .select({ id: schema.projectMembers.projectId })
            .from(schema.projectMembers)
            .where(eq(schema.projectMembers.userId, userId)),
        ),
      ),
    with: {
      messages: {
        orderBy: (messages, { asc }) => [asc(messages.createdAt)],
      },
    },
  });
}

export async function getThreadsByProject(
  db: HydraDb,
  projectId: string,
  { contextKey }: { contextKey?: string } = {},
) {
  return await db.query.threads.findMany({
    where: contextKey
      ? and(
          eq(schema.threads.projectId, projectId),
          eq(schema.threads.contextKey, contextKey),
        )
      : eq(schema.threads.projectId, projectId),
    with: {
      messages: true,
    },
    orderBy: (threads, { desc }) => [desc(threads.createdAt)],
  });
}

export async function updateThread(
  db: HydraDb,
  threadId: string,
  {
    contextKey,
    metadata,
  }: {
    contextKey?: string | null;
    metadata?: ThreadMetadata;
  },
) {
  const [updated] = await db
    .update(schema.threads)
    .set({
      contextKey,
      metadata,
      updatedAt: new Date(),
    })
    .where(eq(schema.threads.id, threadId))
    .returning();

  return updated;
}

export async function deleteThread(db: HydraDb, threadId: string) {
  return await db.transaction(async (tx) => {
    // Delete all messages in the thread
    await tx
      .delete(schema.messages)
      .where(eq(schema.messages.threadId, threadId));

    // Delete the thread
    const [deleted] = await tx
      .delete(schema.threads)
      .where(eq(schema.threads.id, threadId))
      .returning();

    return deleted;
  });
}

export async function addMessage(
  db: HydraDb,
  messageInput: typeof schema.messages.$inferInsert,
): Promise<typeof schema.messages.$inferSelect> {
  const [message] = await db
    .insert(schema.messages)
    .values(messageInput)
    .returning();

  // Update the thread's updatedAt timestamp
  await db
    .update(schema.threads)
    .set({ updatedAt: new Date() })
    .where(eq(schema.threads.id, message.threadId));

  return message;
}

export async function getMessages(
  db: HydraDb,
  threadId: string,
  includeInternal: boolean = false,
): Promise<(typeof schema.messages.$inferSelect)[]> {
  return await db.query.messages.findMany({
    where: includeInternal
      ? eq(schema.messages.threadId, threadId)
      : and(
          eq(schema.messages.threadId, threadId),
          isNull(schema.messages.actionType),
        ),
    orderBy: (messages, { asc }) => [asc(messages.createdAt)],
  });
}

export async function updateMessage(
  db: HydraDb,
  messageId: string,
  messageInput: Partial<
    Omit<typeof schema.messages.$inferInsert, "id" | "createdAt" | "threadId">
  >,
): Promise<typeof schema.messages.$inferSelect> {
  const [updatedMessage] = await db
    .update(schema.messages)
    .set(messageInput)
    .where(eq(schema.messages.id, messageId))
    .returning();

  // Update the thread's updatedAt timestamp
  await db
    .update(schema.threads)
    .set({ updatedAt: new Date() })
    .where(eq(schema.threads.id, updatedMessage.threadId));

  return updatedMessage;
}

export async function deleteMessage(
  db: HydraDb,
  messageId: string,
): Promise<typeof schema.messages.$inferSelect> {
  const [deleted] = await db
    .delete(schema.messages)
    .where(eq(schema.messages.id, messageId))
    .returning();

  return deleted;
}

/**
 * Ensures that the thread exists and belongs to the project
 */
export async function ensureThreadByProjectId(
  db: HydraDb,
  threadId: string,
  projectId: string,
) {
  const thread = await getThreadForProjectId(db, threadId, projectId);
  if (!thread) {
    throw new Error("Thread not found");
  }
}
