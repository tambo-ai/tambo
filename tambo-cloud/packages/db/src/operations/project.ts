import {
  AgentProviderType,
  AiProviderType,
  encryptApiKey,
  encryptProviderKey,
  hashKey,
  hideApiKey,
  MCPTransport,
  OAuthValidationMode,
  ToolProviderType,
  type CustomLlmParameters,
} from "@tambo-ai-cloud/core";
import { randomBytes } from "crypto";
import { and, eq, isNotNull, isNull, sql } from "drizzle-orm";
import * as schema from "../schema";
import type { HydraDb } from "../types";

export async function createProject(
  db: HydraDb,
  {
    name,
    userId,
    customInstructions,
    allowSystemPromptOverride = false,
    role = "admin",
    defaultLlmProviderName,
    defaultLlmModelName,
    customLlmModelName,
    customLlmBaseURL,
  }: {
    name: string;
    userId: string;
    customInstructions?: string;
    allowSystemPromptOverride?: boolean;
    defaultLlmProviderName?: string;
    defaultLlmModelName?: string;
    customLlmModelName?: string;
    customLlmBaseURL?: string;
    role?: string;
  },
) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  return await db.transaction(async (tx) => {
    const [project] = await tx
      .insert(schema.projects)
      .values({
        name: name || "New Project",
        customInstructions,
        allowSystemPromptOverride,
        defaultLlmProviderName,
        defaultLlmModelName,
        customLlmModelName,
        customLlmBaseURL,
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
      isTokenRequired: project.isTokenRequired,
      providerType: project.providerType,
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
    orderBy: (projects, { desc }) => [desc(projects.updatedAt)],
  });
}

export async function getProject(db: HydraDb, id: string) {
  return await db.query.projects.findFirst({
    where: (projects, { eq }) => eq(projects.id, id),
    with: {
      members: true,
    },
  });
}

export async function getProjectWithKeys(db: HydraDb, id: string) {
  return await db.query.projects.findFirst({
    where: (projects, { eq }) => eq(projects.id, id),
    with: {
      members: true,
      apiKeys: true,
      providerKeys: true,
    },
  });
}

export async function getProjectApiKeyId(
  db: HydraDb,
  projectId: string,
  hashedApiKey: string,
) {
  const apiKey = await db.query.apiKeys.findFirst({
    where: and(
      eq(schema.apiKeys.projectId, projectId),
      eq(schema.apiKeys.hashedKey, hashedApiKey),
    ),
    columns: {
      id: true,
    },
  });
  return apiKey?.id ?? null;
}

export async function updateProject(
  db: HydraDb,
  id: string,
  {
    name,
    customInstructions,
    defaultLlmProviderName,
    defaultLlmModelName,
    customLlmModelName,
    customLlmBaseURL,
    maxInputTokens,
    maxToolCallLimit,
    isTokenRequired,
    providerType,
    agentProviderType,
    agentUrl,
    agentName,
    customLlmParameters,
    agentHeaders,
    allowSystemPromptOverride,
  }: {
    name?: string;
    customInstructions?: string | null;
    defaultLlmProviderName?: string | null;
    defaultLlmModelName?: string | null;
    customLlmModelName?: string | null;
    customLlmBaseURL?: string | null;
    maxInputTokens?: number | null;
    maxToolCallLimit?: number;
    isTokenRequired?: boolean;
    providerType?: AiProviderType;
    agentProviderType?: AgentProviderType;
    agentUrl?: string | null;
    agentName?: string | null;
    customLlmParameters?: CustomLlmParameters | null;
    agentHeaders?: Record<string, string> | null;
    allowSystemPromptOverride?: boolean;
  },
) {
  // Create update object with only provided fields
  const updateData: Partial<typeof schema.projects.$inferInsert> = {};
  if (name !== undefined) updateData.name = name;
  if (customInstructions !== undefined)
    updateData.customInstructions = customInstructions;
  if (defaultLlmProviderName !== undefined)
    updateData.defaultLlmProviderName = defaultLlmProviderName;
  if (defaultLlmModelName !== undefined)
    updateData.defaultLlmModelName = defaultLlmModelName;
  if (customLlmModelName !== undefined)
    updateData.customLlmModelName = customLlmModelName;
  if (customLlmBaseURL !== undefined)
    updateData.customLlmBaseURL = customLlmBaseURL;
  if (maxInputTokens !== undefined) {
    if (maxInputTokens !== null && maxInputTokens < 1) {
      throw new Error("Max input tokens must be greater than 0");
    }
    updateData.maxInputTokens = maxInputTokens;
  }
  if (maxToolCallLimit !== undefined) {
    if (maxToolCallLimit < 1) {
      throw new Error("Max tool call limit must be greater than 0");
    }
    updateData.maxToolCallLimit = maxToolCallLimit;
  }
  if (isTokenRequired !== undefined) {
    updateData.isTokenRequired = isTokenRequired;
  }
  if (providerType !== undefined) {
    updateData.providerType = providerType;
  }
  if (agentProviderType !== undefined) {
    updateData.agentProviderType = agentProviderType;
  }
  if (agentUrl !== undefined) {
    updateData.agentUrl = agentUrl;
  }
  if (agentName !== undefined) {
    updateData.agentName = agentName;
  }
  if (customLlmParameters !== undefined) {
    updateData.customLlmParameters = customLlmParameters;
  }
  if (agentHeaders !== undefined) {
    updateData.agentHeaders = agentHeaders ?? null;
  }
  if (allowSystemPromptOverride !== undefined) {
    updateData.allowSystemPromptOverride = allowSystemPromptOverride;
  }

  // Only perform update if there are fields to update
  if (Object.keys(updateData).length === 0) {
    const project = await getProject(db, id);
    return project;
  }

  const updated = await db
    .update(schema.projects)
    // Always bump the project timestamp on any update for consistency
    .set({ ...updateData, updatedAt: sql`now()` })
    .where(eq(schema.projects.id, id))
    .returning();
  return updated.length > 0 ? updated[0] : undefined;
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
    apiKeyId,
    lastUsed,
  }: {
    apiKeyId: string;
    lastUsed: Date;
  },
) {
  const updated = await db
    .update(schema.apiKeys)
    .set({ lastUsedAt: lastUsed })
    .where(and(eq(schema.apiKeys.id, apiKeyId)))
    .returning();

  if (!updated.length) {
    throw new Error("API Key not found");
  }
  return updated[0];
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
  const hashedKey = hashKey(apiKey);

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

    await updateApiKeyStatus(tx, projectId, true);
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

export async function updateApiKeyStatus(
  db: HydraDb,
  projectId: string,
  hasApiKey: boolean,
): Promise<void> {
  const usage = await db.query.projectMessageUsage.findFirst({
    where: eq(schema.projectMessageUsage.projectId, projectId),
  });

  if (usage) {
    await db
      .update(schema.projectMessageUsage)
      .set({
        hasApiKey,
        updatedAt: sql`now()`,
      })
      .where(eq(schema.projectMessageUsage.projectId, projectId));
  } else {
    await db.insert(schema.projectMessageUsage).values({
      projectId,
      hasApiKey,
    });
  }
}

export async function getProjectMcpServers(
  db: HydraDb,
  projectId: string,
  contextKey: string | null,
) {
  const providers = await db.query.toolProviders.findMany({
    where: and(
      eq(schema.toolProviders.projectId, projectId),
      eq(schema.toolProviders.type, ToolProviderType.MCP),
      isNotNull(schema.toolProviders.url),
    ),
    orderBy: (toolProviders, { asc }) => [asc(toolProviders.createdAt)],
    with: {
      contexts: {
        where:
          contextKey === null
            ? isNull(schema.toolProviderUserContexts.contextKey)
            : eq(schema.toolProviderUserContexts.contextKey, contextKey),
      },
    },
  });
  return providers;
}

export async function projectHasMcpServers(
  db: HydraDb,
  projectId: string,
): Promise<boolean> {
  const result = await db.query.toolProviders.findFirst({
    where: and(
      eq(schema.toolProviders.projectId, projectId),
      eq(schema.toolProviders.type, ToolProviderType.MCP),
    ),
    columns: {
      id: true,
    },
  });
  return !!result;
}

export async function createMcpServer(
  db: HydraDb,
  projectId: string,
  url: string,
  customHeaders: Record<string, string> | undefined,
  mcpTransport: MCPTransport,
  mcpRequiresAuth: boolean,
  serverKey: string,
) {
  const [server] = await db
    .insert(schema.toolProviders)
    .values({
      projectId,
      type: ToolProviderType.MCP,
      url,
      serverKey,
      customHeaders: customHeaders || {},
      mcpTransport,
      mcpRequiresAuth,
    })
    .returning();

  return {
    id: server.id,
    url: server.url!,
    serverKey: server.serverKey,
    customHeaders: server.customHeaders,
    mcpTransport: server.mcpTransport,
    mcpRequiresAuth: server.mcpRequiresAuth,
  };
}

export async function deleteMcpServer(
  db: HydraDb,
  projectId: string,
  serverId: string,
) {
  return await db
    .delete(schema.toolProviders)
    .where(
      and(
        eq(schema.toolProviders.id, serverId),
        eq(schema.toolProviders.projectId, projectId),
      ),
    );
}

export async function updateMcpServer(
  db: HydraDb,
  projectId: string,
  serverId: string,
  url: string,
  customHeaders: Record<string, string> | undefined,
  mcpTransport: MCPTransport,
  mcpRequiresAuth: boolean,
  serverKey: string,
) {
  const [server] = await db
    .update(schema.toolProviders)
    .set({
      url,
      serverKey,
      customHeaders: customHeaders || {},
      mcpTransport,
      mcpRequiresAuth,
      updatedAt: sql`now()`,
    })
    .where(
      and(
        eq(schema.toolProviders.id, serverId),
        eq(schema.toolProviders.projectId, projectId),
      ),
    )
    .returning();

  return {
    id: server.id,
    url: server.url!,
    serverKey: server.serverKey,
    customHeaders: server.customHeaders,
    mcpTransport: server.mcpTransport,
    mcpRequiresAuth: server.mcpRequiresAuth,
  };
}

export async function getMcpServer(
  db: HydraDb,
  projectId: string,
  serverId: string,
  contextKey: string | null,
) {
  return await db.query.toolProviders.findFirst({
    where: and(
      eq(schema.toolProviders.id, serverId),
      eq(schema.toolProviders.projectId, projectId),
    ),
    with: {
      contexts: {
        where:
          contextKey === null
            ? isNull(schema.toolProviderUserContexts.contextKey)
            : eq(schema.toolProviderUserContexts.contextKey, contextKey),
      },
    },
  });
}

/**
 * Get OAuth validation settings for a project
 */
export async function getOAuthValidationSettings(
  db: HydraDb,
  projectId: string,
) {
  const project = await db.query.projects.findFirst({
    where: eq(schema.projects.id, projectId),
    columns: {
      oauthValidationMode: true,
      oauthSecretKeyEncrypted: true,
      oauthPublicKey: true,
    },
  });

  if (!project) {
    return null;
  }

  return {
    mode: project.oauthValidationMode,
    secretKeyEncrypted: project.oauthSecretKeyEncrypted,
    publicKey: project.oauthPublicKey,
  };
}

/**
 * Update OAuth validation settings for a project
 */
export async function updateOAuthValidationSettings(
  db: HydraDb,
  projectId: string,
  settings: {
    mode: OAuthValidationMode;
    secretKeyEncrypted?: string | null;
    publicKey?: string | null;
  },
) {
  return await db
    .update(schema.projects)
    .set({
      oauthValidationMode: settings.mode,
      oauthSecretKeyEncrypted: settings.secretKeyEncrypted,
      oauthPublicKey: settings.publicKey,
      updatedAt: sql`now()`,
    })
    .where(eq(schema.projects.id, projectId))
    .returning();
}

export async function getProjectMembers(db: HydraDb, id: string) {
  return await db.query.projects.findFirst({
    where: (projects, { eq }) => eq(projects.id, id),
    with: {
      members: {
        with: {
          user: true,
        },
      },
    },
  });
}

/**
 * Get the per-project bearer token secret used for signing/verifying
 * first-party OAuth bearer access tokens.
 */
export async function getBearerTokenSecret(
  db: HydraDb,
  projectId: string,
): Promise<string | null> {
  const row = await db.query.projects.findFirst({
    where: eq(schema.projects.id, projectId),
    columns: {
      bearerTokenSecret: true,
    },
  });
  return row?.bearerTokenSecret ?? null;
}
