import { env } from "@/lib/env";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { encryptApiKey, encryptProviderKey, hashKey } from "@use-hydra-ai/core";
import { HydraDatabase, schema } from "@use-hydra-ai/db";
import { randomBytes } from "crypto";
import { z } from "zod";

export const projectRouter = createTRPCRouter({
  getProjects: protectedProcedure.query(async ({ ctx }) => {
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

    return projects;
  }),

  createProject: protectedProcedure
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = ctx.db;

      const project = await db.transaction(async (tx) => {
        const [project] = await tx
          .insert(schema.projects)
          .values({
            name: input.name,
          })
          .returning();
        await tx.insert(schema.projectMembers).values({
          projectId: project.id,
          userId: ctx.session.user.id,
          role: "admin",
        });

        // TODO: auto-generate first API key

        return tx.query.projects.findFirst({
          where: (projects, { eq }) => eq(projects.id, project.id),
        });
      });

      return project;
    }),

  addProviderKey: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        provider: z.string(),
        apiKey: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, provider, apiKey } = input;
      const db = ctx.db;
      const encryptedKey = encryptProviderKey(
        provider,
        apiKey,
        env.PROVIDER_KEY_SECRET,
      );

      // make sure the user has access to the project by checking the project members table
      await ensureProjectAccess(db, projectId, ctx.session.user.id);

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

  addApiKey: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        name: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { projectId, name } = input;
      const db = ctx.db;

      // generate a fresh api key and return that, but store just the encrypted key in the db
      const apiKey = randomBytes(16).toString("hex");
      const encryptedKey = encryptApiKey(projectId, apiKey, env.API_KEY_SECRET);
      const hashedKey = hashKey(encryptedKey);

      await ensureProjectAccess(db, projectId, ctx.session.user.id);

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
});

async function ensureProjectAccess(
  db: HydraDatabase,
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
