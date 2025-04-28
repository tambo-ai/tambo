import { getComposio } from "@/lib/composio";
import { customHeadersSchema } from "@/lib/headerValidation";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  ComposioAuthMode,
  ComposioConnectorConfig,
  ToolProviderType,
} from "@tambo-ai-cloud/core";
import { operations, schema } from "@tambo-ai-cloud/db";
import { TRPCError } from "@trpc/server";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { validateSafeURL, validateZodUrl } from "../../../lib/urlSecurity";

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
            validateZodUrl,
            "URL appears to be unsafe: must not point to internal, local, or private networks",
          ),
        customHeaders: customHeadersSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
      );

      const { projectId, url, customHeaders } = input;
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
      );
      return server;
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
            validateZodUrl,
            "URL appears to be unsafe: must not point to internal, local, or private networks",
          ),
        customHeaders: customHeadersSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.session.user.id,
      );

      const { projectId, serverId, url, customHeaders } = input;
      const server = await operations.updateMcpServer(
        ctx.db,
        projectId,
        serverId,
        url,
        customHeaders,
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
