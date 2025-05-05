import { env } from "@/lib/env";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { hashKey } from "@tambo-ai-cloud/core";
import { operations } from "@tambo-ai-cloud/db";
import { z } from "zod";

export const projectRouter = createTRPCRouter({
  getUserProjects: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const projects = await operations.getProjectsForUser(ctx.db, userId);
    return projects.map((project) => ({
      id: project.id,
      name: project.name,
      userId: userId,
      composioEnabled: project.composioEnabled,
      customInstructions: project.customInstructions,
    }));
  }),

  createProject: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      return await operations.createProject(ctx.db, {
        name: input,
        userId: ctx.session.user.id,
      });
    }),

  updateProject: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z.string().optional(),
        customInstructions: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, name, customInstructions } = input;
      await operations.ensureProjectAccess(
        ctx.db,
        projectId,
        ctx.session.user.id,
      );

      const updatedProject = await operations.updateProject(ctx.db, projectId, {
        name,
        customInstructions:
          customInstructions === null ? "" : customInstructions,
      });

      if (!updatedProject) {
        throw new Error("Failed to update project");
      }

      return {
        id: updatedProject.id,
        name: updatedProject.name,
        userId: ctx.session.user.id,
        customInstructions: updatedProject.customInstructions,
        composioEnabled: updatedProject.composioEnabled,
      };
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
        providerKey: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, provider: providerName, providerKey } = input;
      await operations.ensureProjectAccess(
        ctx.db,
        projectId,
        ctx.session.user.id,
      );

      if (providerKey) {
        return await operations.addProviderKey(
          ctx.db,
          env.PROVIDER_KEY_SECRET,
          {
            projectId,
            providerName,
            providerKey,
            userId: ctx.session.user.id,
          },
        );
      }

      return await operations.getProjectWithKeys(ctx.db, projectId);
    }),

  getProviderKeys: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: projectId }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        projectId,
        ctx.session.user.id,
      );
      return await operations.getProviderKeys(ctx.db, projectId);
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
      return await operations.getApiKeys(ctx.db, projectId);
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
