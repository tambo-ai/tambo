import {
  createSkillInput,
  deleteSkillInput,
  getSkillInput,
  listSkillsInput,
  updateSkillInput,
} from "@/lib/schemas/skills";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { operations } from "@tambo-ai-cloud/db";
import { TRPCError } from "@trpc/server";

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

  get: protectedProcedure.input(getSkillInput).query(async ({ ctx, input }) => {
    await operations.ensureProjectAccess(ctx.db, input.projectId, ctx.user.id);

    const skill = await operations.getSkill(
      ctx.db,
      input.projectId,
      input.skillId,
    );
    if (!skill) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Skill ${input.skillId} not found`,
      });
    }
    return skill;
  }),

  create: protectedProcedure
    .input(createSkillInput)
    .mutation(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.user.id,
      );

      try {
        const skill = await operations.createSkill(ctx.db, {
          projectId: input.projectId,
          name: input.name,
          description: input.description,
          instructions: input.instructions,
          createdByUserId: ctx.user.id,
        });

        return skill;
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("unique constraint")
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `A skill named "${input.name}" already exists in this project`,
          });
        }
        throw error;
      }
    }),

  update: protectedProcedure
    .input(updateSkillInput)
    .mutation(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.user.id,
      );

      const updated = await operations.updateSkill(ctx.db, {
        projectId: input.projectId,
        skillId: input.skillId,
        name: input.name,
        description: input.description,
        instructions: input.instructions,
        enabled: input.enabled,
      });

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Skill ${input.skillId} not found`,
        });
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

      await operations.deleteSkill(ctx.db, input.projectId, input.skillId);
    }),
});
