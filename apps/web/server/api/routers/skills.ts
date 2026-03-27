import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { operations, SkillNameConflictError } from "@tambo-ai-cloud/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v3";

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
      try {
        return await operations.createSkill(ctx.db, {
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
      try {
        return await operations.updateSkill(ctx.db, input);
      } catch (error) {
        // User can rename a skill — catch conflict if new name collides
        if (error instanceof SkillNameConflictError) {
          throw new TRPCError({
            code: "CONFLICT",
            message: error.message,
          });
        }
        throw error;
      }
    }),

  delete: protectedProcedure
    .input(z.object({ projectId: z.string(), skillId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.user.id,
      );
      await operations.deleteSkill(ctx.db, input.projectId, input.skillId);
    }),
});
