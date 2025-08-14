import { ActionType } from "@tambo-ai-cloud/core";
import { and, eq } from "drizzle-orm";
import { schema } from "..";
import { messages, projectMembers } from "../schema";
import type { HydraDb } from "../types";
import { fixLegacyRole } from "../util/legacyMessages";

/**
 * Retrieves a message with its associated thread and project information.
 *
 * @param db - The Tambo database instance
 * @param messageId - The message ID to retrieve (format: msg_[8 random chars].[6 char signature])
 * @returns The message with its thread and project, or null if not found
 *
 * @example
 * // Valid message ID format
 * const messageId = 'msg_a1b2c3d4.abc123'
 * const message = await getMessageWithAccess(db, messageId)
 */
export async function getMessageWithAccess(
  db: HydraDb,
  messageId: string,
): Promise<schema.DBMessageWithThread | undefined> {
  const message = await db.query.messages.findFirst({
    where: eq(messages.id, messageId),
    with: {
      thread: {
        with: {
          project: true,
        },
      },
    },
  });
  if (!message) {
    // TODO: throw error?
    return message;
  }
  return fixLegacyRole([message])[0];
}

/**
 * Checks if a user has access to a message through project membership.
 * This is an optimized query that combines message retrieval and project access check
 * into a single database operation.
 *
 * @param db - The Tambo database instance
 * @param messageId - The message ID to check (format: msg_[8 random chars].[6 char signature])
 * @param userId - The user ID to check access for (UUID format)
 * @returns Object containing access status and project ID if access is granted
 *
 * @example
 * // Check access for a message
 * const { hasAccess, projectId } = await checkMessageProjectAccess(
 *   db,
 *   'msg_a1b2c3d4.abc123',
 *   '123e4567-e89b-12d3-a456-426614174000'
 * )
 *
 * @throws {Error} If the database query fails
 * @security This function is used for enforcing project-level access control
 */
export async function checkMessageProjectAccess(
  db: HydraDb,
  messageId: string,
  userId: string,
) {
  const result = await db.query.messages.findFirst({
    where: eq(messages.id, messageId),
    with: {
      thread: {
        with: {
          project: {
            with: {
              members: {
                where: eq(projectMembers.userId, userId),
              },
            },
          },
        },
      },
    },
  });

  if (!result?.thread.project) {
    return { hasAccess: false, projectId: null };
  }

  const hasAccess = result.thread.project.members.length > 0;
  return {
    hasAccess,
    projectId: hasAccess ? result.thread.project.id : null,
  };
}

/**
 * Find the previous tool call message with a matching tool call ID
 */
export async function findPreviousToolCallMessage(
  db: HydraDb,
  threadId: string,
  toolCallId: string,
): Promise<schema.DBMessage | undefined> {
  return await db.query.messages.findFirst({
    where: and(
      eq(schema.messages.threadId, threadId),
      eq(schema.messages.toolCallId, toolCallId),
      eq(schema.messages.actionType, ActionType.ToolCall),
    ),
  });
}
