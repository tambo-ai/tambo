import { getBaseUrl } from "@/lib/base-url";
import { env } from "@/lib/env";
import { createFetchWithTimeout } from "@/lib/fetch-with-timeout";
import { OAuthErrorCode, oauthErrorCodeSchema } from "@/lib/oauth-error";
import { auth } from "@modelcontextprotocol/sdk/client/auth.js";
import { getDb, OAuthLocalProvider, schema } from "@tambo-ai-cloud/db";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v3";

// Define schema for validating query parameters
export const callbackParamsSchema = z.object({
  code: z.string().min(1, "Authorization code is required").optional(),
  state: z.string().min(1).optional(),
  error: z.string().min(1).optional(),
  redirect_uri: z.string().url().optional(),
  sessionId: z.string().min(1).optional(),
});

class OAuthCallbackRouteError extends Error {
  constructor(readonly code: OAuthErrorCode) {
    super(code);
    this.name = "OAuthCallbackRouteError";
  }
}

/**
 * Handler for OAuth callback
 * This is called by the OAuth provider after the user has authorized the application
 */
export async function GET(request: NextRequest) {
  // Get query parameters from URL
  const url = new URL(request.url);
  const queryParams = Object.fromEntries(url.searchParams.entries());

  try {
    // Validate query parameters
    const validatedParams = callbackParamsSchema.parse(queryParams);
    const sessionId = validatedParams.state ?? validatedParams.sessionId;
    if (validatedParams.error) {
      console.error("OAuth callback returned provider error", {
        sessionId,
        error: validatedParams.error,
      });
      return redirectToOAuthError(request, "ProviderDenied");
    }

    if (!sessionId) {
      throw new OAuthCallbackRouteError("SessionExpired");
    }

    if (!validatedParams.code) {
      throw new OAuthCallbackRouteError("MissingAuthorizationCode");
    }

    const { code } = validatedParams;
    const db = getDb(env.DATABASE_URL);
    const oauthClient = await db.query.mcpOauthClients.findFirst({
      where: eq(schema.mcpOauthClients.sessionId, sessionId),
      with: {
        toolProviderUserContext: {
          with: {
            toolProvider: {
              columns: {
                projectId: true,
              },
            },
          },
        },
      },
    });

    if (!oauthClient) {
      throw new OAuthCallbackRouteError("SessionExpired");
    }

    const oauthProvider = new OAuthLocalProvider(
      db,
      oauthClient.toolProviderUserContextId,
      {
        clientInformation: oauthClient.sessionInfo.clientInformation,
        serverUrl: oauthClient.sessionInfo.serverUrl,
        sessionId,
        baseUrl: getBaseUrl(),
      },
    );

    await auth(oauthProvider, {
      serverUrl: oauthClient.sessionInfo.serverUrl,
      authorizationCode: code,
      fetchFn: createFetchWithTimeout(10_000),
    });
    const { projectId } = oauthClient.toolProviderUserContext.toolProvider;

    // Handle redirect after successful authentication
    const redirectUrl = getPostAuthRedirect(
      validatedParams.redirect_uri,
      projectId,
    );

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("OAuth callback failed", {
      sessionId: queryParams.state ?? queryParams.sessionId,
      error,
    });

    if (error instanceof z.ZodError) {
      return redirectToOAuthError(request, "InvalidCallback");
    }

    if (error instanceof OAuthCallbackRouteError) {
      return redirectToOAuthError(request, error.code);
    }

    return redirectToOAuthError(request, "TokenExchangeFailed");
  }
}

/** Validates that the redirect_uri is a valid URL and that it is on the same origin as the server */
function getPostAuthRedirect(
  redirect_uri: string | undefined,
  projectId: string,
) {
  const baseUrl = new URL(getBaseUrl());

  if (redirect_uri) {
    const url = new URL(redirect_uri, baseUrl);
    if (url.origin === baseUrl.origin) {
      return url.toString();
    }
  }
  // fall back to the project settings page where MCP servers are configured
  return new URL(`/${projectId}/settings`, baseUrl).toString();
}

function redirectToOAuthError(request: NextRequest, code: OAuthErrorCode) {
  const validatedCode = oauthErrorCodeSchema.parse(code);

  return NextResponse.redirect(
    new URL(
      `/oauth/error?code=${encodeURIComponent(validatedCode)}`,
      request.url,
    ),
  );
}
