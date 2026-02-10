import { getBaseUrl } from "@/lib/base-url";
import { env } from "@/lib/env";
import { createFetchWithTimeout } from "@/lib/fetch-with-timeout";
import { auth } from "@modelcontextprotocol/sdk/client/auth.js";
import { getDb, OAuthLocalProvider, schema } from "@tambo-ai-cloud/db";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v3";

// Define schema for validating query parameters
const callbackParamsSchema = z
  .object({
    code: z.string().min(1, "Authorization code is required"),
    state: z.string().optional(),
    error: z.string().optional(),
    redirect_uri: z.string().url().optional(),
    sessionId: z.string(),
  })
  .passthrough();

/**
 * Handler for OAuth callback
 * This is called by the OAuth provider after the user has authorized the application
 */
export async function GET(request: NextRequest) {
  // Get query parameters from URL
  const url = new URL(request.url);
  console.log("--> /oauth/callback", url.toString());
  const queryParams = Object.fromEntries(url.searchParams.entries());

  try {
    // Validate query parameters
    const validatedParams = callbackParamsSchema.parse(queryParams);
    const { sessionId, code } = validatedParams;
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
      throw new Error("Session not found");
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

    // Check for errors returned from OAuth provider before attempting token exchange
    if (validatedParams.error) {
      console.error("OAuth error:", validatedParams.error);
      return NextResponse.redirect(
        new URL(
          `/auth/error?error=${encodeURIComponent(validatedParams.error)}`,
          request.url,
        ),
      );
    }

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
    console.error("Error handling OAuth callback:", error);
    console.trace();

    if (error instanceof z.ZodError) {
      // Format validation errors
      const errorMessage = error.errors
        .map((err) => `${err.path}: ${err.message}`)
        .join(", ");
      return NextResponse.redirect(
        new URL(
          `/auth/error?error=${encodeURIComponent(errorMessage)}`,
          request.url,
        ),
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "unknown_error";
    return NextResponse.redirect(
      new URL(
        `/auth/error?error=${encodeURIComponent(errorMessage)}`,
        request.url,
      ),
    );
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
  // just fall back to the project page
  return new URL(`/${projectId}`, baseUrl).toString();
}
