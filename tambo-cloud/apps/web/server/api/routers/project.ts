import { env } from "@/lib/env";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { encryptApiKey, encryptProviderKey, hashKey } from "@use-hydra-ai/core";
import { HydraDatabase, HydraTransaction, schema } from "@use-hydra-ai/db";
import { randomBytes } from "crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export const projectRouter = createTRPCRouter({
  getUserProjects: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
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
      with: {
        members: {
          with: {
            user: true,
          },
        },
        apiKeys: true,
        providerKeys: true,
      },
    });

    return projects.map((project) => ({
      id: project.id,
      name: project.name,
      userId: userId,
    }));
  }),

  createProject: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const db = ctx.db;
      const userId = ctx.session.user.id;

      const project = await db.transaction(async (tx) => {
        const [project] = await tx
          .insert(schema.projects)
          .values({
            name: input,
          })
          .returning();

        await tx.insert(schema.projectMembers).values({
          projectId: project.id,
          userId,
          role: "admin",
        });

        // TODO: auto-generate first API key

        return project;
      });

      return {
        id: project.id,
        name: project.name,
        userId: userId,
      };
    }),

  removeProject: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: projectId }) => {
      const db = ctx.db;
      await ensureProjectAccess(db, projectId, ctx.session.user.id);
      await db
        .delete(schema.providerKeys)
        .where(eq(schema.providerKeys.projectId, projectId));
      await db
        .delete(schema.apiKeys)
        .where(eq(schema.apiKeys.projectId, projectId));
      await db
        .delete(schema.projectMembers)
        .where(eq(schema.projectMembers.projectId, projectId));
      await db
        .delete(schema.projectMembers)
        .where(eq(schema.projectMembers.projectId, projectId));
      await db.delete(schema.projects).where(eq(schema.projects.id, projectId));
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
      const { projectId, provider, providerKey: apiKey } = input;
      const db = ctx.db;
      // make sure the user has access to the project by checking the project members table
      await ensureProjectAccess(db, projectId, ctx.session.user.id);

      const encryptedKey = encryptProviderKey(
        provider,
        apiKey,
        env.PROVIDER_KEY_SECRET,
      );

      const providerKey = await db
        .insert(schema.providerKeys)
        .values({
          projectId: projectId,
          providerName: provider,
          partiallyHiddenKey: hideApiKey(apiKey, 10),
          providerKeyEncrypted: encryptedKey,
        })
        .returning();

      return providerKey;
    }),

  getProviderKeys: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: projectId }) => {
      const db = ctx.db;
      await ensureProjectAccess(db, projectId, ctx.session.user.id);
      return db.query.providerKeys.findMany({
        where: eq(schema.providerKeys.projectId, projectId),
      });
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
      const db = ctx.db;
      await ensureProjectAccess(db, projectId, ctx.session.user.id);

      // generate a fresh api key and return that, but store just the encrypted key in the db
      const apiKey = randomBytes(16).toString("hex");
      const encryptedKey = encryptApiKey(projectId, apiKey, env.API_KEY_SECRET);
      const hashedKey = hashKey(encryptedKey);

      const [row] = await db
        .insert(schema.apiKeys)
        .values({
          createdByUserId: ctx.session.user.id,
          projectId: projectId,
          name: name,
          hashedKey: hashedKey,
          partiallyHiddenKey: hideApiKey(apiKey, 10),
        })
        .returning();

      return {
        ...row,
        // return the full api key to the client one time
        apiKey,
      };
    }),

  getApiKeys: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: projectId }) => {
      const db = ctx.db;
      await ensureProjectAccess(db, projectId, ctx.session.user.id);
      return db.query.apiKeys.findMany({
        where: eq(schema.apiKeys.projectId, projectId),
      });
    }),

  removeApiKey: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        apiKeyId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = ctx.db;
      await ensureProjectAccess(db, input.projectId, ctx.session.user.id);
      await db
        .delete(schema.apiKeys)
        .where(
          and(
            eq(schema.apiKeys.id, input.apiKeyId),
            eq(schema.apiKeys.projectId, input.projectId),
          ),
        );
    }),
});

async function ensureProjectAccess(
  db: HydraDatabase | HydraTransaction,
  projectId: string,
  userId: string,
) {
  const projectMembers = await db.query.projectMembers.findFirst({
    where: (projectMembers, { eq, and }) =>
      and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId),
      ),
  });

  if (!projectMembers) {
    throw new Error("You are not a member of this project");
  }
}

// todo: move to core?
function hideApiKey(apiKey: string, visibleCharacters = 4): string {
  const hiddenPart = apiKey.substring(visibleCharacters).replace(/./g, "*");
  return apiKey.substring(0, visibleCharacters) + hiddenPart;
}
