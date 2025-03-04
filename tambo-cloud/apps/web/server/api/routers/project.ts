import { env } from "@/lib/env";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { hashKey } from "@use-hydra-ai/core";
import { operations } from "@use-hydra-ai/db";
import { sql } from "drizzle-orm";
import { z } from "zod";

export const projectRouter = createTRPCRouter({
  getUserProjects: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const projects = await operations.getProjectsForUser(ctx.db, userId);
    console.log(
      "current role: ",
      await ctx.db.execute(sql`select current_role;`),
    );
    const pm = await ctx.db.query.projectMembers.findMany();
    console.log(`got ${pm?.length} pms`, pm);
    return projects.map((project) => ({
      id: project.id,
      name: project.name,
      userId: userId,
    }));
  }),

  createProject: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      return operations.createProject(ctx.db, {
        name: input,
        userId: ctx.session.user.id,
      });
    }),

  removeProject: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: projectId }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        projectId,
        ctx.session.user.id,
      );
      await operations.deleteProject(ctx.db, projectId);
    }),

  addProviderKey: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        provider: z.string(),
        providerKey: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, provider: providerName, providerKey } = input;
      await operations.ensureProjectAccess(
        ctx.db,
        projectId,
        ctx.session.user.id,
      );

      return operations.addProviderKey(ctx.db, env.PROVIDER_KEY_SECRET, {
        projectId,
        providerName,
        providerKey,
        userId: ctx.session.user.id,
      });
    }),

  getProviderKeys: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: projectId }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        projectId,
        ctx.session.user.id,
      );
      return operations.getProviderKeys(ctx.db, projectId);
    }),

  generateApiKey: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, name } = input;
      await operations.ensureProjectAccess(
        ctx.db,
        projectId,
        ctx.session.user.id,
      );

      const encryptedKey = await operations.createApiKey(
        ctx.db,
        env.API_KEY_SECRET,
        {
          projectId,
          userId: ctx.session.user.id,
          name,
        },
      );

      const apiKeys = await operations.getApiKeys(ctx.db, projectId);
      const newKey = apiKeys.find((k) => k.hashedKey === hashKey(encryptedKey));

      if (!newKey) {
        throw new Error("Failed to create API key");
      }

      return {
        ...newKey,
        apiKey: encryptedKey,
      };
    }),

  getApiKeys: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: projectId }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        projectId,
        ctx.session.user.id,
      );
      return operations.getApiKeys(ctx.db, projectId);
    }),

  removeApiKey: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        apiKeyId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
      );
      await operations.deleteApiKey(ctx.db, input.projectId, input.apiKeyId);
    }),
});
