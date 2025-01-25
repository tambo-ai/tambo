import type { ComponentDecision } from "@use-hydra-ai/hydra-ai-server";
import { and, eq } from "drizzle-orm";
import { MessageRole } from "../MessageRole";
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

export async function getThread(db: HydraDb, threadId: string) {
  return db.query.threads.findFirst({
    where: eq(schema.threads.id, threadId),
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
  return db.query.threads.findMany({
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
  {
    threadId,
    role,
    content,
    component,
    metadata,
  }: {
    threadId: string;
    role: MessageRole;
    content: MessageContent;
    component?: ComponentDecision;
    metadata?: MessageMetadata;
  },
) {
  const [message] = await db
    .insert(schema.messages)
    .values({
      threadId,
      role,
      content,
      metadata,
      componentDecision: component,
    })
    .returning();

  // Update the thread's updatedAt timestamp
  await db
    .update(schema.threads)
    .set({ updatedAt: new Date() })
    .where(eq(schema.threads.id, threadId));

  return message;
}

export async function getMessages(db: HydraDb, threadId: string) {
  return db.query.messages.findMany({
    where: eq(schema.messages.threadId, threadId),
    orderBy: (messages, { asc }) => [asc(messages.createdAt)],
  });
}

export async function deleteMessage(db: HydraDb, messageId: string) {
  const [deleted] = await db
    .delete(schema.messages)
    .where(eq(schema.messages.id, messageId))
    .returning();

  return deleted;
}
