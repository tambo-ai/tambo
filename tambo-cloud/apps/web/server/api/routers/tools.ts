import { getBaseUrl } from "@/lib/base-url";
import { getComposio } from "@/lib/composio";
import { customHeadersSchema } from "@/lib/headerValidation";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { auth } from "@modelcontextprotocol/sdk/client/auth.js";
import {
  ComposioAuthMode,
  ComposioConnectorConfig,
  MCPTransport,
  ToolProviderType,
  validateMcpServer,
} from "@tambo-ai-cloud/core";
import { HydraDb, operations, schema } from "@tambo-ai-cloud/db";
import { TRPCError } from "@trpc/server";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { z } from "zod";
import { OAuthLocalProvider } from "../../../lib/OAuthLocalProvider";
import { validateSafeURL, validateServerUrl } from "../../../lib/urlSecurity";

export const toolsRouter = createTRPCRouter({
  listApps: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
      );
      const composio = getComposio();
      const enabledApps = await operations.getComposioApps(
        ctx.db,
        input.projectId,
      );
      const enabledAppIds = enabledApps.map((app) => app.composioAppId);
      const apps = await composio.apps.list();

      return apps
        .map((app) => ({
          appId: app.appId,
          name: app.name,
          no_auth: app.no_auth,
          auth_schemes: Array.isArray(app.auth_schemes)
            ? app.auth_schemes.map((scheme: ComposioConnectorConfig) => ({
                ...scheme,
                mode: scheme.mode,
              }))
            : undefined,
          tags: app.tags as unknown as string[],
          logo: app.logo,
          description: app.description,
          enabled: enabledAppIds.includes(app.appId),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }),
  enableApp: protectedProcedure
    .input(z.object({ projectId: z.string(), appId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
      );
      console.log("Enabling app:", input.appId, " / ");
      await operations.enableComposioApp(ctx.db, input.projectId, input.appId);
    }),
  disableApp: protectedProcedure
    .input(z.object({ projectId: z.string(), appId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
      );
      await operations.disableComposioApp(ctx.db, input.projectId, input.appId);
    }),
  listMcpServers: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
      );

      const servers = await operations.getProjectMcpServers(
        ctx.db,
        input.projectId,
      );
      return servers;
    }),
  addMcpServer: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        url: z
          .string()
          .url()
          .refine(
            validateServerUrl,
            "URL appears to be unsafe: must not point to internal, local, or private networks",
          ),
        customHeaders: customHeadersSchema,
        mcpTransport: z.nativeEnum(MCPTransport),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
      );

      const { projectId, url, customHeaders, mcpTransport } = input;
      const parsedUrl = new URL(url);

      // Perform additional safety checks
      const safetyCheck = await validateSafeURL(parsedUrl.hostname);
      if (!safetyCheck.safe) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `URL validation failed: ${safetyCheck.reason}`,
        });
      }

      const server = await operations.createMcpServer(
        ctx.db,
        projectId,
        url,
        customHeaders,
        mcpTransport,
      );
      return server;
    }),
  validateMcpServer: protectedProcedure
    .input(
      z.object({
        url: z
          .string()
          .url()
          .refine(
            validateServerUrl,
            "URL appears to be unsafe: must not point to internal, local, or private networks",
          ),
        customHeaders: customHeadersSchema,
        mcpTransport: z.nativeEnum(MCPTransport),
      }),
    )
    .mutation(async ({ input }) => {
      const { url, customHeaders, mcpTransport } = input;

      return await validateMcpServer({
        url,
        customHeaders,
        mcpTransport,
      });
    }),
  authorizeMcpServer: protectedProcedure
    .input(
      z.object({
        toolProviderId: z.string(),
        contextKey: z.string().nullable(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { contextKey, toolProviderId } = input;
      const saveAuthUrl = `${getBaseUrl()}/oauth/callback`;
      try {
        const db = ctx.db;
        const toolProvider = await db.query.toolProviders.findFirst({
          where: and(
            eq(schema.toolProviders.id, toolProviderId),
            eq(schema.toolProviders.type, ToolProviderType.MCP),
            isNotNull(schema.toolProviders.url),
          ),
        });
        if (!toolProvider) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Tool provider not found",
          });
        }
        const { url, projectId } = toolProvider;
        await operations.ensureProjectAccess(
          ctx.db,
          projectId,
          ctx.session.user.id,
        );

        if (!url) {
          // cannot happen due to validation in the query
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Tool provider missing MCP URL",
          });
        }
        const toolProviderUserContextId = await upsertToolProviderUserContext(
          db,
          toolProviderId,
          contextKey,
        );

        const localProvider = new OAuthLocalProvider(
          db,
          toolProviderUserContextId,
          {
            saveAuthUrl: saveAuthUrl,
            serverUrl: url,
          },
        );
        console.log("--> starting auth: ", url);
        const result = await auth(localProvider, { serverUrl: url });
        console.log("Auth result:", result);
        if (result === "AUTHORIZED") {
          return {
            success: true,
          };
        }
        if (result === "REDIRECT") {
          return {
            success: true,
            redirectUrl: localProvider.redirectStartAuthUrl?.toString(),
          };
        }
        return { success: false };
      } catch (error: any) {
        console.error(error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),
  deleteMcpServer: protectedProcedure
    .input(z.object({ projectId: z.string(), serverId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
      );

      const { projectId, serverId } = input;
      await operations.deleteMcpServer(ctx.db, projectId, serverId);
      return true;
    }),
  updateMcpServer: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        serverId: z.string(),
        url: z
          .string()
          .url()
          .refine(
            validateServerUrl,
            "URL appears to be unsafe: must not point to internal, local, or private networks",
          ),
        customHeaders: customHeadersSchema,
        mcpTransport: z.nativeEnum(MCPTransport),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
      );

      const { projectId, serverId, url, customHeaders, mcpTransport } = input;
      const server = await operations.updateMcpServer(
        ctx.db,
        projectId,
        serverId,
        url,
        customHeaders,
        mcpTransport,
      );
      return server;
    }),
  updateComposioAuth: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        appId: z.string(),
        contextKey: z.string().nullable(),
        authMode: z.nativeEnum(ComposioAuthMode),
        authFields: z.record(z.string(), z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
      );

      const toolProvider = await operations.getComposioAppProvider(
        ctx.db,
        input.projectId,
        input.appId,
      );

      if (!toolProvider) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tool provider not found",
        });
      }
      if (!toolProvider.composioAppId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "App not found",
        });
      }

      const {
        integrationId,
        connectedAccountId,
        redirectUrl,
        connectionStatus,
      } = await ensureComposioAccount(toolProvider, input);

      await operations.upsertComposioAuth(
        ctx.db,
        toolProvider.id,
        input.contextKey,
        {
          composioIntegrationId: integrationId,
          composioAuthSchemaMode: input.authMode,
          composioAuthFields: input.authFields,
          composioConnectedAccountId: connectedAccountId,
          // this is the only chance we have to store the redirect url
          composioRedirectUrl: redirectUrl,
          composioConnectedAccountStatus: connectionStatus,
        },
      );
      return {
        redirectUrl,
        connectionStatus,
      };
    }),
  /**
   * Get the current auth context for a tool provider
   * @param projectId - The project ID
   * @param appId - The app ID
   * @param contextKey - The context key
   * @returns The current auth context
   */
  getComposioAuth: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        appId: z.string(),
        contextKey: z.string().nullable(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
      );

      const toolProvider = await operations.getComposioAppProvider(
        ctx.db,
        input.projectId,
        input.appId,
      );

      if (!toolProvider) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tool provider not found",
        });
      }

      // Get the current auth context
      const [context] = await ctx.db.query.toolProviderUserContexts.findMany({
        where: and(
          eq(schema.toolProviderUserContexts.toolProviderId, toolProvider.id),
          input.contextKey
            ? eq(schema.toolProviderUserContexts.contextKey, input.contextKey)
            : isNull(schema.toolProviderUserContexts.contextKey),
        ),
      });

      if (!context) {
        return null;
      }

      return {
        mode: context.composioAuthSchemaMode,
        fields: context.composioAuthFields,
        redirectUrl: context.composioRedirectUrl,
        status: context.composioConnectedAccountStatus,
        toolProviderId: toolProvider.id,
        integrationId: context.composioIntegrationId,
        connectedAccountId: context.composioConnectedAccountId,
      };
    }),
  checkComposioConnectedAccountStatus: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        toolProviderId: z.string(),
        contextKey: z.string().nullable(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
      );

      // Get the current auth context
      const [context] = await ctx.db.query.toolProviderUserContexts.findMany({
        where: and(
          eq(
            schema.toolProviderUserContexts.toolProviderId,
            input.toolProviderId,
          ),
          input.contextKey
            ? eq(schema.toolProviderUserContexts.contextKey, input.contextKey)
            : isNull(schema.toolProviderUserContexts.contextKey),
        ),
      });

      if (!context || !context.composioConnectedAccountId) {
        return { status: "NOT_CONNECTED" as const };
      }

      const composio = getComposio();
      const connectedAccount = await composio.connectedAccounts.get({
        connectedAccountId: context.composioConnectedAccountId,
      });

      // Update the status in the database
      await operations.upsertComposioAuth(
        ctx.db,
        input.toolProviderId,
        input.contextKey,
        {
          composioConnectedAccountStatus: connectedAccount.status,
          // clear the redirect url if the account is active
          composioRedirectUrl:
            connectedAccount.status === "ACTIVE"
              ? null
              : context.composioRedirectUrl,
        },
      );

      return {
        status: connectedAccount.status,
        lastCheckedAt: new Date(),
      };
    }),
});

/** Create a tool provider user context for the given tool provider id,
 * returning the id of the created or existing tool provider user context */
async function upsertToolProviderUserContext(
  db: HydraDb,
  toolProviderId: string,
  contextKey: string | null,
) {
  return await db.transaction(async (tx) => {
    const toolProviderUserContext =
      await tx.query.toolProviderUserContexts.findFirst({
        where: eq(
          schema.toolProviderUserContexts.toolProviderId,
          toolProviderId,
        ),
      });
    if (toolProviderUserContext) {
      return toolProviderUserContext.id;
    }

    const [newToolProviderUserContext] = await tx
      .insert(schema.toolProviderUserContexts)
      .values({
        toolProviderId,
        contextKey,
      })
      .returning();

    return newToolProviderUserContext.id;
  });
}

async function ensureComposioAccount(
  toolProvider: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    projectId: string;
    type: ToolProviderType;
    url: string | null;
    composioAppId: string | null;
    customHeaders: Record<string, string>;
  },
  input: {
    projectId: string;
    contextKey: string | null;
    appId: string;
    authMode: ComposioAuthMode;
    authFields: Record<string, string>;
  },
) {
  const composio = getComposio();
  // Ugh this is a hack: we need to get the app from the list of apps, because the appId is not the same as the appUniqueKey
  // TODO: should we rekey this by appName/appUniqueKey? the composio docs are not consistent about thiss
  const apps = await composio.apps.list();
  const app = apps.find((app) => app.appId === toolProvider.composioAppId);
  if (!app?.key) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "App not found",
    });
  }

  const integration = await composio.integrations.getOrCreateIntegration({
    name: `Integration for ${input.contextKey ? input.contextKey : "all users"} in project ${input.projectId}`,
    appUniqueKey: app.key,
    useComposioAuth: true,
    authConfig: input.authFields,
    authScheme: input.authMode,
  });

  if (!integration.id) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Integration not found",
    });
  }
  // const ca = await composio.connectedAccounts.get({ connectedAccountId });
  const connectionRequest = await composio.connectedAccounts.initiate({
    integrationId: integration.id,
  });

  const integrationId = integration.id;
  const connectedAccountId = connectionRequest.connectedAccountId;
  const redirectUrl = connectionRequest.redirectUrl;
  const connectionStatus = connectionRequest.connectionStatus;

  return {
    connectionRequest,
    integrationId,
    connectedAccountId,
    redirectUrl,
    connectionStatus,
  };
}
