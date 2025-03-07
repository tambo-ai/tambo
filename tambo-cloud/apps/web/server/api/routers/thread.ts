import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { operations } from "@use-hydra-ai/db";
import { z } from "zod";

export const threadRouter = createTRPCRouter({
  getThreads: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        contextKey: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Ensure user has access to the project
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
      );

      const threads = await operations.getThreadsByProject(
        ctx.db,
        input.projectId,
        {
          contextKey: input.contextKey,
        },
      );

      return threads;
    }),

  getThread: protectedProcedure
    .input(
      z.object({
        threadId: z.string(),
        projectId: z.string(),
        includeInternal: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Ensure user has access to the project
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
      );

      const thread = await operations.getThreadForProjectId(
        ctx.db,
        input.threadId,
        input.projectId,
        input.includeInternal,
      );
      if (thread?.projectId !== input.projectId) {
        throw new Error("Thread not found");
      }
      return {
        ...thread,
        messages: thread.messages.map((message) => ({
          ...message,
          componentDecision: message.componentDecision ?? undefined,
          toolCallRequest: message.toolCallRequest ?? undefined,
          suggestedActions: message.suggestions ?? undefined,
        })),
      };
    }),

  deleteThread: protectedProcedure
    .input(
      z.object({
        threadId: z.string(),
        projectId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Ensure user has access to the project
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
      );
      // make sure the thread belongs to the project
      const thread = await operations.getThreadForProjectId(
        ctx.db,
        input.threadId,
        input.projectId,
      );
      if (thread?.projectId !== input.projectId) {
        throw new Error("Thread not found");
      }
      return await operations.deleteThread(ctx.db, input.threadId);
    }),
});
