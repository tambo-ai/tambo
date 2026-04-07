import { customHeadersSchema } from "@/lib/headerValidation";
import {
  authorizeMcpServerOutputSchema,
  deleteMcpServerInput,
  inspectMcpServerInput,
  inspectMcpServerOutputSchema,
  listMcpServersInput,
  mcpManualClientRegistrationInput,
  mcpServerDetailSchema,
  mcpServerSchema,
} from "@/lib/schemas/mcp";
import {
  authorizeMcpServer,
  getOAuthProvider,
  getServerValidity,
} from "../services/mcp-authorization";
import { validateSafeURL, validateServerUrl } from "@/lib/urlSecurity";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  MCPClient,
  MCPTransport,
  isValidServerKey,
  validateMcpServer,
} from "@tambo-ai-cloud/core";
import { HydraDb, operations } from "@tambo-ai-cloud/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v3";

/**
 * Get all existing serverKeys for a project to validate uniqueness
 */
async function getExistingServerKeys(
  db: HydraDb,
  projectId: string,
  excludeServerId?: string,
): Promise<string[]> {
  const servers = await operations.getProjectMcpServers(db, projectId, null);
  return servers
    .filter((server) => !excludeServerId || server.id !== excludeServerId)
    .map((server) => server.serverKey)
    .filter((key) => key !== ""); // Exclude empty serverKeys during transition
}

export const toolsRouter = createTRPCRouter({
  listMcpServers: protectedProcedure
    .input(listMcpServersInput)
    .output(z.array(mcpServerSchema))
    .query(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.user.id,
      );

      const servers = await operations.getProjectMcpServers(
        ctx.db,
        input.projectId,
        null,
      );
      return servers.map((server) => ({
        id: server.id,
        url: server.url,
        serverKey: server.serverKey,
        customHeaders: server.customHeaders,
        mcpRequiresAuth: server.mcpRequiresAuth,
        mcpIsAuthed:
          !!server.contexts.length &&
          !!server.contexts[0].mcpOauthTokens?.access_token,

        mcpTransport: server.mcpTransport,
      }));
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
        serverKey: z
          .string()
          .trim()
          .refine(
            isValidServerKey,
            "Server key must be at least 2 characters and contain only alphanumeric characters and underscores",
          ),
        customHeaders: customHeadersSchema,
        mcpTransport: z.nativeEnum(MCPTransport),
      }),
    )
    .output(mcpServerDetailSchema)
    .mutation(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.user.id,
      );

      let { serverKey } = input;
      const { projectId, url, customHeaders, mcpTransport } = input;
      const parsedUrl = new URL(url);

      // Normalize minor whitespace only (preserve original casing as requested)
      serverKey = serverKey.trim();

      // Check for duplicate serverKey in the project
      const existingKeys = await getExistingServerKeys(ctx.db, projectId);
      if (existingKeys.includes(serverKey)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Server key "${serverKey}" is already in use by another MCP server in this project`,
        });
      }

      // Perform additional safety checks
      const safetyCheck = await validateSafeURL(parsedUrl.hostname);
      if (!safetyCheck.safe) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `URL validation failed: ${safetyCheck.reason}`,
        });
      }
      const validity = await validateMcpServer({
        url,
        customHeaders,
        mcpTransport,
        // Cannot pass in oauthProvider, because we don't have the client information yet
      });
      if (!validity.valid) {
        // Allow creating a server when auth is required so the user can proceed
        if (!validity.requiresAuth) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `MCP server validation failed: ${validity.error}`,
          });
        }
      }

      const server = await operations.createMcpServer(
        ctx.db,
        projectId,
        url,
        customHeaders,
        mcpTransport,
        validity.requiresAuth,
        serverKey,
      );

      return {
        id: server.id,
        url: server.url,
        serverKey: server.serverKey,
        customHeaders: server.customHeaders,
        mcpTransport: server.mcpTransport,
        mcpRequiresAuth: server.mcpRequiresAuth,
        mcpCapabilities: validity.capabilities,
        mcpVersion: validity.version,
        mcpInstructions: validity.instructions,
      };
    }),
  authorizeMcpServer: protectedProcedure
    .input(
      z.object({
        toolProviderId: z.string(),
        contextKey: z.string().nullable(),
        clientRegistration: mcpManualClientRegistrationInput.optional(),
      }),
    )
    .output(authorizeMcpServerOutputSchema)
    .mutation(async ({ input, ctx }) => {
      return await authorizeMcpServer({
        db: ctx.db,
        userId: ctx.user.id,
        toolProviderId: input.toolProviderId,
        contextKey: input.contextKey,
        clientRegistration: input.clientRegistration,
      });
    }),
  deleteMcpServer: protectedProcedure
    .input(deleteMcpServerInput)
    .output(z.boolean())
    .mutation(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.user.id,
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
        serverKey: z
          .string()
          .trim()
          .refine(
            isValidServerKey,
            "Server key must be at least 2 characters and contain only alphanumeric characters and underscores",
          ),
        customHeaders: customHeadersSchema,
        mcpTransport: z.nativeEnum(MCPTransport),
      }),
    )
    .output(mcpServerDetailSchema)
    .mutation(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.user.id,
      );

      let { serverKey } = input;
      const { projectId, serverId, url, customHeaders, mcpTransport } = input;

      // Normalize minor whitespace only (preserve original casing as requested)
      serverKey = serverKey.trim();

      // Check for duplicate serverKey in the project (excluding current server)
      const existingKeys = await getExistingServerKeys(
        ctx.db,
        projectId,
        serverId,
      );
      if (existingKeys.includes(serverKey)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Server key "${serverKey}" is already in use by another MCP server in this project`,
        });
      }

      const validity = await getServerValidity(
        ctx.db,
        projectId,
        serverId,
        url,
        customHeaders,
        mcpTransport,
      );

      if (!validity.valid) {
        // Allow saving updates needed to proceed with auth when the server requires authorization
        if (validity.requiresAuth) {
          const server = await operations.updateMcpServer(
            ctx.db,
            projectId,
            serverId,
            url,
            customHeaders,
            mcpTransport,
            true,
            serverKey,
          );
          return {
            id: server.id,
            url: server.url,
            serverKey: server.serverKey,
            customHeaders: server.customHeaders,
            mcpTransport: server.mcpTransport,
            mcpRequiresAuth: server.mcpRequiresAuth,
            mcpCapabilities: validity.capabilities,
            mcpVersion: validity.version,
            mcpInstructions: validity.instructions,
          };
        }
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `MCP server validation failed: ${validity.error}`,
        });
      }

      const server = await operations.updateMcpServer(
        ctx.db,
        projectId,
        serverId,
        url,
        customHeaders,
        mcpTransport,
        validity.requiresAuth,
        serverKey,
      );
      return {
        id: server.id,
        url: server.url,
        serverKey: server.serverKey,
        customHeaders: server.customHeaders,
        mcpTransport: server.mcpTransport,
        mcpRequiresAuth: server.mcpRequiresAuth,
        mcpCapabilities: validity.capabilities,
        mcpVersion: validity.version,
        mcpInstructions: validity.instructions,
      };
    }),

  inspectMcpServer: protectedProcedure
    .input(inspectMcpServerInput)
    .output(inspectMcpServerOutputSchema)
    .query(async ({ ctx, input }) => {
      await operations.ensureProjectAccess(
        ctx.db,
        input.projectId,
        ctx.user.id,
      );

      const server = await operations.getMcpServer(
        ctx.db,
        input.projectId,
        input.serverId,
        null,
      );

      if (!server || !server.url) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "MCP server not found",
        });
      }

      if (server.mcpRequiresAuth && !server.contexts.length) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Server requires authentication",
        });
      }

      const authProvider = await getOAuthProvider(ctx.db, {
        mcpServer: server,
        url: server.url,
      });
      const mcpClient = await MCPClient.create(
        server.url,
        server.mcpTransport,
        server.customHeaders,
        authProvider,
        undefined, // since we're not doing anything with this session, it's ok to just start a new session
      );

      const tools = await mcpClient.listTools();
      const validity = await validateMcpServer({
        url: server.url,
        customHeaders: server.customHeaders,
        mcpTransport: server.mcpTransport,
        oauthProvider: authProvider,
      });

      return {
        tools,
        serverInfo: {
          version: validity.version,
          instructions: validity.instructions,
          capabilities: validity.capabilities,
        },
      };
    }),
});
