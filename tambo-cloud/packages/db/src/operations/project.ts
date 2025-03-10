import {
  encryptApiKey,
  encryptProviderKey,
  hashKey,
  hideApiKey,
} from "@tambo-ai-cloud/core";
import { createHash, randomBytes } from "crypto";
import { and, eq } from "drizzle-orm";
import * as schema from "../schema";
import type { HydraDb } from "../types";

export async function createProject(
  db: HydraDb,
  {
    name,
    userId,
    role = "admin",
  }: { name: string; userId: string; role?: string },
) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  return await db.transaction(async (tx) => {
    const [project] = await tx
      .insert(schema.projects)
      .values({
        name: name ?? "New Project",
      })
      .returning();

    await tx.insert(schema.projectMembers).values({
      projectId: project.id,
      userId: userId,
      role,
    });

    return {
      id: project.id,
      name: project.name,
      userId,
    };
  });
}

export async function getProjectsForUser(db: HydraDb, userId: string) {
  return await db.query.projects.findMany({
    where: (projects, { inArray }) =>
      inArray(
        projects.id,
        db
          .select({ id: schema.projectMembers.projectId })
          .from(schema.projectMembers)
          .where(eq(schema.projectMembers.userId, userId)),
      ),
  });
}

export async function getProject(db: HydraDb, id: string) {
  return await db.query.projects.findFirst({
    where: (projects, { eq, or, and, isNotNull }) =>
      or(
        eq(projects.id, id),
        and(isNotNull(projects.legacyId), eq(projects.legacyId, id)),
      ),
    with: {
      members: true,
    },
  });
}

export async function getProjectWithKeys(db: HydraDb, id: string) {
  return await db.query.projects.findFirst({
    where: (projects, { eq, or, and, isNotNull }) =>
      or(
        eq(projects.id, id),
        and(isNotNull(projects.legacyId), eq(projects.legacyId, id)),
      ),
    with: {
      members: true,
      apiKeys: true,
      providerKeys: true,
    },
  });
}

export async function updateProject(
  db: HydraDb,
  id: string,
  { name }: { name: string },
) {
  const [updated] = await db
    .update(schema.projects)
    .set({ name })
    .where(eq(schema.projects.id, id))
    .returning();
  return updated;
}

export async function hasProjectAccess(
  db: HydraDb,
  id: string,
  userId: string,
) {
  const firstProjectMembership = await db.query.projectMembers.findFirst({
    where: (projectMembers, { eq, and }) =>
      and(eq(projectMembers.projectId, id), eq(projectMembers.userId, userId)),
  });

  return !!firstProjectMembership;
}

export async function ensureProjectAccess(
  db: HydraDb,
  id: string,
  userId: string,
) {
  const access = await hasProjectAccess(db, id, userId);
  if (!access) {
    throw new Error("User does not have access to this project");
  }
}

export async function deleteProject(db: HydraDb, id: string): Promise<boolean> {
  return await db.transaction(async (tx) => {
    // Delete provider keys
    await tx
      .delete(schema.providerKeys)
      .where(eq(schema.providerKeys.projectId, id));

    // Delete API keys
    await tx.delete(schema.apiKeys).where(eq(schema.apiKeys.projectId, id));

    // Delete project members
    await tx
      .delete(schema.projectMembers)
      .where(eq(schema.projectMembers.projectId, id));

    // Finally delete the project itself
    const deleted = await tx
      .delete(schema.projects)
      .where(eq(schema.projects.id, id))
      .returning();

    return deleted.length > 0;
  });
}

export async function createApiKey(
  db: HydraDb,
  apiKeySecret: string,
  {
    projectId,
    userId,
    name,
  }: { projectId: string; userId: string; name: string },
): Promise<string> {
  const apiKey = randomBytes(16).toString("hex");
  const encryptedKey = encryptApiKey(projectId, apiKey, apiKeySecret);
  const hashedKey = hashKey(encryptedKey);

  await db.insert(schema.apiKeys).values({
    projectId,
    name,
    hashedKey,
    createdByUserId: userId,
    partiallyHiddenKey: hideApiKey(encryptedKey, 10),
  });

  return encryptedKey;
}

export async function getApiKeys(db: HydraDb, projectId: string) {
  return await db.query.apiKeys.findMany({
    where: eq(schema.apiKeys.projectId, projectId),
  });
}

export async function updateApiKeyLastUsed(
  db: HydraDb,
  {
    projectId,
    hashedKey,
    lastUsed,
  }: {
    projectId: string;
    hashedKey: string;
    lastUsed: Date;
  },
) {
  const [updated] = await db
    .update(schema.apiKeys)
    .set({ lastUsedAt: lastUsed })
    .where(
      and(
        eq(schema.apiKeys.hashedKey, hashedKey),
        eq(schema.apiKeys.projectId, projectId),
      ),
    )
    .returning();

  if (!updated) {
    throw new Error("API Key not found");
  }
  return updated;
}

export async function deleteApiKey(
  db: HydraDb,
  projectId: string,
  apiKeyId: string,
): Promise<boolean> {
  const deleted = await db
    .delete(schema.apiKeys)
    .where(
      and(
        eq(schema.apiKeys.id, apiKeyId),
        eq(schema.apiKeys.projectId, projectId),
      ),
    )
    .returning();
  return deleted.length > 0;
}

export async function validateApiKey(
  db: HydraDb,
  projectId: string,
  apiKey: string,
): Promise<boolean> {
  const hashedKey = createHash("sha256").update(apiKey).digest("hex");

  const keys = await db
    .select()
    .from(schema.apiKeys)
    .where(
      and(
        eq(schema.apiKeys.hashedKey, hashedKey),
        eq(schema.apiKeys.projectId, projectId),
      ),
    );

  return keys.length > 0;
}

export async function addProviderKey(
  db: HydraDb,
  providerKeySecret: string,
  {
    projectId,
    providerName,
    providerKey,
  }: {
    projectId: string;
    providerName: string;
    providerKey: string;
    userId: string;
  },
) {
  return await db.transaction(async (tx) => {
    const providerKeyEncrypted = encryptProviderKey(
      providerName,
      providerKey,
      providerKeySecret,
    );

    await tx.insert(schema.providerKeys).values({
      projectId,
      providerKeyEncrypted,
      providerName,
      partiallyHiddenKey: hideApiKey(providerKey),
    });

    return await getProjectWithKeys(tx, projectId);
  });
}

export async function getProviderKeys(db: HydraDb, projectId: string) {
  return await db.query.providerKeys.findMany({
    where: eq(schema.providerKeys.projectId, projectId),
  });
}

export async function deleteProviderKey(
  db: HydraDb,
  projectId: string,
  providerKeyId: string,
) {
  return await db.transaction(async (tx) => {
    await tx
      .delete(schema.providerKeys)
      .where(
        and(
          eq(schema.providerKeys.id, providerKeyId),
          eq(schema.providerKeys.projectId, projectId),
        ),
      );

    return await getProjectWithKeys(tx, projectId);
  });
}
