import { getComposio } from "@/lib/composio";
import { customHeadersSchema } from "@/lib/headerValidation";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  ComposioAuthMode,
  ComposioConnectorConfig,
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
                mode: scheme.mode as ComposioAuthMode,
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

      await operations.upsertComposioAuth(
        ctx.db,
        toolProvider.id,
        input.contextKey,
        input.authMode,
        input.authFields,
      );
    }),
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
      };
    }),
});
