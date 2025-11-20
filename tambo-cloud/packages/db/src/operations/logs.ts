import { LogLevel } from "@tambo-ai-cloud/core";
import * as schema from "../schema";
import { HydraDb } from "../types";

export type ProjectLogEntry = typeof schema.projectLogs.$inferSelect;

/**
 * Insert a per-project log entry.
 */
export async function addProjectLogEntry(
  db: HydraDb,
  projectId: string,
  level: LogLevel,
  message: string,
  metadata: Record<string, unknown> | null = null,
  threadId?: string,
): Promise<void> {
  await db.insert(schema.projectLogs).values({
    projectId,
    level,
    message,
    metadata,
    threadId: threadId ?? null,
  });
}

/**
 * Fetch the most recent log entries for a project (default 20).
 */
export async function getRecentProjectLogEntries(
  db: HydraDb,
  projectId: string,
  limit = 20,
): Promise<ProjectLogEntry[]> {
  return await db.query.projectLogs.findMany({
    where: (projectLogs, { eq }) => eq(projectLogs.projectId, projectId),
    orderBy: (projectLogs, { desc }) => [desc(projectLogs.timestamp)],
    limit,
  });
}
