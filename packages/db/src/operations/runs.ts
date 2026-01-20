import { and, eq, desc } from "drizzle-orm";
import { V1RunStatus } from "@tambo-ai-cloud/core";
import type { HydraDb } from "../types";
import { threads, runs, messages, type RunRequestParams } from "../schema";

/**
 * Input for starting a new run.
 */
export interface StartRunInput {
  threadId: string;
  previousRunId?: string;
  model?: string;
  requestParams?: RunRequestParams;
  metadata?: Record<string, unknown>;
}

/**
 * Result of attempting to start a run.
 */
export type StartRunResult =
  | { success: true; runId: string; threadId: string }
  | {
      success: false;
      reason: "thread_not_found" | "concurrent_run" | "invalid_previous_run";
      message: string;
      currentRunId?: string | null;
    };

/**
 * Get thread with message count for run validation.
 */
export async function getThreadForRunStart(
  db: HydraDb,
  threadId: string,
): Promise<{
  thread: typeof threads.$inferSelect | null;
  hasMessages: boolean;
}> {
  const thread = await db.query.threads.findFirst({
    where: eq(threads.id, threadId),
    with: {
      messages: {
        limit: 1,
        orderBy: [desc(messages.createdAt)],
      },
    },
  });

  if (!thread) {
    return { thread: null, hasMessages: false };
  }

  return {
    thread,
    hasMessages: thread.messages.length > 0,
  };
}

/**
 * Atomically acquire a run lock on a thread.
 * Sets runStatus from IDLE to WAITING and clears previous run outcome fields.
 *
 * @returns true if lock was acquired, false if thread was not idle
 */
export async function acquireRunLock(
  db: HydraDb,
  threadId: string,
): Promise<boolean> {
  const result = await db
    .update(threads)
    .set({
      runStatus: V1RunStatus.WAITING,
      // Clear last run outcome fields when starting new run
      statusMessage: null,
      lastRunCancelled: null,
      lastRunError: null,
      updatedAt: new Date(),
    })
    .where(
      and(eq(threads.id, threadId), eq(threads.runStatus, V1RunStatus.IDLE)),
    )
    .returning({ id: threads.id });

  return result.length > 0;
}

/**
 * Create a new run record in the runs table.
 */
export async function createRun(
  db: HydraDb,
  input: StartRunInput,
): Promise<{ id: string }> {
  const [run] = await db
    .insert(runs)
    .values({
      threadId: input.threadId,
      status: V1RunStatus.WAITING,
      previousRunId: input.previousRunId,
      model: input.model,
      requestParams: input.requestParams,
      metadata: input.metadata,
    })
    .returning({ id: runs.id });

  if (!run) {
    throw new Error(`Failed to create run for thread ${input.threadId}`);
  }

  return run;
}

/**
 * Set the current run ID on a thread.
 */
export async function setCurrentRunId(
  db: HydraDb,
  threadId: string,
  runId: string,
): Promise<void> {
  await db
    .update(threads)
    .set({
      currentRunId: runId,
      updatedAt: new Date(),
    })
    .where(eq(threads.id, threadId));
}

/**
 * Get a run by ID and thread ID.
 */
export async function getRun(
  db: HydraDb,
  threadId: string,
  runId: string,
): Promise<typeof runs.$inferSelect | null> {
  const run = await db.query.runs.findFirst({
    where: and(eq(runs.id, runId), eq(runs.threadId, threadId)),
  });

  return run ?? null;
}

/**
 * Mark a run as cancelled.
 */
export async function markRunCancelled(
  db: HydraDb,
  runId: string,
): Promise<void> {
  await db
    .update(runs)
    .set({
      isCancelled: true,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(runs.id, runId));
}

/**
 * Release a run lock and set the thread back to idle.
 * Used when a run completes or is cancelled.
 */
export async function releaseRunLock(
  db: HydraDb,
  threadId: string,
  runId: string,
  options: {
    wasCancelled?: boolean;
    error?: { code?: string; message: string };
    pendingToolCallIds?: string[];
  } = {},
): Promise<void> {
  await db
    .update(threads)
    .set({
      runStatus: V1RunStatus.IDLE,
      currentRunId: null,
      lastRunCancelled: options.wasCancelled ?? null,
      lastRunError: options.error ?? null,
      pendingToolCallIds: options.pendingToolCallIds ?? null,
      lastCompletedRunId: runId,
      updatedAt: new Date(),
    })
    .where(eq(threads.id, threadId));
}

/**
 * Release a run lock only if `threads.currentRunId === runId`.
 *
 * Also updates thread run outcome fields (`lastCompletedRunId`, `lastRunCancelled`,
 * `lastRunError`, and `pendingToolCallIds`) while clearing the current run.
 *
 * @returns true if the lock was released, false if the thread is no longer on this run
 */
export async function releaseRunLockIfCurrent(
  db: HydraDb,
  threadId: string,
  runId: string,
  options: {
    wasCancelled?: boolean;
    error?: { code?: string; message: string };
    pendingToolCallIds?: string[];
  } = {},
): Promise<boolean> {
  const result = await db
    .update(threads)
    .set({
      runStatus: V1RunStatus.IDLE,
      currentRunId: null,
      lastRunCancelled: options.wasCancelled ?? null,
      lastRunError: options.error ?? null,
      pendingToolCallIds: options.pendingToolCallIds ?? null,
      lastCompletedRunId: runId,
      updatedAt: new Date(),
    })
    .where(and(eq(threads.id, threadId), eq(threads.currentRunId, runId)))
    .returning({ id: threads.id });

  return result.length > 0;
}

/**
 * Update the run status (WAITING -> STREAMING).
 */
export async function updateRunStatus(
  db: HydraDb,
  runId: string,
  status: V1RunStatus,
): Promise<void> {
  const updates: Partial<typeof runs.$inferInsert> = {
    status,
    updatedAt: new Date(),
  };

  if (status === V1RunStatus.STREAMING) {
    updates.startedAt = new Date();
  }

  await db.update(runs).set(updates).where(eq(runs.id, runId));
}

/**
 * Update the thread status (for run lifecycle).
 */
export async function updateThreadRunStatus(
  db: HydraDb,
  threadId: string,
  status: V1RunStatus,
  statusMessage?: string,
): Promise<void> {
  await db
    .update(threads)
    .set({
      runStatus: status,
      statusMessage: statusMessage ?? null,
      updatedAt: new Date(),
    })
    .where(eq(threads.id, threadId));
}

/**
 * Mark a run as complete (success or error).
 */
export async function completeRun(
  db: HydraDb,
  runId: string,
  options: {
    error?: { code: string; message: string };
  } = {},
): Promise<void> {
  await db
    .update(runs)
    .set({
      status: V1RunStatus.IDLE,
      errorCode: options.error?.code ?? null,
      errorMessage: options.error?.message ?? null,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(runs.id, runId));
}
