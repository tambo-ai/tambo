import { getBaseUrl } from "@/lib/base-url";
import { createFetchWithTimeout } from "@/lib/fetch-with-timeout";
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
import { validateSafeURL, validateServerUrl } from "@/lib/urlSecurity";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  isManualMcpClientRegistrationRequiredError,
  requiresManualMcpClientRegistration,
  shouldReusePersistedMcpOAuthState,
} from "./mcp-oauth-registration";
import {
  auth,
  discoverAuthorizationServerMetadata,
  discoverOAuthProtectedResourceMetadata,
} from "@modelcontextprotocol/sdk/client/auth.js";
import {
  MCPClient,
  MCPTransport,
  MCP_OAUTH_AUTHORIZATION_STATUS_AUTHORIZED,
  MCP_OAUTH_AUTHORIZATION_STATUS_MANUAL_CLIENT_REGISTRATION_REQUIRED,
  MCP_OAUTH_AUTHORIZATION_STATUS_REDIRECT,
  MCP_OAUTH_MANUAL_CLIENT_REGISTRATION_REASON_DCR_FAILED,
  MCP_OAUTH_MANUAL_CLIENT_REGISTRATION_REASON_REGISTRATION_NOT_AVAILABLE,
  type McpOAuthManualClientRegistrationReason,
  ToolProviderType,
  buildMcpOAuthCallbackUrl,
  buildMcpOAuthClientMetadata,
  buildMcpOAuthClientMetadataUrl,
  canUseMcpOAuthClientMetadataUrl,
  canUseMcpOAuthRedirectBaseUrl,
  isValidServerKey,
  validateMcpServer,
} from "@tambo-ai-cloud/core";
import {
  HydraDb,
  OAuthLocalProvider,
  operations,
  schema,
} from "@tambo-ai-cloud/db";
import { TRPCError } from "@trpc/server";
import { and, eq, isNotNull } from "drizzle-orm";
import { z } from "zod/v3";

type McpServer = Awaited<
  ReturnType<typeof operations.getProjectMcpServers>
>[number];

type OAuthClientProvider = OAuthLocalProvider;
type AuthorizeMcpServerOutput = z.infer<typeof authorizeMcpServerOutputSchema>;
type ManualClientRegistrationRequiredResponse = Extract<
  AuthorizeMcpServerOutput,
  {
    status: typeof MCP_OAUTH_AUTHORIZATION_STATUS_MANUAL_CLIENT_REGISTRATION_REQUIRED;
  }
>;

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
      const { clientRegistration, contextKey, toolProviderId } = input;

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
      await operations.ensureProjectAccess(ctx.db, projectId, ctx.user.id);

      if (!url) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tool provider missing MCP URL",
        });
      }
      const baseUrl = getBaseUrl();
      if (!baseUrl || !canUseMcpOAuthRedirectBaseUrl(baseUrl)) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Tambo Cloud OAuth requires NEXT_PUBLIC_APP_URL or VERCEL_URL to resolve to an HTTPS URL or localhost",
        });
      }

      const toolProviderUserContextId = await upsertToolProviderUserContext(
        db,
        toolProviderId,
        contextKey,
      );
      const toolProviderUserContext =
        await db.query.toolProviderUserContexts.findFirst({
          where: eq(
            schema.toolProviderUserContexts.id,
            toolProviderUserContextId,
          ),
        });

      if (!toolProviderUserContext) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tool provider context not found",
        });
      }

      const expectedRedirectUrl = buildMcpOAuthCallbackUrl(baseUrl);
      const shouldReusePersistedState = shouldReusePersistedMcpOAuthState({
        clientInformation: toolProviderUserContext.mcpOauthClientInfo,
        hasManualClientRegistration: !!clientRegistration,
        redirectUrl: expectedRedirectUrl,
      });
      const persistedClientInformation = shouldReusePersistedState
        ? (toolProviderUserContext.mcpOauthClientInfo ?? undefined)
        : undefined;

      const authServerDetails =
        !persistedClientInformation && !clientRegistration
          ? await discoverMcpAuthorizationServerDetails(url)
          : undefined;

      if (
        !persistedClientInformation &&
        !clientRegistration &&
        authServerDetails &&
        requiresManualMcpClientRegistration(authServerDetails)
      ) {
        return buildManualClientRegistrationResponse(
          baseUrl,
          authServerDetails.authorizationServer,
          MCP_OAUTH_MANUAL_CLIENT_REGISTRATION_REASON_REGISTRATION_NOT_AVAILABLE,
        );
      }

      const manualClientInformation = clientRegistration
        ? {
            client_id: clientRegistration.clientId,
            ...(clientRegistration.clientSecret
              ? { client_secret: clientRegistration.clientSecret }
              : {}),
          }
        : undefined;

      const localProvider = new OAuthLocalProvider(
        db,
        toolProviderUserContextId,
        {
          baseUrl,
          clientInformation:
            manualClientInformation ?? persistedClientInformation,
          serverUrl: url,
          usePersistedContextState: shouldReusePersistedState,
        },
      );

      if (manualClientInformation) {
        await localProvider.saveClientInformation(manualClientInformation);
      }

      try {
        const result = await auth(localProvider, {
          serverUrl: url,
          fetchFn: createFetchWithTimeout(5_000),
        });
        if (result === "AUTHORIZED") {
          return {
            status: MCP_OAUTH_AUTHORIZATION_STATUS_AUTHORIZED,
          };
        }
        if (result === "REDIRECT") {
          const redirectUrl = localProvider.redirectStartAuthUrl?.toString();
          if (!redirectUrl) {
            throw new Error("OAuth redirect URL was not set");
          }

          return {
            status: MCP_OAUTH_AUTHORIZATION_STATUS_REDIRECT,
            redirectUrl,
          };
        }
      } catch (error) {
        if (shouldReusePersistedState) {
          await clearPersistedMcpOAuthState(db, toolProviderUserContextId);
        } else {
          const sessionId = localProvider.state();

          try {
            await clearStoredMcpOAuthSession(db, sessionId);
          } catch (cleanupError) {
            console.error("Failed to clean up OAuth session", {
              sessionId,
              cleanupError,
              originalError: error,
            });
          }
        }

        if (
          !persistedClientInformation &&
          !manualClientInformation &&
          authServerDetails &&
          isManualMcpClientRegistrationRequiredError(error)
        ) {
          return buildManualClientRegistrationResponse(
            baseUrl,
            authServerDetails.authorizationServer,
            requiresManualMcpClientRegistration(authServerDetails)
              ? MCP_OAUTH_MANUAL_CLIENT_REGISTRATION_REASON_REGISTRATION_NOT_AVAILABLE
              : MCP_OAUTH_MANUAL_CLIENT_REGISTRATION_REASON_DCR_FAILED,
          );
        }

        throw new TRPCError({
          code: manualClientInformation
            ? "BAD_REQUEST"
            : "INTERNAL_SERVER_ERROR",
          message: `MCP authorization failed: ${getErrorMessage(error)}`,
        });
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected auth result",
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

/** Get the auth provider for an MCP server or user context */
async function getOAuthProvider(
  db: HydraDb,
  input: {
    mcpServer?: McpServer;
    userContext?: typeof schema.toolProviderUserContexts.$inferSelect;
    url: string;
  },
): Promise<OAuthClientProvider | undefined> {
  const { mcpServer, userContext, url } = input;

  // If we have a user context with client info, use that directly
  if (userContext?.mcpOauthClientInfo) {
    return new OAuthLocalProvider(db, userContext.id, {
      baseUrl: getBaseUrl(),
      serverUrl: url,
      clientInformation: userContext.mcpOauthClientInfo,
    });
  }

  // Otherwise try to get client info from the MCP server context
  if (!mcpServer?.contexts.length) {
    return undefined;
  }

  if (mcpServer.contexts.length > 1) {
    console.warn(
      `MCP server ${mcpServer.id} has multiple contexts, using the first one`,
    );
  }

  if (!mcpServer.mcpRequiresAuth) {
    // this is fine, just means this server is not using OAuth
    return undefined;
  }

  const context = mcpServer.contexts[0];
  if (!context.mcpOauthClientInfo) {
    return undefined;
  }

  return new OAuthLocalProvider(db, context.id, {
    baseUrl: getBaseUrl(),
    serverUrl: url,
    clientInformation: context.mcpOauthClientInfo,
  });
}

/** Validate the MCP server, leveraging the oauth info in the db if available */
async function getServerValidity(
  db: HydraDb,
  projectId: string,
  serverId: string,
  url: string,
  customHeaders: Record<string, string> | undefined,
  mcpTransport: MCPTransport,
) {
  const currentServer = await operations.getMcpServer(
    db,
    projectId,
    serverId,
    null,
  );
  if (!currentServer) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "MCP server not found",
    });
  }
  const oauthProvider = await getOAuthProvider(db, {
    userContext: currentServer.contexts[0],
    url,
  });
  const validity = await validateMcpServer({
    url,
    customHeaders,
    mcpTransport,
    oauthProvider,
  });
  return {
    ...validity,
    // fake out that the server requires auth if we have an oauth provider
    requiresAuth: validity.requiresAuth || !!oauthProvider,
  };
}

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

async function clearStoredMcpOAuthSession(db: HydraDb, sessionId: string) {
  await db
    .delete(schema.mcpOauthClients)
    .where(eq(schema.mcpOauthClients.sessionId, sessionId));
}

async function clearPersistedMcpOAuthState(
  db: HydraDb,
  toolProviderUserContextId: string,
) {
  await db
    .update(schema.toolProviderUserContexts)
    .set({
      mcpOauthClientInfo: null,
      mcpOauthTokens: null,
    })
    .where(eq(schema.toolProviderUserContexts.id, toolProviderUserContextId));
}

async function discoverMcpAuthorizationServerDetails(serverUrl: string) {
  const fetchFn = createFetchWithTimeout(5_000);
  let authorizationServer = new URL("/", serverUrl);

  try {
    const resourceMetadata = await discoverOAuthProtectedResourceMetadata(
      serverUrl,
      undefined,
      fetchFn,
    );
    const discoveredAuthorizationServer =
      resourceMetadata.authorization_servers?.[0];

    if (discoveredAuthorizationServer) {
      authorizationServer = new URL(discoveredAuthorizationServer);
    }
  } catch (error) {
    console.warn("Failed to discover OAuth resource metadata", {
      serverUrl,
      error: getErrorMessage(error),
    });
  }

  try {
    const metadata = await discoverAuthorizationServerMetadata(
      authorizationServer,
      { fetchFn },
    );

    if (!metadata) {
      throw new Error("Authorization server metadata not found");
    }

    return {
      authorizationServer: authorizationServer.toString(),
      hasRegistrationEndpoint: !!metadata.registration_endpoint,
      metadataDiscovered: true,
      supportsClientMetadataDocument:
        metadata.client_id_metadata_document_supported === true,
    };
  } catch (error) {
    console.warn("Failed to discover OAuth authorization server metadata", {
      authorizationServer: authorizationServer.toString(),
      error: getErrorMessage(error),
    });

    return {
      authorizationServer: authorizationServer.toString(),
      hasRegistrationEndpoint: false,
      metadataDiscovered: false,
      supportsClientMetadataDocument: false,
    };
  }
}

function buildManualClientRegistrationResponse(
  baseUrl: string,
  authorizationServer: string,
  reason: McpOAuthManualClientRegistrationReason,
): ManualClientRegistrationRequiredResponse {
  const suggestedClientMetadata = buildMcpOAuthClientMetadata({ baseUrl });
  assertSuggestedClientMetadataFields(suggestedClientMetadata);

  return {
    status: MCP_OAUTH_AUTHORIZATION_STATUS_MANUAL_CLIENT_REGISTRATION_REQUIRED,
    authorizationServer,
    reason,
    suggestedClientMetadata: {
      clientName: suggestedClientMetadata.client_name,
      clientUri: suggestedClientMetadata.client_uri,
      redirectUris: suggestedClientMetadata.redirect_uris,
      grantTypes: suggestedClientMetadata.grant_types,
      responseTypes: suggestedClientMetadata.response_types,
      tokenEndpointAuthMethod:
        suggestedClientMetadata.token_endpoint_auth_method,
      applicationType: suggestedClientMetadata.application_type,
      clientMetadataUrl: canUseMcpOAuthClientMetadataUrl(baseUrl)
        ? buildMcpOAuthClientMetadataUrl(baseUrl)
        : undefined,
    },
  };
}

function assertSuggestedClientMetadataFields(
  metadata: ReturnType<typeof buildMcpOAuthClientMetadata>,
): asserts metadata is ReturnType<typeof buildMcpOAuthClientMetadata> & {
  client_name: string;
  client_uri: string;
  grant_types: string[];
  response_types: string[];
  token_endpoint_auth_method: string;
} {
  if (
    metadata.client_name === undefined ||
    metadata.client_uri === undefined ||
    metadata.grant_types === undefined ||
    metadata.response_types === undefined ||
    metadata.token_endpoint_auth_method === undefined
  ) {
    throw new Error("MCP OAuth client metadata is missing required fields");
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
