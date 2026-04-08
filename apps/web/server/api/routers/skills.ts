import { env } from "@/lib/env";
import {
  createSkillInput,
  deleteSkillInput,
  listSkillsInput,
  updateSkillInput,
} from "@/lib/schemas/skills";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  deleteSkillFromProvider,
  uploadSkillToProvider,
  updateSkillOnProvider,
  providerSupportsSkills,
} from "@tambo-ai-cloud/backend";
import { decryptProviderKey } from "@tambo-ai-cloud/core";
import { operations, schema, SkillNameConflictError } from "@tambo-ai-cloud/db";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Get the decrypted provider API key for the project's default LLM provider.
 * @returns The provider name and decrypted API key, or undefined if not available.
 */
async function getProjectProviderKey(
  db: Parameters<typeof operations.getSkill>[0],
  projectId: string,
): Promise<{ providerName: string; apiKey: string } | undefined> {
  const project = await db.query.projects.findFirst({
    where: eq(schema.projects.id, projectId),
    columns: { defaultLlmProviderName: true },
  });
  const providerName = project?.defaultLlmProviderName ?? "openai";
  if (!providerSupportsSkills(providerName)) return undefined;

  // Try user-provided key first, then fall back to the platform key
  // so free-tier projects also get eager skill uploads.
  const providerKeys = await operations.getProviderKeys(db, projectId);
  const keyRow = providerKeys.find((k) => k.providerName === providerName);
  if (keyRow?.providerKeyEncrypted) {
    const { providerKey: apiKey } = decryptProviderKey(
      keyRow.providerKeyEncrypted,
      env.PROVIDER_KEY_SECRET,
    );
    return { providerName, apiKey };
  }

  // Fall back to platform key for free-tier OpenAI projects
  if (providerName === "openai" && env.FALLBACK_OPENAI_API_KEY) {
    return { providerName, apiKey: env.FALLBACK_OPENAI_API_KEY };
  }

  return undefined;
}

/**
 * Create a new skill on the provider API and persist the metadata.
 * Throws a TRPCError on failure so the client sees what went wrong.
 * Silently skips if no provider key is available (free-tier projects).
 */
async function createSkillOnProviderAndPersist(
  db: Parameters<typeof operations.getSkill>[0],
  projectId: string,
  skill: {
    id: string;
    name: string;
    description: string;
    instructions: string;
  },
): Promise<void> {
  const provider = await getProjectProviderKey(db, projectId);
  if (!provider) return;

  try {
    const metadata = await uploadSkillToProvider({
      skill: { ...skill, projectId },
      providerName: provider.providerName,
      apiKey: provider.apiKey,
    });

    // Atomic merge to avoid race conditions with concurrent updates
    await operations.mergeSkillMetadata(db, projectId, skill.id, {
      [provider.providerName]: metadata,
    });
  } catch (error) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Failed to upload skill to provider: ${error instanceof Error ? error.message : "unknown error"}`,
    });
  }
}

/**
 * Update an existing skill on the provider by creating a new version.
 * Falls back to creating a brand-new skill if no provider metadata exists yet.
 * Throws a TRPCError on failure so the client sees what went wrong.
 * Silently skips if no provider key is available (free-tier projects).
 */
async function updateSkillOnProviderAndPersist(
  db: Parameters<typeof operations.getSkill>[0],
  projectId: string,
  skill: {
    id: string;
    name: string;
    description: string;
    instructions: string;
  },
  existingRef:
    | { skillId: string; uploadedAt: string; version: string }
    | undefined,
  provider?: { providerName: string; apiKey: string },
): Promise<void> {
  const resolvedProvider =
    provider ?? (await getProjectProviderKey(db, projectId));
  if (!resolvedProvider) return;

  try {
    // If we have an existing provider reference, update via versions.create().
    // Otherwise fall back to creating a new skill (e.g. first upload for this provider).
    const metadata = existingRef
      ? await updateSkillOnProvider({
          skill: { ...skill, projectId },
          providerName: resolvedProvider.providerName,
          apiKey: resolvedProvider.apiKey,
          existingRef,
        })
      : await uploadSkillToProvider({
          skill: { ...skill, projectId },
          providerName: resolvedProvider.providerName,
          apiKey: resolvedProvider.apiKey,
        });

    await operations.mergeSkillMetadata(db, projectId, skill.id, {
      [resolvedProvider.providerName]: metadata,
    });
  } catch (error) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Failed to update skill on provider: ${error instanceof Error ? error.message : "unknown error"}`,
    });
  }
}

export const skillsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(listSkillsInput)
    .query(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.user.id,
      );
      return await operations.listSkillsForProject(ctx.db, input.projectId);
    }),

  create: protectedProcedure
    .input(createSkillInput)
    .mutation(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.user.id,
      );
      let skill;
      try {
        skill = await operations.createSkill(ctx.db, {
          ...input,
          createdByUserId: ctx.user.id,
        });
      } catch (error) {
        if (error instanceof SkillNameConflictError) {
          throw new TRPCError({
            code: "CONFLICT",
            message: error.message,
          });
        }
        throw error;
      }

      // Upload to provider so the skill is available by the time the user sends a message.
      // If the upload fails, delete the DB record so the user doesn't see a broken skill.
      try {
        await createSkillOnProviderAndPersist(ctx.db, input.projectId, skill);
      } catch (error) {
        await operations.deleteSkill(ctx.db, input.projectId, skill.id);
        throw error;
      }

      return skill;
    }),

  update: protectedProcedure
    .input(updateSkillInput)
    .mutation(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.user.id,
      );
      const contentChanged =
        input.name !== undefined ||
        input.description !== undefined ||
        input.instructions !== undefined;

      // Fetch existing skill before updating so we have the provider metadata
      // needed to update in-place (e.g. Anthropic versions.create).
      const existingSkill = contentChanged
        ? await operations.getSkill(ctx.db, input.projectId, input.skillId)
        : undefined;

      let updated;
      try {
        updated = await operations.updateSkill(ctx.db, input);
      } catch (error) {
        // User can rename a skill -- catch conflict if new name collides
        if (error instanceof SkillNameConflictError) {
          throw new TRPCError({
            code: "CONFLICT",
            message: error.message,
          });
        }
        throw error;
      }

      if (contentChanged && updated) {
        const provider = await getProjectProviderKey(ctx.db, input.projectId);
        const existingRef =
          existingSkill?.externalSkillMetadata?.[provider?.providerName ?? ""];

        // Clear provider metadata before the provider call so the transaction
        // commits without stale refs. The update path is delete-then-create,
        // so if create fails after delete the old skillId is dead. By clearing
        // first and not throwing on provider failure, the transaction commits
        // with clean metadata and the next run does a fresh upload.
        if (existingRef) {
          await operations.updateSkill(ctx.db, {
            projectId: input.projectId,
            skillId: input.skillId,
            externalSkillMetadata: {},
          });
        }

        try {
          await updateSkillOnProviderAndPersist(
            ctx.db,
            input.projectId,
            updated,
            existingRef,
            provider ?? undefined,
          );
        } catch (error) {
          // Log but don't throw -- the DB update and metadata clear should
          // commit so the next run can do a fresh upload. Throwing would
          // abort the transaction and restore stale metadata.
          console.warn(
            `[Skills] Provider update failed, will re-upload on next run:`,
            error instanceof Error ? error.message : error,
          );
        }
      }

      return updated;
    }),

  delete: protectedProcedure
    .input(deleteSkillInput)
    .mutation(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.user.id,
      );

      // Best-effort provider cleanup before DB deletion
      const skill = await operations.getSkill(
        ctx.db,
        input.projectId,
        input.skillId,
      );
      const provider = await getProjectProviderKey(ctx.db, input.projectId);
      if (skill?.externalSkillMetadata && provider) {
        const ref = skill.externalSkillMetadata[provider.providerName];
        if (ref) {
          try {
            await deleteSkillFromProvider({
              skillId: ref.skillId,
              providerName: provider.providerName,
              apiKey: provider.apiKey,
            });
          } catch (error) {
            console.warn(
              `[Skills] Provider cleanup failed for ${provider.providerName}:`,
              error,
            );
          }
        }
      }

      await operations.deleteSkill(ctx.db, input.projectId, input.skillId);
    }),
});
