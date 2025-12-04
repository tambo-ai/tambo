import { env } from "@/lib/env";
import {
  updateProjectAgentSettingsInput,
  updateProjectAgentSettingsOutputSchema,
} from "@/lib/schemas/agent";
import {
  apiKeySchema,
  deleteApiKeyInput,
  generateApiKeyInput,
  generatedApiKeySchema,
  getApiKeysInput,
} from "@/lib/schemas/api-key";
import {
  getProjectLlmSettingsInput,
  projectLlmSettingsSchema,
  updateProjectLlmSettingsInput,
  updateProjectLlmSettingsOutputSchema,
} from "@/lib/schemas/llm";
import {
  getOAuthValidationSettingsInput,
  oauthValidationSettingsSchema,
  updateOAuthValidationSettingsInput,
  updateOAuthValidationSettingsOutputSchema,
} from "@/lib/schemas/oauth";
import {
  createProjectInput,
  createProjectOutputSchema,
  getProjectByIdInput,
  getTotalMessageUsageInput,
  getTotalUsersInput,
  getUserProjectsInput,
  projectDetailSchema,
  projectSchema,
  removeProjectInput,
  totalMessageUsageSchema,
  totalUsersSchema,
  updateProjectInput,
  updateProjectOutputSchema,
} from "@/lib/schemas/project";
import { validateSafeURL } from "@/lib/urlSecurity";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  AgentProviderType,
  AiProviderType,
  deriveServerKey,
  encryptOAuthSecretKey,
  hashKey,
  llmProviderConfig,
  MCPTransport,
  OAuthValidationMode,
  validateMcpServer,
} from "@tambo-ai-cloud/core";
import type { HydraDb } from "@tambo-ai-cloud/db";
import { operations, schema } from "@tambo-ai-cloud/db";
import { TRPCError } from "@trpc/server";
import {
  and,
  count,
  countDistinct,
  eq,
  gte,
  inArray,
  isNotNull,
  max,
  sql,
} from "drizzle-orm";
import { z } from "zod/v3";

// Helper function to get date filter based on period
function getDateFilter(period: string): Date | null {
  const now = new Date();

  switch (period) {
    case "per week":
      return new Date(now.setDate(now.getDate() - 7));
    case "per month":
      return new Date(now.setMonth(now.getMonth() - 1));
    case "all time":
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
//  Reusable helper to fetch per-day counts (messages or errors) directly
//  from the database. Keeps network traffic low by letting Postgres aggregate.
// ---------------------------------------------------------------------------
async function getDailyCounts(
  db: HydraDb,
  projectId: string,
  days: number,
  { errorsOnly = false }: { errorsOnly?: boolean } = {},
): Promise<Array<{ date: string; count: number }>> {
  // Earliest date to include
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));

  // Build where-conditions
  const conditions = [
    eq(schema.threads.projectId, projectId),
    gte(schema.messages.createdAt, startDate),
  ];
  if (errorsOnly) {
    conditions.push(isNotNull(schema.messages.error));
  }

  // Postgres DATE(<timestamp>) expression
  const dateExpr = sql<string>`date(${schema.messages.createdAt})`;

  // Aggregate in a single query
  const rows = await db
    .select({
      date: dateExpr.as("date"),
      count: count(schema.messages.id).as("count"),
    })
    .from(schema.messages)
    .innerJoin(schema.threads, eq(schema.messages.threadId, schema.threads.id))
    .where(and(...conditions))
    .groupBy(dateExpr)
    .orderBy(dateExpr);

  // Map results for O(1) look-ups
  const daily = new Map<string, number>(
    rows.map((r) => [r.date, Number(r.count ?? 0)]),
  );

  // Produce zero-filled series
  const results: Array<{ date: string; count: number }> = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const key = d.toISOString().split("T")[0];
    results.push({ date: key, count: daily.get(key) ?? 0 });
  }

  return results;
}

async function getMultiProjectDailyCounts(
  db: HydraDb,
  projectIds: string[],
  days: number,
  { errorsOnly = false }: { errorsOnly?: boolean } = {},
): Promise<Array<{ date: string; count: number }>> {
  // Earliest date to include
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));

  // Build where-conditions
  const conditions = [
    inArray(schema.threads.projectId, projectIds),
    gte(schema.messages.createdAt, startDate),
  ];
  if (errorsOnly) {
    conditions.push(isNotNull(schema.messages.error));
  }

  // Postgres DATE(<timestamp>) expression
  const dateExpr = sql<string>`date(${schema.messages.createdAt})`;

  // Aggregate in a single query
  const rows = await db
    .select({
      date: dateExpr.as("date"),
      count: count(schema.messages.id).as("count"),
    })
    .from(schema.messages)
    .innerJoin(schema.threads, eq(schema.messages.threadId, schema.threads.id))
    .where(and(...conditions))
    .groupBy(dateExpr)
    .orderBy(dateExpr);

  // Map results for O(1) look-ups
  const daily = new Map<string, number>(
    rows.map((r) => [r.date, Number(r.count ?? 0)]),
  );

  // Produce zero-filled series
  const results: Array<{ date: string; count: number }> = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const key = d.toISOString().split("T")[0];
    results.push({ date: key, count: daily.get(key) ?? 0 });
  }

  return results;
}

export const projectRouter = createTRPCRouter({
  // ---------------------------------------------------------------------
  //  Fetch a single project by ID
  // ---------------------------------------------------------------------
  getProjectById: protectedProcedure
    .input(getProjectByIdInput)
    .output(projectDetailSchema)
    .query(async ({ ctx, input: projectId }) => {
      await operations.ensureProjectAccess(ctx.db, projectId, ctx.user.id);

      const project = await ctx.db.query.projects.findFirst({
        where: eq(schema.projects.id, projectId),
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found.",
        });
      }

      // Get message and user counts for this project
      const counts = await ctx.db
        .select({
          messages: count(schema.messages.id),
          users: countDistinct(schema.threads.contextKey),
          lastMessageAt: max(schema.threads.updatedAt),
        })
        .from(schema.threads)
        .leftJoin(
          schema.messages,
          eq(schema.messages.threadId, schema.threads.id),
        )
        .where(eq(schema.threads.projectId, projectId))
        .groupBy(schema.threads.projectId);

      const stats = counts[0] ?? {
        messages: 0,
        users: 0,
        lastMessageAt: null,
      };

      return {
        id: project.id,
        name: project.name,
        userId: ctx.user.id,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        customInstructions: project.customInstructions,
        allowSystemPromptOverride: project.allowSystemPromptOverride ?? false,
        defaultLlmProviderName: project.defaultLlmProviderName,
        defaultLlmModelName: project.defaultLlmModelName,
        customLlmModelName: project.customLlmModelName,
        customLlmBaseURL: project.customLlmBaseURL,
        maxInputTokens: project.maxInputTokens,
        maxToolCallLimit: project.maxToolCallLimit,
        isTokenRequired: project.isTokenRequired,
        providerType: project.providerType,
        agentProviderType: project.agentProviderType,
        agentUrl: project.agentUrl,
        agentName: project.agentName,
        customLlmParameters: project.customLlmParameters,
        messages: Number(stats.messages ?? 0),
        users: Number(stats.users ?? 0),
        lastMessageAt: stats.lastMessageAt ?? null,
      };
    }),

  // ---------------------------------------------------------------------
  //  Fetch all projects visible to the current user with optional sorting.
  //  The default sort is by the most recent thread update ("thread_updated").
  // ---------------------------------------------------------------------
  getUserProjects: protectedProcedure
    .input(getUserProjectsInput)
    .output(z.array(projectSchema))
    .query(async ({ ctx, input }) => {
      const sortBy = input?.sort ?? "thread_updated";
      const userId = ctx.user.id;
      const projects = await operations.getProjectsForUser(ctx.db, userId);

      // ---------------------------------------------------------------------
      // Batched aggregation for message & user counts (single query)
      // ---------------------------------------------------------------------
      const projectIds = projects.map((p) => p.id);

      let aggregatedCounts = new Map<
        string,
        { messages: number; users: number; lastMessageAt: Date | null }
      >();

      if (projectIds.length) {
        const counts = await ctx.db
          .select({
            projectId: schema.threads.projectId,
            messages: count(schema.messages.id),
            users: countDistinct(schema.threads.contextKey),
            lastMessageAt: max(schema.threads.updatedAt),
          })
          .from(schema.threads)
          .innerJoin(
            schema.messages,
            eq(schema.messages.threadId, schema.threads.id),
          )
          .where(inArray(schema.threads.projectId, projectIds))
          .groupBy(schema.threads.projectId);

        aggregatedCounts = new Map(
          counts.map((c) => [
            c.projectId,
            {
              messages: Number(c.messages ?? 0),
              users: Number(c.users ?? 0),
              lastMessageAt: c.lastMessageAt ?? null,
            },
          ]),
        );
      }

      // Shape final payload using O(1) look-ups
      const result = projects.map((project) => {
        const stats = aggregatedCounts.get(project.id) ?? {
          messages: 0,
          users: 0,
          lastMessageAt: null,
        };
        return {
          id: project.id,
          name: project.name,
          userId,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          customInstructions: project.customInstructions,
          allowSystemPromptOverride: project.allowSystemPromptOverride ?? false,
          defaultLlmProviderName: project.defaultLlmProviderName,
          defaultLlmModelName: project.defaultLlmModelName,
          customLlmModelName: project.customLlmModelName,
          customLlmBaseURL: project.customLlmBaseURL,
          maxToolCallLimit: project.maxToolCallLimit,
          isTokenRequired: project.isTokenRequired,
          providerType: project.providerType,
          agentProviderType: project.agentProviderType,
          agentUrl: project.agentUrl,
          agentName: project.agentName,
          customLlmParameters: project.customLlmParameters,
          messages: stats.messages,
          users: stats.users,
          lastMessageAt: stats.lastMessageAt,
        };
      });

      // ------------------------------------------------------------
      //  Sorting
      // ------------------------------------------------------------
      if (sortBy === "thread_updated") {
        result.sort((a, b) => {
          const aTime = a.lastMessageAt
            ? new Date(a.lastMessageAt).getTime()
            : 0;
          const bTime = b.lastMessageAt
            ? new Date(b.lastMessageAt).getTime()
            : 0;
          return bTime - aTime; // Descending
        });
      } else if (sortBy === "updated") {
        result.sort((a, b) => {
          const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return bTime - aTime;
        });
      } else if (sortBy === "created") {
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      }

      return result;
    }),

  createProject: protectedProcedure
    .input(createProjectInput)
    .output(createProjectOutputSchema)
    .mutation(async ({ ctx, input }) => {
      return await operations.createProject(ctx.db, {
        name: input,
        userId: ctx.user.id,
      });
    }),
  createProject2: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        customInstructions: z.string().nullable().optional(),
        mcpServers: z
          .array(
            z.object({
              url: z.string(),
              serverKey: z.string().optional(),
              customHeaders: z.record(z.string(), z.string()),
              mcpTransport: z.nativeEnum(MCPTransport),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { name, mcpServers, customInstructions } = input;

      // Wrap the entire operation in a single DB transaction so that
      // we either commit *all* related inserts/updates or none.
      const project = await ctx.db.transaction(async (tx) => {
        const createdProject = await operations.createProject(tx, {
          name,
          userId: ctx.user.id,
          customInstructions: customInstructions ?? undefined,
          defaultLlmProviderName: undefined,
          defaultLlmModelName: undefined,
          customLlmModelName: undefined,
          customLlmBaseURL: undefined,
        });

        if (!createdProject) {
          throw new Error("Failed to create project");
        }

        if (mcpServers?.length) {
          for (const mcpServer of mcpServers) {
            const validity = await validateMcpServer({
              url: mcpServer.url,
              customHeaders: mcpServer.customHeaders,
              mcpTransport: mcpServer.mcpTransport,
            });

            if (!validity.valid) {
              // Throwing inside the transaction callback causes the transaction
              // to roll back automatically.
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `MCP server validation failed: ${validity.error}`,
              });
            }

            await operations.createMcpServer(
              tx,
              createdProject.id,
              mcpServer.url,
              mcpServer.customHeaders,
              mcpServer.mcpTransport,
              validity.requiresAuth,
              mcpServer.serverKey || deriveServerKey(mcpServer.url),
            );
          }
        }

        // Returning a value from the transaction callback makes it the
        // resolved value of `ctx.db.transaction(...)`.
        return createdProject;
      });

      return project;
    }),

  getProjectLlmSettings: protectedProcedure
    .input(getProjectLlmSettingsInput)
    .output(projectLlmSettingsSchema)
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      await operations.ensureProjectAccess(ctx.db, projectId, ctx.user.id);

      const project = await ctx.db.query.projects.findFirst({
        where: eq(schema.projects.id, projectId),
        columns: {
          defaultLlmProviderName: true,
          defaultLlmModelName: true,
          customLlmModelName: true,
          customLlmBaseURL: true,
          maxInputTokens: true,
          providerType: true,
          agentProviderType: true,
          agentUrl: true,
          agentName: true,
          agentHeaders: true,
          customLlmParameters: true,
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found.",
        });
      }
      return {
        defaultLlmProviderName: project.defaultLlmProviderName ?? null,
        defaultLlmModelName: project.defaultLlmModelName ?? null,
        customLlmModelName: project.customLlmModelName ?? null,
        customLlmBaseURL: project.customLlmBaseURL ?? null,
        maxInputTokens: project.maxInputTokens ?? null,
        providerType: project.providerType,
        agentProviderType: project.agentProviderType,
        agentUrl: project.agentUrl ?? null,
        agentName: project.agentName ?? null,
        agentHeaders: project.agentHeaders,
        customLlmParameters: project.customLlmParameters ?? null,
      };
    }),

  updateProject: protectedProcedure
    .input(updateProjectInput)
    .output(updateProjectOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const {
        projectId,
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
      } = input;
      await operations.ensureProjectAccess(ctx.db, projectId, ctx.user.id);

      const updatedProject = await operations.updateProject(ctx.db, projectId, {
        name,
        customInstructions:
          customInstructions === null ? "" : customInstructions,
        defaultLlmProviderName:
          defaultLlmProviderName === null
            ? undefined
            : (defaultLlmProviderName ?? undefined),
        defaultLlmModelName:
          defaultLlmModelName === null
            ? undefined
            : (defaultLlmModelName ?? undefined),
        customLlmModelName:
          customLlmModelName === null
            ? undefined
            : (customLlmModelName ?? undefined),
        customLlmBaseURL:
          customLlmBaseURL === null
            ? undefined
            : (customLlmBaseURL ?? undefined),
        maxInputTokens:
          maxInputTokens === null ? undefined : (maxInputTokens ?? undefined),
        maxToolCallLimit,
        isTokenRequired,
        providerType,
        agentProviderType,
        agentUrl,
        agentName,
        agentHeaders,
        customLlmParameters:
          customLlmParameters === undefined ? undefined : customLlmParameters,
        allowSystemPromptOverride,
      });

      if (!updatedProject) {
        throw new Error("Failed to update project");
      }

      return {
        id: updatedProject.id,
        name: updatedProject.name,
        userId: ctx.user.id,
        customInstructions: updatedProject.customInstructions,
        allowSystemPromptOverride: updatedProject.allowSystemPromptOverride,
        defaultLlmProviderName: updatedProject.defaultLlmProviderName,
        defaultLlmModelName: updatedProject.defaultLlmModelName,
        customLlmModelName: updatedProject.customLlmModelName,
        customLlmBaseURL: updatedProject.customLlmBaseURL,
        maxInputTokens: updatedProject.maxInputTokens,
        maxToolCallLimit: updatedProject.maxToolCallLimit,
        providerType: updatedProject.providerType,
        agentProviderType: updatedProject.agentProviderType,
        agentUrl: updatedProject.agentUrl,
        agentName: updatedProject.agentName,
        customLlmParameters: updatedProject.customLlmParameters,
        agentHeaders: updatedProject.agentHeaders,
      };
    }),

  updateProjectAgentSettings: protectedProcedure
    .input(updateProjectAgentSettingsInput)
    .output(updateProjectAgentSettingsOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const {
        projectId,
        providerType,
        agentProviderType,
        agentUrl,
        agentName,
        agentHeaders,
      } = input;

      await operations.ensureProjectAccess(ctx.db, projectId, ctx.user.id);

      // If switching to AGENT, validate mandatory fields
      if (providerType === AiProviderType.AGENT) {
        if (!agentProviderType || !agentUrl) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Agent provider and URL are required for Agent mode.",
          });
        }

        // Validate URL safety using same MCP URL validator logic
        let parsed: URL;
        try {
          parsed = new URL(agentUrl);
        } catch {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid agent URL.",
          });
        }
        const safety = await validateSafeURL(parsed.href);
        if (!safety.safe) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `URL validation failed${safety.reason ? `: ${safety.reason}` : ""}`,
          });
        }
      }

      const updatedProject = await operations.updateProject(ctx.db, projectId, {
        providerType,
        // Persist agent-specific fields only in AGENT mode; when not in AGENT mode
        // we do NOT clear previously saved values—leave them unchanged so users
        // can switch back without losing settings.
        agentProviderType:
          providerType === AiProviderType.AGENT
            ? (agentProviderType ?? AgentProviderType.CREWAI)
            : undefined,
        agentUrl: providerType === AiProviderType.AGENT ? agentUrl : undefined,
        agentName:
          providerType === AiProviderType.AGENT ? agentName : undefined,
        agentHeaders:
          providerType === AiProviderType.AGENT ? agentHeaders : undefined,
      });

      if (!updatedProject) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update agent settings.",
        });
      }

      return {
        providerType: updatedProject.providerType,
        agentProviderType: updatedProject.agentProviderType,
        agentUrl: updatedProject.agentUrl,
        agentName: updatedProject.agentName,
        agentHeaders: updatedProject.agentHeaders,
      };
    }),

  updateProjectLlmSettings: protectedProcedure
    .input(updateProjectLlmSettingsInput)
    .output(updateProjectLlmSettingsOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const {
        projectId,
        defaultLlmProviderName,
        defaultLlmModelName,
        customLlmModelName,
        customLlmBaseURL,
        customLlmParameters,
      } = input;

      // Ensure the user has access to the project before performing any further
      // (potentially expensive) validation logic.
      await operations.ensureProjectAccess(ctx.db, projectId, ctx.user.id);

      // Always work with one trimmed instance so we don't repeat `trim()` calls
      const sanitizedBaseURL =
        typeof customLlmBaseURL === "string"
          ? customLlmBaseURL.trim()
          : customLlmBaseURL;

      // --- Validate custom base-URL for OpenAI-compatible providers ------------
      if (typeof sanitizedBaseURL === "string" && sanitizedBaseURL !== "") {
        // Basic URL syntax check
        let asURL: URL;
        try {
          asURL = new URL(sanitizedBaseURL);
        } catch {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid URL provided for custom LLM base URL.",
          });
        }

        // Safety & SSRF checks (local / private networks, etc.)
        const { safe, reason } = await validateSafeURL(asURL.href);
        if (!safe) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `URL validation failed${reason ? `: ${reason}` : ""}`,
          });
        }
      }

      const updateData: Partial<{
        defaultLlmProviderName: string | null;
        defaultLlmModelName: string | null;
        customLlmModelName: string | null;
        customLlmBaseURL: string | null;
        maxInputTokens: number | null;
        customLlmParameters: typeof customLlmParameters;
      }> = {};

      if ("defaultLlmProviderName" in input) {
        updateData.defaultLlmProviderName = defaultLlmProviderName ?? null;
      }
      if ("defaultLlmModelName" in input) {
        updateData.defaultLlmModelName = defaultLlmModelName ?? null;
      }
      if ("customLlmModelName" in input) {
        updateData.customLlmModelName = customLlmModelName ?? null;
      }
      if ("customLlmBaseURL" in input) {
        // Store the trimmed value (or null if blank/undefined)
        updateData.customLlmBaseURL =
          sanitizedBaseURL && sanitizedBaseURL !== "" ? sanitizedBaseURL : null;
      }
      if ("customLlmParameters" in input) {
        updateData.customLlmParameters = customLlmParameters;
      }
      if ("maxInputTokens" in input) {
        if (defaultLlmProviderName && defaultLlmModelName) {
          const modelConfig =
            llmProviderConfig[defaultLlmProviderName]?.models?.[
              defaultLlmModelName
            ];
          if (modelConfig) {
            if (
              !input.maxInputTokens ||
              input.maxInputTokens < 1 ||
              (typeof modelConfig.inputTokenLimit === "number" &&
                input.maxInputTokens > modelConfig.inputTokenLimit)
            ) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Max input tokens must be greater than 0 and less than the model's max.",
              });
            }
          }
        }
        updateData.maxInputTokens = input.maxInputTokens;
      }

      if (
        updateData.defaultLlmProviderName !== "openai-compatible" &&
        "defaultLlmProviderName" in input
      ) {
        updateData.customLlmBaseURL = null;
      }

      if (Object.keys(updateData).length === 0) {
        const currentProject = await ctx.db.query.projects.findFirst({
          where: eq(schema.projects.id, projectId),
          columns: {
            defaultLlmProviderName: true,
            defaultLlmModelName: true,
            customLlmModelName: true,
            customLlmBaseURL: true,
            maxInputTokens: true,
            customLlmParameters: true,
          },
        });
        if (!currentProject)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Project not found.",
          });
        return {
          defaultLlmProviderName: currentProject.defaultLlmProviderName ?? null,
          defaultLlmModelName: currentProject.defaultLlmModelName ?? null,
          customLlmModelName: currentProject.customLlmModelName ?? null,
          customLlmBaseURL: currentProject.customLlmBaseURL ?? null,
          maxInputTokens: currentProject.maxInputTokens ?? null,
          customLlmParameters: currentProject.customLlmParameters ?? null,
        };
      }

      const updatedProject = await operations.updateProject(ctx.db, projectId, {
        defaultLlmProviderName: updateData.defaultLlmProviderName,
        defaultLlmModelName: updateData.defaultLlmModelName,
        customLlmModelName: updateData.customLlmModelName,
        customLlmBaseURL: updateData.customLlmBaseURL,
        maxInputTokens: updateData.maxInputTokens,
        customLlmParameters: updateData.customLlmParameters,
      });

      if (!updatedProject) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update project LLM settings.",
        });
      }
      return {
        defaultLlmProviderName: updatedProject.defaultLlmProviderName ?? null,
        defaultLlmModelName: updatedProject.defaultLlmModelName ?? null,
        customLlmModelName: updatedProject.customLlmModelName ?? null,
        customLlmBaseURL: updatedProject.customLlmBaseURL ?? null,
        maxInputTokens: updatedProject.maxInputTokens ?? null,
        customLlmParameters: updatedProject.customLlmParameters ?? null,
      };
    }),

  removeProject: protectedProcedure
    .input(removeProjectInput)
    .mutation(async ({ ctx, input: projectId }) => {
      await operations.ensureProjectAccess(ctx.db, projectId, ctx.user.id);
      await operations.deleteProject(ctx.db, projectId);
    }),

  removeMultipleProjects: protectedProcedure
    .input(z.array(z.string()).min(1, "At least one project ID is required"))
    .mutation(async ({ ctx, input: projectIds }) => {
      const userId = ctx.user.id;

      // 1. Ensure the user can access every project (in parallel for speed)
      await Promise.all(
        projectIds.map(async (id) => {
          await operations.ensureProjectAccess(ctx.db, id, userId);
        }),
      );

      // 2. Delete each project properly using the existing deleteProject operation
      // This ensures foreign key constraints and RLS policies are handled correctly
      await Promise.all(
        projectIds.map(async (id) => {
          await operations.deleteProject(ctx.db, id);
        }),
      );

      return { deletedCount: projectIds.length };
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
      await operations.ensureProjectAccess(ctx.db, projectId, ctx.user.id);

      // First delete any existing key for this provider
      await ctx.db
        .delete(schema.providerKeys)
        .where(
          and(
            eq(schema.providerKeys.projectId, projectId),
            eq(schema.providerKeys.providerName, providerName),
          ),
        );

      // Then add the new key if one was provided
      if (providerKey) {
        return await operations.addProviderKey(
          ctx.db,
          env.PROVIDER_KEY_SECRET,
          {
            projectId,
            providerName,
            providerKey,
            userId: ctx.user.id,
          },
        );
      }

      return await operations.getProjectWithKeys(ctx.db, projectId);
    }),

  getProviderKeys: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: projectId }) => {
      await operations.ensureProjectAccess(ctx.db, projectId, ctx.user.id);
      return await operations.getProviderKeys(ctx.db, projectId);
    }),

  generateApiKey: protectedProcedure
    .input(generateApiKeyInput)
    .output(generatedApiKeySchema)
    .mutation(async ({ ctx, input }) => {
      const { projectId, name } = input;
      await operations.ensureProjectAccess(ctx.db, projectId, ctx.user.id);

      const encryptedKey = await operations.createApiKey(
        ctx.db,
        env.API_KEY_SECRET,
        {
          projectId,
          userId: ctx.user.id,
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
        apiKey: encryptedKey, // already in user-facing format
      };
    }),

  getApiKeys: protectedProcedure
    .input(getApiKeysInput)
    .output(z.array(apiKeySchema))
    .query(async ({ ctx, input: projectId }) => {
      await operations.ensureProjectAccess(ctx.db, projectId, ctx.user.id);
      return await operations.getApiKeys(ctx.db, projectId);
    }),

  removeApiKey: protectedProcedure
    .input(deleteApiKeyInput)
    .mutation(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.user.id,
      );
      await operations.deleteApiKey(ctx.db, input.projectId, input.apiKeyId);
    }),

  getProjectMessageUsage: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      await operations.ensureProjectAccess(ctx.db, projectId, ctx.user.id);

      const usage = await operations.getProjectMessageUsage(ctx.db, projectId);
      if (!usage) {
        return {
          messageCount: 0,
          hasApiKey: false,
        };
      }

      return {
        messageCount: usage.messageCount,
        hasApiKey: usage.hasApiKey,
      };
    }),

  getTotalMessageUsage: protectedProcedure
    .input(getTotalMessageUsageInput)
    .output(totalMessageUsageSchema)
    .query(async ({ ctx, input }) => {
      const { period } = input;
      const userId = ctx.user.id;
      const projects = await operations.getProjectsForUser(ctx.db, userId);
      const projectIds = projects.map((p) => p.id);

      if (projectIds.length === 0) {
        return { totalMessages: 0 };
      }

      const dateFilter = getDateFilter(period);

      // count from messages table
      const whereConditions = [inArray(schema.threads.projectId, projectIds)];

      if (dateFilter) {
        whereConditions.push(gte(schema.messages.createdAt, dateFilter));
      }

      const result = await ctx.db
        .select({ count: count() })
        .from(schema.messages)
        .innerJoin(
          schema.threads,
          eq(schema.messages.threadId, schema.threads.id),
        )
        .where(and(...whereConditions));

      return { totalMessages: result[0]?.count || 0 };
    }),

  /* -------------------------------------------------------------------- */
  /*  NEW: Per-day message & error counts                                  */
  /* -------------------------------------------------------------------- */
  getProjectDailyMessages: protectedProcedure
    .input(
      z.object({
        projectId: z
          .union([z.string(), z.array(z.string()).min(1)])
          .describe("Single project ID or array of project IDs"),
        days: z.number().min(1).max(90).default(30),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { projectId, days } = input;

      // Normalize to array
      const projectIds = Array.isArray(projectId) ? projectId : [projectId];

      // Ensure the user has access to all projects
      await Promise.all(
        projectIds.map(
          async (id) =>
            await operations.ensureProjectAccess(ctx.db, id, ctx.user.id),
        ),
      );

      // Use appropriate helper based on number of projects
      let data: Array<{ date: string; count: number }>;
      if (projectIds.length === 1) {
        // Use existing single-project helper for backward compatibility
        data = await getDailyCounts(ctx.db, projectIds[0], days);
      } else {
        // Use multi-project helper
        data = await getMultiProjectDailyCounts(ctx.db, projectIds, days);
      }

      // Shape expected by the client: [{ date, messages }]
      return data.map(({ date, count }) => ({
        date,
        messages: count,
      }));
    }),

  getProjectDailyThreadErrors: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        days: z.number().min(1).max(90).default(30),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { projectId, days } = input;

      // Re-use the same authorisation check as above
      await operations.ensureProjectAccess(ctx.db, projectId, ctx.user.id);

      // Same helper, but with errorsOnly = true so we only count errored messages
      const data = await getDailyCounts(ctx.db, projectId, days, {
        errorsOnly: true,
      });

      // Shape expected by the client: [{ date, errors }]
      return data.map(({ date, count }) => ({
        date,
        errors: count,
      }));
    }),

  getTotalUsers: protectedProcedure
    .input(getTotalUsersInput)
    .output(totalUsersSchema)
    .query(async ({ ctx, input }) => {
      const { period } = input;
      const userId = ctx.user.id;
      const projects = await operations.getProjectsForUser(ctx.db, userId);
      const projectIds = projects.map((p) => p.id);

      if (projectIds.length === 0) {
        return { totalUsers: 0 };
      }

      const dateFilter = getDateFilter(period);

      const whereConditions = [
        inArray(schema.threads.projectId, projectIds),
        isNotNull(schema.threads.contextKey),
      ];

      if (dateFilter) {
        whereConditions.push(gte(schema.threads.createdAt, dateFilter));
      }

      // Get unique context keys (users) across all user's projects within period
      const uniqueUsers = await ctx.db
        .selectDistinct({ contextKey: schema.threads.contextKey })
        .from(schema.threads)
        .where(and(...whereConditions));

      return { totalUsers: uniqueUsers.length };
    }),

  // -------------------------------------------------------------------------
  //  Project Logs
  // -------------------------------------------------------------------------

  getProjectLogs: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        limit: z.number().min(1).max(100).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { projectId, limit = 20 } = input;

      await operations.ensureProjectAccess(ctx.db, projectId, ctx.user.id);

      return await operations.getRecentProjectLogEntries(
        ctx.db,
        projectId,
        limit,
      );
    }),

  // -------------------------------------------------------------------------
  //  OAuth Token Validation Settings
  // -------------------------------------------------------------------------

  getOAuthValidationSettings: protectedProcedure
    .input(getOAuthValidationSettingsInput)
    .output(oauthValidationSettingsSchema)
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      await operations.ensureProjectAccess(ctx.db, projectId, ctx.user.id);

      const settings = await operations.getOAuthValidationSettings(
        ctx.db,
        projectId,
      );

      if (!settings) {
        return {
          mode: OAuthValidationMode.NONE,
          publicKey: null,
          hasSecretKey: false,
          hasPublicKey: false,
        };
      }

      return {
        mode: settings.mode,
        hasSecretKey: !!settings.secretKeyEncrypted,
        hasPublicKey: !!settings.publicKey,
        publicKey: settings.publicKey, // Public key is safe to return
      };
    }),

  updateOAuthValidationSettings: protectedProcedure
    .input(updateOAuthValidationSettingsInput)
    .output(updateOAuthValidationSettingsOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const { projectId, mode, secretKey, publicKey, isTokenRequired } = input;
      await operations.ensureProjectAccess(ctx.db, projectId, ctx.user.id);

      // Encrypt secret key if provided
      let secretKeyEncrypted: string | null = null;
      if (secretKey && mode === OAuthValidationMode.SYMMETRIC) {
        secretKeyEncrypted = encryptOAuthSecretKey(
          secretKey,
          env.API_KEY_SECRET,
        );
      }

      // Validate inputs based on mode
      if (mode === OAuthValidationMode.SYMMETRIC && !secretKey) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Secret key is required for symmetric validation mode",
        });
      }

      if (mode === OAuthValidationMode.ASYMMETRIC_MANUAL && !publicKey) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Public key is required for manual asymmetric validation mode",
        });
      }

      const settings = {
        mode,
        secretKeyEncrypted,
        publicKey:
          mode === OAuthValidationMode.ASYMMETRIC_MANUAL ? publicKey : null,
      };

      await operations.updateOAuthValidationSettings(
        ctx.db,
        projectId,
        settings,
      );

      // Update token required setting if provided
      if (isTokenRequired !== undefined) {
        await operations.updateProject(ctx.db, projectId, {
          isTokenRequired,
        });
      }

      return { success: true };
    }),
});
