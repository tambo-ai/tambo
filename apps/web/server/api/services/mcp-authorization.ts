import { getBaseUrl } from "@/lib/base-url";
import { createFetchWithTimeout } from "@/lib/fetch-with-timeout";
import {
  authorizeMcpServerOutputSchema,
  mcpManualClientRegistrationInput,
} from "@/lib/schemas/mcp";
import {
  isManualMcpClientRegistrationRequiredError,
  requiresManualMcpClientRegistration,
  shouldReusePersistedMcpOAuthState,
} from "../routers/mcp-oauth-registration";
import {
  auth,
  discoverAuthorizationServerMetadata,
  discoverOAuthProtectedResourceMetadata,
} from "@modelcontextprotocol/sdk/client/auth.js";
import {
  MCPTransport,
  MCP_OAUTH_AUTHORIZATION_STATUS_AUTHORIZED,
  MCP_OAUTH_AUTHORIZATION_STATUS_MANUAL_CLIENT_REGISTRATION_REQUIRED,
  MCP_OAUTH_AUTHORIZATION_STATUS_REDIRECT,
  MCP_OAUTH_MANUAL_CLIENT_REGISTRATION_REASON_DCR_FAILED,
  MCP_OAUTH_MANUAL_CLIENT_REGISTRATION_REASON_REGISTRATION_NOT_AVAILABLE,
  ToolProviderType,
  buildMcpOAuthCallbackUrl,
  buildMcpOAuthClientMetadata,
  buildMcpOAuthClientMetadataUrl,
  canUseMcpOAuthClientMetadataUrl,
  canUseMcpOAuthRedirectBaseUrl,
  type McpOAuthManualClientRegistrationReason,
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

type ManualClientRegistrationInput = z.infer<
  typeof mcpManualClientRegistrationInput
>;
type AuthorizeMcpServerOutput = z.infer<typeof authorizeMcpServerOutputSchema>;
type ManualClientRegistrationRequiredResponse = Extract<
  AuthorizeMcpServerOutput,
  {
    status: typeof MCP_OAUTH_AUTHORIZATION_STATUS_MANUAL_CLIENT_REGISTRATION_REQUIRED;
  }
>;

export async function authorizeMcpServer({
  clientRegistration,
  contextKey,
  db,
  toolProviderId,
  userId,
}: {
  clientRegistration?: ManualClientRegistrationInput;
  contextKey: string | null;
  db: HydraDb;
  toolProviderId: string;
  userId: string;
}): Promise<AuthorizeMcpServerOutput> {
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

  const { projectId, url } = toolProvider;
  await operations.ensureProjectAccess(db, projectId, userId);

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

  const toolProviderUserContext =
    await operations.upsertToolProviderUserContext(
      db,
      toolProviderId,
      contextKey,
    );

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

  const localProvider = new OAuthLocalProvider(db, toolProviderUserContext.id, {
    baseUrl,
    clientInformation: manualClientInformation ?? persistedClientInformation,
    serverUrl: url,
    usePersistedContextState: shouldReusePersistedState,
  });

  if (manualClientInformation) {
    await localProvider.saveClientInformation(manualClientInformation);
  }
  const sessionId = localProvider.state();

  try {
    const result = await auth(localProvider, {
      serverUrl: url,
      fetchFn: createFetchWithTimeout(5_000),
    });
    if (result === "AUTHORIZED") {
      await clearStoredMcpOAuthSessionSafely(db, sessionId);

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
      await clearPersistedMcpOAuthState(db, toolProviderUserContext.id);
    } else {
      await clearStoredMcpOAuthSessionSafely(db, sessionId, error);
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
      code: manualClientInformation ? "BAD_REQUEST" : "INTERNAL_SERVER_ERROR",
      message: `MCP authorization failed: ${getErrorMessage(error)}`,
    });
  }

  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Unexpected auth result",
  });
}

/** Get the auth provider for an MCP server or user context */
export async function getOAuthProvider(
  db: HydraDb,
  input: {
    mcpServer?: McpServer;
    userContext?: typeof schema.toolProviderUserContexts.$inferSelect;
    url: string;
  },
) {
  const { mcpServer, url, userContext } = input;

  if (userContext?.mcpOauthClientInfo) {
    return new OAuthLocalProvider(db, userContext.id, {
      baseUrl: getBaseUrl(),
      serverUrl: url,
      clientInformation: userContext.mcpOauthClientInfo,
    });
  }

  if (!mcpServer?.contexts.length) {
    return undefined;
  }

  if (mcpServer.contexts.length > 1) {
    console.warn(
      `MCP server ${mcpServer.id} has multiple contexts, using the first one`,
    );
  }

  if (!mcpServer.mcpRequiresAuth) {
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
export async function getServerValidity(
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
    requiresAuth: validity.requiresAuth || !!oauthProvider,
  };
}

async function clearStoredMcpOAuthSession(db: HydraDb, sessionId: string) {
  await db
    .delete(schema.mcpOauthClients)
    .where(eq(schema.mcpOauthClients.sessionId, sessionId));
}

async function clearStoredMcpOAuthSessionSafely(
  db: HydraDb,
  sessionId: string,
  originalError?: unknown,
) {
  try {
    await clearStoredMcpOAuthSession(db, sessionId);
  } catch (cleanupError) {
    console.error("Failed to clean up OAuth session", {
      sessionId,
      cleanupError,
      ...(originalError ? { originalError } : {}),
    });
  }
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
