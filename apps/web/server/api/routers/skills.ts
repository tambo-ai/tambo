import { env } from "@/lib/env";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  deleteSkillFromProvider,
  uploadSkillToProvider,
  providerSupportsSkills,
} from "@tambo-ai-cloud/backend";
import {
  decryptProviderKey,
  type ExternalSkillMetadata,
} from "@tambo-ai-cloud/core";
import { operations, schema, SkillNameConflictError } from "@tambo-ai-cloud/db";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v3";

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

  const providerKeys = await operations.getProviderKeys(db, projectId);
  const keyRow = providerKeys.find((k) => k.providerName === providerName);
  if (!keyRow?.providerKeyEncrypted) return undefined;

  const { providerKey: apiKey } = decryptProviderKey(
    keyRow.providerKeyEncrypted,
    env.PROVIDER_KEY_SECRET,
  );
  return { providerName, apiKey };
}

/**
 * Eagerly upload a skill to the provider API and persist the metadata.
 * Best-effort: logs warning on failure, does not throw.
 */
async function eagerUploadSkill(
  db: Parameters<typeof operations.getSkill>[0],
  projectId: string,
  skill: {
    id: string;
    name: string;
    description: string;
    instructions: string;
  },
): Promise<void> {
  try {
    const provider = await getProjectProviderKey(db, projectId);
    if (!provider) return;

    const metadata = await uploadSkillToProvider({
      skill,
      providerName: provider.providerName,
      apiKey: provider.apiKey,
    });

    const externalSkillMetadata: ExternalSkillMetadata = {
      [provider.providerName]: metadata,
    };

    await operations.updateSkill(db, {
      projectId,
      skillId: skill.id,
      externalSkillMetadata,
    });
  } catch (error) {
    console.warn(`[Skills] Eager upload failed for skill ${skill.id}:`, error);
  }
}

export const skillsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.user.id,
      );
      return await operations.listSkillsForProject(ctx.db, input.projectId);
    }),

  create: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z.string().min(1, "Name is required").max(200),
        description: z.string().min(1, "Description is required").max(2000),
        instructions: z.string().max(100_000),
      }),
    )
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

      // Eager upload so the skill is available by the time the user sends a message
      void eagerUploadSkill(ctx.db, input.projectId, skill);

      return skill;
    }),

  update: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        skillId: z.string(),
        name: z.string().min(1).max(200).optional(),
        description: z.string().min(1).max(2000).optional(),
        instructions: z.string().max(100_000).optional(),
        enabled: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.user.id,
      );
      // If content fields changed, invalidate provider metadata so the next
      // run re-uploads the updated skill to the provider.
      const contentChanged =
        input.name !== undefined ||
        input.description !== undefined ||
        input.instructions !== undefined;

      let updated;
      try {
        updated = await operations.updateSkill(ctx.db, {
          ...input,
          ...(contentChanged ? { externalSkillMetadata: {} } : {}),
        });
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

      // Re-upload to provider after content changes so it's ready before next message
      if (contentChanged && updated) {
        void eagerUploadSkill(ctx.db, input.projectId, updated);
      }

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ projectId: z.string(), skillId: z.string() }))
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
      if (skill?.externalSkillMetadata) {
        const providerKeys = await operations.getProviderKeys(
          ctx.db,
          input.projectId,
        );
        for (const providerName of Object.keys(skill.externalSkillMetadata)) {
          try {
            const keyRow = providerKeys.find(
              (k) => k.providerName === providerName,
            );
            if (!keyRow?.providerKeyEncrypted) continue;
            const { providerKey: apiKey } = decryptProviderKey(
              keyRow.providerKeyEncrypted,
              env.PROVIDER_KEY_SECRET,
            );
            const ref = skill.externalSkillMetadata[providerName];
            if (ref) {
              await deleteSkillFromProvider({
                skillId: ref.skillId,
                providerName,
                apiKey,
              });
            }
          } catch {
            // Best-effort: don't block DB deletion if provider cleanup fails
          }
        }
      }

      await operations.deleteSkill(ctx.db, input.projectId, input.skillId);
    }),
});
