import { LEGAL_CONFIG, needsLegalAcceptance } from "@/lib/legal-config";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { operations, schema } from "@tambo-ai-cloud/db";
import { z } from "zod/v3";

export const userRouter = createTRPCRouter({
  getUser: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.user;
    return user;
  }),

  getUserProjects: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const db = ctx.db;
    const projects = await db.query.projects.findMany({
      where: (projects, { eq, inArray }) =>
        inArray(
          projects.id,
          db
            .select({ id: schema.projectMembers.projectId })
            .from(schema.projectMembers)
            .where(eq(schema.projectMembers.userId, userId)),
        ),
    });
    return projects;
  }),

  // Check if user has accepted legal terms
  hasAcceptedLegal: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const status = await operations.hasAcceptedLegal(ctx.db, userId);

    // Check if user needs to re-accept due to version change
    const needsReaccept = needsLegalAcceptance(status.version);

    return {
      ...status,
      accepted: status.accepted && !needsReaccept,
      needsUpdate: needsReaccept,
    };
  }),

  // Accept legal terms
  acceptLegal: protectedProcedure
    .input(
      z.object({
        version: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      await operations.acceptLegalTerms(
        ctx.db,
        userId,
        input.version || LEGAL_CONFIG.CURRENT_VERSION,
      );
      return { success: true };
    }),
});
