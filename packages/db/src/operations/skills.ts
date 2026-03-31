import { type ExternalSkillMetadata } from "@tambo-ai-cloud/core";
import { and, desc, eq, sql } from "drizzle-orm";
import * as schema from "../schema";
import type { DBSkill } from "../schema";
import type { HydraDb } from "../types";

/**
 * Postgres error code for unique_violation.
 * @see https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
const PG_UNIQUE_VIOLATION = "23505";

/** Constraint name from schema.ts */
const SKILLS_NAME_UNIQUE_CONSTRAINT = "skills_project_id_name_idx";

/**
 * Check if an error (or its cause) is a unique violation on the skills name constraint.
 * Drizzle wraps pg errors in DrizzleQueryError with the original on `.cause`.
 * We duck-type rather than using instanceof since duplicate pg-protocol copies
 * in node_modules break class identity checks.
 */
function isSkillNameConflict(error: unknown): boolean {
  const err = error as { code?: string; constraint?: string; cause?: unknown };
  // Check the error itself first, then its .cause (DrizzleQueryError wrapping)
  if (
    err?.code === PG_UNIQUE_VIOLATION &&
    err?.constraint === SKILLS_NAME_UNIQUE_CONSTRAINT
  ) {
    return true;
  }
  const cause = err?.cause as
    | { code?: string; constraint?: string }
    | undefined;
  return (
    cause?.code === PG_UNIQUE_VIOLATION &&
    cause?.constraint === SKILLS_NAME_UNIQUE_CONSTRAINT
  );
}

/**
 * Thrown when a skill name already exists within the same project.
 */
export class SkillNameConflictError extends Error {
  constructor(name: string) {
    super(`A skill named "${name}" already exists in this project`);
    this.name = "SkillNameConflictError";
  }
}

/**
 * Create a new skill for a project.
 * @returns The created skill row.
 */
export async function createSkill(
  db: HydraDb,
  {
    projectId,
    name,
    description,
    instructions,
    createdByUserId,
  }: {
    projectId: string;
    name: string;
    description: string;
    instructions: string;
    createdByUserId?: string;
  },
): Promise<DBSkill> {
  try {
    const [skill] = await db
      .insert(schema.skills)
      .values({
        projectId,
        name,
        description,
        instructions,
        createdByUserId,
      })
      .returning();
    return skill;
  } catch (error) {
    if (isSkillNameConflict(error)) {
      throw new SkillNameConflictError(name);
    }
    throw error;
  }
}

/**
 * Get a single skill by ID, scoped to a project.
 * @returns The skill or undefined if not found.
 */
export async function getSkill(
  db: HydraDb,
  projectId: string,
  skillId: string,
): Promise<DBSkill | undefined> {
  return await db.query.skills.findFirst({
    where: and(
      eq(schema.skills.id, skillId),
      eq(schema.skills.projectId, projectId),
    ),
  });
}

/**
 * List skills for a project, optionally filtering to enabled only.
 * @returns Array of skills.
 */
export async function listSkillsForProject(
  db: HydraDb,
  projectId: string,
  options?: { enabledOnly?: boolean },
): Promise<DBSkill[]> {
  const conditions = [eq(schema.skills.projectId, projectId)];
  if (options?.enabledOnly) {
    conditions.push(eq(schema.skills.enabled, true));
  }
  return await db.query.skills.findMany({
    where: and(...conditions),
    orderBy: [desc(schema.skills.createdAt)],
  });
}

/**
 * Update a skill's fields. Only provided fields are updated.
 * @returns The updated skill row.
 */
export async function updateSkill(
  db: HydraDb,
  {
    projectId,
    skillId,
    name,
    description,
    instructions,
    enabled,
    externalSkillMetadata,
  }: {
    projectId: string;
    skillId: string;
    name?: string;
    description?: string;
    instructions?: string;
    enabled?: boolean;
    externalSkillMetadata?: ExternalSkillMetadata;
  },
): Promise<DBSkill | undefined> {
  const updates: Record<string, unknown> = {
    updatedAt: sql`now()`,
  };
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (instructions !== undefined) updates.instructions = instructions;
  if (enabled !== undefined) updates.enabled = enabled;
  if (externalSkillMetadata !== undefined)
    updates.externalSkillMetadata = externalSkillMetadata;

  try {
    const [updated] = await db
      .update(schema.skills)
      .set(updates)
      .where(
        and(
          eq(schema.skills.id, skillId),
          eq(schema.skills.projectId, projectId),
        ),
      )
      .returning();
    return updated;
  } catch (error) {
    if (isSkillNameConflict(error)) {
      throw new SkillNameConflictError(name ?? "");
    }
    throw error;
  }
}

/**
 * Delete a skill by ID, scoped to a project.
 */
export async function deleteSkill(
  db: HydraDb,
  projectId: string,
  skillId: string,
): Promise<void> {
  await db
    .delete(schema.skills)
    .where(
      and(
        eq(schema.skills.id, skillId),
        eq(schema.skills.projectId, projectId),
      ),
    );
}

/**
 * Atomically merge provider metadata into a skill's externalSkillMetadata.
 * Uses Postgres jsonb || jsonb to avoid read-spread-write race conditions.
 */
export async function mergeSkillMetadata(
  db: HydraDb,
  projectId: string,
  skillId: string,
  metadata: ExternalSkillMetadata,
): Promise<void> {
  await db
    .update(schema.skills)
    .set({
      externalSkillMetadata: sql`${schema.skills.externalSkillMetadata} || ${JSON.stringify(metadata)}::jsonb`,
      updatedAt: sql`now()`,
    })
    .where(
      and(
        eq(schema.skills.id, skillId),
        eq(schema.skills.projectId, projectId),
      ),
    );
}

/**
 * Atomically increment a skill's usage count by 1.
 */
export async function incrementSkillUsageCount(
  db: HydraDb,
  projectId: string,
  skillId: string,
): Promise<void> {
  await db
    .update(schema.skills)
    .set({
      usageCount: sql`${schema.skills.usageCount} + 1`,
      lastUsedAt: sql`now()`,
    })
    .where(
      and(
        eq(schema.skills.id, skillId),
        eq(schema.skills.projectId, projectId),
      ),
    );
}
