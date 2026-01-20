import {
  ComponentDecisionV2,
  GenerationStage,
  MessageRole,
  UnsavedThreadMessage,
  assertUnreachable,
  validateUnsavedThreadMessage,
} from "@tambo-ai-cloud/core";
import {
  and,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  not,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { type SubqueryWithSelection } from "drizzle-orm/pg-core";
import { mergeSuperJson } from "../drizzleUtil";
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
    name,
  }: {
    projectId: string;
    contextKey?: string;
    metadata?: ThreadMetadata;
    name?: string;
  },
) {
  const [thread] = await db
    .insert(schema.threads)
    .values({
      projectId,
      contextKey,
      metadata,
      name,
    })
    .returning();

  return thread;
}

export async function getThreadGenerationStage(
  db: HydraDb,
  threadId: string,
  projectId: string,
  contextKey?: string,
) {
  const thread = await db.query.threads.findFirst({
    where: contextKey
      ? and(
          eq(schema.threads.id, threadId),
          eq(schema.threads.projectId, projectId),
          eq(schema.threads.contextKey, contextKey),
        )
      : and(
          eq(schema.threads.id, threadId),
          eq(schema.threads.projectId, projectId),
        ),
    columns: {
      generationStage: true,
    },
  });

  return thread?.generationStage;
}

export async function getThreadForProjectId(
  db: HydraDb,
  threadId: string,
  projectId: string,
  contextKey?: string,
  includeSystem: boolean = true,
): Promise<schema.DBThreadWithMessages | undefined> {
  return await db.query.threads.findFirst({
    where: contextKey
      ? and(
          eq(schema.threads.id, threadId),
          eq(schema.threads.projectId, projectId),
          eq(schema.threads.contextKey, contextKey),
        )
      : and(
          eq(schema.threads.id, threadId),
          eq(schema.threads.projectId, projectId),
        ),
    with: {
      messages: {
        where: includeSystem
          ? undefined
          : not(eq(schema.messages.role, MessageRole.System)),
        orderBy: (messages, { asc }) => [asc(messages.createdAt)],
        with: {
          suggestions: true,
        },
      },
    },
  });
}

export async function getThreadsByProject(
  db: HydraDb,
  projectId: string,
  {
    contextKey,
    offset = 0,
    limit = 10,
    includeMessages = true,
  }: {
    contextKey?: string;
    offset?: number;
    limit?: number;
    includeMessages?: boolean;
  } = {},
) {
  return await db.query.threads.findMany({
    where: contextKey
      ? and(
          eq(schema.threads.projectId, projectId),
          eq(schema.threads.contextKey, contextKey),
        )
      : eq(schema.threads.projectId, projectId),
    with: includeMessages
      ? {
          messages: true,
        }
      : undefined,
    orderBy: (threads, { desc }) => [desc(threads.createdAt)],
    offset,
    limit,
  });
}
export async function countThreadsByProject(
  db: HydraDb,
  projectId: string,
  { contextKey }: { contextKey?: string } = {},
) {
  return await db.$count(
    schema.threads,
    contextKey
      ? eq(schema.threads.contextKey, contextKey)
      : eq(schema.threads.projectId, projectId),
  );
}

export async function updateThread(
  db: HydraDb,
  threadId: string,
  {
    contextKey,
    metadata,
    generationStage,
    statusMessage,
    name,
  }: {
    contextKey?: string | null;
    metadata?: ThreadMetadata;
    generationStage?: GenerationStage;
    statusMessage?: string;
    name?: string;
  },
): Promise<schema.DBThreadWithMessages> {
  const [updated] = await db
    .update(schema.threads)
    .set({
      contextKey,
      metadata,
      updatedAt: sql`now()`,
      generationStage,
      statusMessage,
      name,
    })
    .where(eq(schema.threads.id, threadId))
    .returning();

  const messages = await db.query.messages.findMany({
    where: eq(schema.messages.threadId, threadId),
  });
  return {
    ...updated,
    messages: messages.map((msg) => ({
      ...msg,
      suggestions: [],
    })),
  };
}

export async function deleteThread(db: HydraDb, threadId: string) {
  return await db.transaction(async (tx) => {
    // First, get all message IDs for this thread
    const threadMessages = await tx.query.messages.findMany({
      where: eq(schema.messages.threadId, threadId),
      columns: { id: true },
    });

    const messageIds = threadMessages.map((msg) => msg.id);

    // Delete all suggestions for messages in this thread
    if (messageIds.length > 0) {
      await tx
        .delete(schema.suggestions)
        .where(inArray(schema.suggestions.messageId, messageIds));
    }

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
  threadId: string,
  messageInput: UnsavedThreadMessage,
): Promise<typeof schema.messages.$inferSelect> {
  // TODO: Handle File types in message content
  // When File content parts are present:
  // 1. Extract large text/blob content (>100KB threshold)
  // 2. Upload to S3 with key: messages/{messageId}/files/{fileId}
  // 3. Replace content with S3 URI reference (s3://bucket/key)
  // 4. Store file metadata in a new 'message_files' table:
  //    - messageId, fileId, name, mimeType, size, s3Key, originalUri
  // 5. For external URIs: optionally fetch and cache in S3
  // 6. Update content part to reference S3 location for retrieval

  const insertable = buildUnsavedMessageInsert(threadId, messageInput);

  const [message] = await db
    .insert(schema.messages)
    .values(insertable)
    .returning();

  // Update the thread's updatedAt timestamp
  await db
    .update(schema.threads)
    .set({ updatedAt: sql`now()` })
    .where(eq(schema.threads.id, message.threadId));

  return message;
}

function buildUnsavedMessageInsert(
  threadId: string,
  unsavedMsg: UnsavedThreadMessage,
): typeof schema.messages.$inferInsert {
  const message = validateUnsavedThreadMessage(unsavedMsg);
  const componentDecision = message.component
    ? ({
        ...message.component,
        props: message.component.props ?? {},
      } satisfies ComponentDecisionV2)
    : undefined;

  return {
    threadId,
    role: message.role,
    content: message.content,
    parentMessageId: message.parentMessageId,
    componentDecision,
    componentState: message.componentState ?? {},
    additionalContext: message.additionalContext ?? {},
    error: message.error ?? undefined,
    metadata: message.metadata ?? undefined,
    isCancelled: message.isCancelled ?? false,
    actionType: message.actionType ?? undefined,
    toolCallRequest: message.toolCallRequest ?? undefined,
    toolCallId: message.tool_call_id ?? undefined,
    reasoning: message.reasoning ?? undefined,
    reasoningDurationMS: message.reasoningDurationMS ?? undefined,
  };
}

export async function getMessages(
  db: HydraDb,
  threadId: string,
  includeChildMessages: boolean = false,
  includeSystem: boolean = false,
): Promise<(typeof schema.messages.$inferSelect)[]> {
  const where = and(
    eq(schema.messages.threadId, threadId),
    includeChildMessages ? undefined : isNull(schema.messages.parentMessageId),
    includeSystem
      ? undefined
      : not(eq(schema.messages.role, MessageRole.System)),
  );

  const messages = await db.query.messages.findMany({
    where,
    orderBy: (messages, { asc }) => [asc(messages.createdAt)],
  });
  return messages;
}

export async function getLatestMessage(
  db: HydraDb,
  threadId: string,
): Promise<typeof schema.messages.$inferSelect> {
  const [latestMessage] = await db
    .select()
    .from(schema.messages)
    .where(eq(schema.messages.threadId, threadId))
    .orderBy(desc(schema.messages.createdAt))
    .limit(1);
  return latestMessage;
}

export async function updateMessage(
  db: HydraDb,
  messageId: string,
  messageInput: Partial<
    Omit<typeof schema.messages.$inferInsert, "id" | "createdAt" | "threadId">
  >,
): Promise<typeof schema.messages.$inferSelect> {
  // TODO: Handle File types in message content updates
  // When updating content with File parts:
  // 1. Compare old and new file references
  // 2. Upload new large files to S3
  // 3. Clean up orphaned S3 objects from replaced files
  // 4. Update message_files table entries
  // 5. Maintain referential integrity for file metadata

  const [updatedMessage] = await db
    .update(schema.messages)
    .set(messageInput)
    .where(eq(schema.messages.id, messageId))
    .returning();

  // Update the thread's updatedAt timestamp
  await db
    .update(schema.threads)
    .set({ updatedAt: sql`now()` })
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
export async function updateMessageComponentState(
  db: HydraDb,
  messageId: string,
  newPartialState: Record<string, unknown>,
): Promise<typeof schema.messages.$inferSelect> {
  const componentStateColumn = schema.messages.componentState;
  const [updatedMessage] = await db
    .update(schema.messages)
    .set({
      componentState: mergeSuperJson(componentStateColumn, newPartialState),
    })
    .where(eq(schema.messages.id, messageId))
    .returning();

  return updatedMessage;
}

/**
 * Ensures that the thread exists and belongs to the project
 */
export async function ensureThreadByProjectId(
  db: HydraDb,
  threadId: string,
  projectId: string,
  contextKey: string | undefined,
) {
  const thread = await getThreadForProjectId(
    db,
    threadId,
    projectId,
    contextKey,
  );
  if (!thread) {
    throw new Error("Thread not found");
  }
}

export async function updateThreadGenerationStatus(
  db: HydraDb,
  threadId: string,
  generationStage: GenerationStage,
  statusMessage?: string,
) {
  const [updated] = await db
    .update(schema.threads)
    .set({
      generationStage,
      statusMessage,
      updatedAt: sql`now()`,
    })
    .where(eq(schema.threads.id, threadId))
    .returning();

  return updated;
}

/**
 * Error thrown when a pending tool call clear fails.
 *
 * This is intentionally conservative: it conflates "thread not found" and
 * "pendingToolCallIds state mismatch" so callers can treat both as a conflict
 * without requiring a second query.
 *
 * This error intentionally does not distinguish between a missing thread and a
 * `pendingToolCallIds` mismatch. If you need to debug which case occurred, add
 * explicit logging or follow-up queries at the call site.
 */
export class PendingToolCallStateMismatchError extends Error {
  constructor(threadId: string) {
    super(
      `Failed to clear pending tool calls: Thread ${threadId} not found or pendingToolCallIds state mismatch`,
    );
    this.name = "PendingToolCallStateMismatchError";
  }
}

export class InvalidPendingToolCallExpectationError extends Error {
  constructor() {
    super(
      "clearPendingToolCalls expected null or a non-empty array; got empty array. Use null when there are no pending tool calls.",
    );
    this.name = "InvalidPendingToolCallExpectationError";
  }
}

/**
 * Clear pending tool call IDs from a thread, but only if its `pendingToolCallIds` matches the expected value.
 * Used when tool results have been processed and the thread can continue.
 *
 * This always enforces an optimistic concurrency check on `pendingToolCallIds`.
 * Callers must pass the expected state; there is intentionally no unguarded variant.
 * Callers should pass the expected state from the thread snapshot used to derive the tool results being cleared.
 * Do not synthesize or default this value.
 * An empty array is almost certainly a bug; use `null` when there are no pending tool calls.
 * Callers should handle `PendingToolCallStateMismatchError` as a concurrency conflict.
 *
 * @param db - Database connection (can be a transaction)
 * @param threadId - Thread to update
 * @param expectedPendingToolCallIds - Optimistic concurrency guard; fails if stored pendingToolCallIds do not match (including null)
 * @throws PendingToolCallStateMismatchError if no row was updated, either because the thread does not exist or its pendingToolCallIds no longer match the expected value
 */
export async function clearPendingToolCalls(
  db: HydraDb,
  threadId: string,
  expectedPendingToolCallIds: string[] | null,
): Promise<void> {
  if (expectedPendingToolCallIds?.length === 0) {
    throw new InvalidPendingToolCallExpectationError();
  }

  const whereConditions = [eq(schema.threads.id, threadId)];

  if (expectedPendingToolCallIds === null) {
    whereConditions.push(isNull(schema.threads.pendingToolCallIds));
  } else {
    whereConditions.push(
      eq(schema.threads.pendingToolCallIds, expectedPendingToolCallIds),
    );
  }

  const [updated] = await db
    .update(schema.threads)
    .set({
      pendingToolCallIds: null,
      updatedAt: sql`now()`,
    })
    .where(and(...whereConditions))
    .returning({ id: schema.threads.id });

  if (!updated) {
    throw new PendingToolCallStateMismatchError(threadId);
  }
}

type SortFieldKeys =
  | "contextKey"
  | "threadId"
  | "created"
  | "updated"
  | "threadName"
  | "messages"
  | "errors";

export async function getThreadsByProjectWithCounts(
  db: HydraDb,
  projectId: string,
  contextKey?: string,
  {
    offset = 0,
    limit = 5,
  }: {
    offset?: number;
    limit?: number;
  } = {},
  {
    searchQuery,
    sortField = "created",
    sortDirection = "desc",
  }: {
    searchQuery?: string;
    sortField?: SortFieldKeys;
    sortDirection?: "asc" | "desc";
  } = {},
) {
  // Build where conditions
  const whereConditions = [eq(schema.threads.projectId, projectId)];

  if (contextKey) {
    whereConditions.push(eq(schema.threads.contextKey, contextKey));
  }

  // Add search conditions
  if (searchQuery && searchQuery.trim()) {
    const trimmedQuery = searchQuery.trim();

    const searchConditions = [
      eq(schema.threads.id, trimmedQuery),
      eq(schema.threads.contextKey, trimmedQuery),
      ilike(schema.threads.name, `%${trimmedQuery}%`),
    ].filter(Boolean);

    if (searchConditions.length > 0) {
      const orCondition = or(...searchConditions);
      if (orCondition) {
        whereConditions.push(orCondition);
      }
    }
  }

  // sorting by counts
  if (sortField === "messages" || sortField === "errors") {
    // Create a subquery for counts
    const countsSubquery = db
      .select({
        threadId: schema.messages.threadId,
        messageCount: count(schema.messages.id).as("messageCount"),
        errorCount: count(
          sql`CASE WHEN ${schema.messages.error} IS NOT NULL THEN 1 END`,
        ).as("errorCount"),
      })
      .from(schema.messages)
      .groupBy(schema.messages.threadId)
      .as("counts");

    // Build the main query with join
    const countsField = getCountsField(sortField, countsSubquery);
    const orderBy = sortDirection === "asc" ? countsField : desc(countsField);

    const threadsWithCounts = await db
      .select({
        id: schema.threads.id,
        projectId: schema.threads.projectId,
        contextKey: schema.threads.contextKey,
        metadata: schema.threads.metadata,
        createdAt: schema.threads.createdAt,
        updatedAt: schema.threads.updatedAt,
        generationStage: schema.threads.generationStage,
        statusMessage: schema.threads.statusMessage,
        name: schema.threads.name,
        messageCount: sql`COALESCE(${countsSubquery.messageCount}, 0)`.as(
          "messageCount",
        ),
        errorCount: sql`COALESCE(${countsSubquery.errorCount}, 0)`.as(
          "errorCount",
        ),
      })
      .from(schema.threads)
      .leftJoin(countsSubquery, eq(schema.threads.id, countsSubquery.threadId))
      .where(and(...whereConditions))
      .orderBy(orderBy)
      .offset(offset)
      .limit(limit);

    return threadsWithCounts.map((thread) => ({
      ...thread,
      messageCount: Number(thread.messageCount),
      errorCount: Number(thread.errorCount),
    }));
  }

  const orderedField = getFieldFromSort(sortField);
  // non-count sorting
  const orderBy = sortDirection === "asc" ? orderedField : desc(orderedField);

  // Get threads without messages
  const threads = await db.query.threads.findMany({
    where: and(...whereConditions),
    orderBy: [orderBy],
    offset,
    limit,
  });

  if (threads.length === 0) {
    return [];
  }

  // Get all counts in a single query using SQL aggregation
  const threadIds = threads.map((t) => t.id);
  const counts = await db
    .select({
      threadId: schema.messages.threadId,
      messageCount: count(schema.messages.id).as("messageCount"),
      errorCount: count(
        sql`CASE WHEN ${schema.messages.error} IS NOT NULL THEN 1 END`,
      ).as("errorCount"),
    })
    .from(schema.messages)
    .where(inArray(schema.messages.threadId, threadIds))
    .groupBy(schema.messages.threadId);

  // Create a map for quick lookup
  const countsMap = new Map(
    counts.map((c) => [
      c.threadId,
      {
        messageCount: Number(c.messageCount),
        errorCount: Number(c.errorCount),
      },
    ]),
  );

  // Combine threads with their counts
  return threads.map((thread) => ({
    ...thread,
    messageCount: countsMap.get(thread.id)?.messageCount || 0,
    errorCount: countsMap.get(thread.id)?.errorCount || 0,
  }));
}

function getFieldFromSort(sortField: SortFieldKeys) {
  switch (sortField) {
    case "created":
      return schema.threads.createdAt;
    case "updated":
      return schema.threads.updatedAt;
    case "threadId":
      return schema.threads.id;
    case "threadName":
      return schema.threads.name;
    case "contextKey":
      return schema.threads.contextKey;
    case "errors":
    case "messages":
      // should never happen because we handle these separately
      return schema.threads.createdAt;
    default:
      assertUnreachable(sortField);
  }
}

function getCountsField(
  sortField: "messages" | "errors",
  countsSubquery: SubqueryWithSelection<
    {
      messageCount: SQL.Aliased<number>;
      errorCount: SQL.Aliased<number>;
    },
    "counts"
  >,
) {
  switch (sortField) {
    case "messages":
      return countsSubquery.messageCount;
    case "errors":
      return countsSubquery.errorCount;
    default:
      assertUnreachable(sortField);
  }
}

export async function countThreadsByProjectWithSearch(
  db: HydraDb,
  projectId: string,
  {
    contextKey,
    searchQuery,
  }: {
    contextKey?: string;
    searchQuery?: string;
  } = {},
) {
  // Build where conditions
  const whereConditions = [eq(schema.threads.projectId, projectId)];

  if (contextKey) {
    whereConditions.push(eq(schema.threads.contextKey, contextKey));
  }

  // Add search conditions
  if (searchQuery && searchQuery.trim()) {
    const trimmedQuery = searchQuery.trim();

    const searchConditions = [
      eq(schema.threads.id, trimmedQuery),
      eq(schema.threads.contextKey, trimmedQuery),
      ilike(schema.threads.name, `%${trimmedQuery}%`),
    ].filter(Boolean);

    if (searchConditions.length > 0) {
      const orCondition = or(...searchConditions);
      if (orCondition) {
        whereConditions.push(orCondition);
      }
    }
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.threads)
    .where(and(...whereConditions));
  return count;
}

export async function getMcpThreadSession(
  db: HydraDb,
  threadId: string,
  toolProviderId: string,
) {
  return await db.query.mcpThreadSession.findFirst({
    where: and(
      eq(schema.mcpThreadSession.threadId, threadId),
      eq(schema.mcpThreadSession.toolProviderId, toolProviderId),
    ),
    columns: {
      sessionId: true,
    },
  });
}

export async function updateMcpThreadSession(
  db: HydraDb,
  threadId: string,
  toolProviderId: string,
  sessionId: string,
): Promise<void> {
  // upsert since we may already have an entry for the session
  await db
    .insert(schema.mcpThreadSession)
    .values({
      threadId,
      toolProviderId,
      sessionId,
      // Use DB time for consistency
      updatedAt: sql`now()`,
    })
    .onConflictDoUpdate({
      target: [
        schema.mcpThreadSession.threadId,
        schema.mcpThreadSession.toolProviderId,
      ],
      set: { sessionId, updatedAt: sql`now()` },
    });
}
