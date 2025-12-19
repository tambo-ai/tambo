import { env } from "@/lib/env";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { type HydraDb, schema } from "@tambo-ai-cloud/db";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";

// Constants
const CODE_EXPIRY_MINUTES = 15;
const SESSION_EXPIRY_DAYS = 90;
const POLL_INTERVAL_SECONDS = 5;
const CLI_SESSION_TOKEN_BYTES = 32;
const DEVICE_VERIFICATION_PATH = "/device";

/**
 * Get the base URL for constructing absolute verification URLs
 * Uses NEXT_PUBLIC_APP_URL or falls back to request headers
 */
function getVerificationBaseUrl(headers: Headers): string {
  // Prefer explicit env var
  if (env.NEXT_PUBLIC_APP_URL) {
    return env.NEXT_PUBLIC_APP_URL;
  }

  // Fall back to request headers
  const forwardedHost = headers.get("x-forwarded-host");
  const host = headers.get("host");
  const proto = headers.get("x-forwarded-proto") ?? "https";

  if (forwardedHost) {
    return `${proto}://${forwardedHost}`;
  }
  if (host) {
    return `${proto}://${host}`;
  }

  // Last resort fallback
  return "https://tambo.co";
}

/**
 * Try to get the most recent browser session ID for a user
 * Used to link CLI sessions to the browser session that authorized them
 */
async function getBrowserSessionId(
  db: HydraDb,
  userId: string,
): Promise<string | null> {
  const [session] = await db
    .select({ id: schema.sessions.id })
    .from(schema.sessions)
    .where(eq(schema.sessions.userId, userId))
    .orderBy(desc(schema.sessions.createdAt))
    .limit(1);

  return session?.id ?? null;
}

/**
 * Generate a random alphanumeric string for user codes
 * Uses uppercase letters and digits, excluding confusing characters (0, O, I, 1, L)
 */
function generateUserCode(length: number = 8): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let result = "";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

/**
 * Generate a cryptographically secure session token for CLI sessions
 *
 * Uses 32 bytes (256 bits) of entropy encoded as base64url.
 * This is significantly more secure than UUIDs (which have ~122 bits of entropy)
 * and should be treated as a secret credential.
 *
 * SECURITY: Never log or display this token. It grants account access.
 */
function generateCliSessionToken(): string {
  const bytes = new Uint8Array(CLI_SESSION_TOKEN_BYTES);
  crypto.getRandomValues(bytes);
  // Base64url encoding (URL-safe, no padding)
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Device Authentication Router
 *
 * Implements OAuth 2.0 Device Authorization Grant (RFC 8628) flow for CLI authentication.
 *
 * Flow:
 * 1. CLI calls `initiate` to get device_code + user_code
 * 2. User visits /device page and enters user_code
 * 3. User calls `verify` to link the device code to their session
 * 4. CLI polls `poll` until verification completes, then receives session token
 */
export const deviceAuthRouter = createTRPCRouter({
  /**
   * Initiate device auth flow (called by CLI)
   *
   * Generates a device code (UUID) and user code (8-char alphanumeric).
   * Returns absolute verification URLs per RFC 8628.
   */
  initiate: publicProcedure.mutation(async ({ ctx }) => {
    const deviceCode = crypto.randomUUID();
    const userCode = generateUserCode(8);
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

    // Insert the device auth code
    await ctx.db.insert(schema.deviceAuthCodes).values({
      deviceCode,
      userCode,
      expiresAt,
      isUsed: false,
    });

    // Format user code with dash for display (XXXX-XXXX)
    const formattedUserCode = `${userCode.slice(0, 4)}-${userCode.slice(4)}`;

    // Construct absolute URLs per RFC 8628
    const baseUrl = getVerificationBaseUrl(ctx.headers);
    const verificationUri = `${baseUrl}${DEVICE_VERIFICATION_PATH}`;

    // Use URL API for proper encoding
    const completeUrl = new URL(verificationUri);
    completeUrl.searchParams.set("user_code", userCode);
    const verificationUriComplete = completeUrl.toString();

    return {
      deviceCode,
      userCode: formattedUserCode,
      verificationUri,
      verificationUriComplete,
      expiresIn: CODE_EXPIRY_MINUTES * 60,
      interval: POLL_INTERVAL_SECONDS,
    };
  }),

  /**
   * Verify a device code (called by browser after user enters code)
   *
   * This is a protected procedure - user must be logged in.
   * Links the device code to the authenticated user and creates a CLI session.
   */
  verify: protectedProcedure
    .input(
      z.object({
        userCode: z
          .string()
          .min(1, "User code is required")
          .transform((val) => val.replace(/-/g, "").trim()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date();

      // Generate high-entropy session token (256 bits)
      // SECURITY: This token is a credential - never log it
      const cliSessionToken = generateCliSessionToken();
      const sessionExpiresAt = new Date(
        Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
      );

      // Try to get browser session ID for reference (optional)
      // This links the CLI session to the browser session that authorized it
      const browserSessionId = ctx.session?.user
        ? await getBrowserSessionId(ctx.db, ctx.user.id)
        : null;

      // Atomically claim the device code with conditional update
      // This prevents race conditions - only one request can successfully claim a code
      const updateResult = await ctx.db
        .update(schema.deviceAuthCodes)
        .set({
          userId: ctx.user.id,
          cliSessionId: cliSessionToken,
          isUsed: true,
        })
        .where(
          and(
            eq(schema.deviceAuthCodes.userCode, input.userCode),
            eq(schema.deviceAuthCodes.isUsed, false),
            gt(schema.deviceAuthCodes.expiresAt, now),
            isNull(schema.deviceAuthCodes.userId),
          ),
        )
        .returning({ id: schema.deviceAuthCodes.id });

      // If update succeeded (exactly 1 row), create the CLI session
      if (updateResult.length === 1) {
        await ctx.db.insert(schema.cliSessions).values({
          id: cliSessionToken,
          userId: ctx.user.id,
          browserSessionId,
          notAfter: sessionExpiresAt,
        });

        return {
          success: true,
          message: "Device authorized successfully",
        };
      }

      // Update failed - determine why for a helpful error message
      const [existingCode] = await ctx.db
        .select()
        .from(schema.deviceAuthCodes)
        .where(eq(schema.deviceAuthCodes.userCode, input.userCode))
        .limit(1);

      if (existingCode) {
        if (existingCode.isUsed) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "CODE_ALREADY_USED",
          });
        }
        if (existingCode.expiresAt <= now) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "CODE_EXPIRED",
          });
        }
      }

      throw new TRPCError({
        code: "NOT_FOUND",
        message: "INVALID_CODE",
      });
    }),

  /**
   * Poll for verification completion (called by CLI)
   *
   * Returns the session token once the user has verified the code.
   *
   * SECURITY: The sessionToken returned is a high-entropy credential (256 bits).
   * It grants full account access and must NEVER be logged server-side.
   *
   * Rate limiting: Enforces server-side poll interval to prevent abuse.
   */
  poll: publicProcedure
    .input(
      z.object({
        deviceCode: z.string().uuid("Invalid device code format"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      // Allow 1 second buffer for network latency
      const minPollIntervalMs = (POLL_INTERVAL_SECONDS - 1) * 1000;

      // Find the device auth code
      const [deviceAuthCode] = await ctx.db
        .select()
        .from(schema.deviceAuthCodes)
        .where(eq(schema.deviceAuthCodes.deviceCode, input.deviceCode))
        .limit(1);

      if (!deviceAuthCode) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "INVALID_DEVICE_CODE",
        });
      }

      // Server-side rate limiting: check if polled too recently
      if (deviceAuthCode.lastPolledAt) {
        const timeSinceLastPoll =
          now.getTime() - deviceAuthCode.lastPolledAt.getTime();
        if (timeSinceLastPoll < minPollIntervalMs) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "SLOW_DOWN",
          });
        }
      }

      // Update last poll timestamp (fire-and-forget, don't block response)
      void ctx.db
        .update(schema.deviceAuthCodes)
        .set({ lastPolledAt: now })
        .where(eq(schema.deviceAuthCodes.deviceCode, input.deviceCode))
        .execute();

      // Check if expired
      if (deviceAuthCode.expiresAt <= now) {
        return {
          status: "expired" as const,
        };
      }

      // Check if verified
      if (deviceAuthCode.isUsed && deviceAuthCode.cliSessionId) {
        // Get user info and session expiry for the response
        const [result] = await ctx.db
          .select({
            userId: schema.authUsers.id,
            userEmail: schema.authUsers.email,
            userName: schema.authUsers.rawUserMetaData,
            sessionExpiresAt: schema.cliSessions.notAfter,
          })
          .from(schema.cliSessions)
          .innerJoin(
            schema.authUsers,
            eq(schema.cliSessions.userId, schema.authUsers.id),
          )
          .where(eq(schema.cliSessions.id, deviceAuthCode.cliSessionId))
          .limit(1);

        return {
          status: "complete" as const,
          sessionToken: deviceAuthCode.cliSessionId,
          expiresAt: result?.sessionExpiresAt?.toISOString() ?? null,
          user: result
            ? {
                id: result.userId,
                email: result.userEmail,
                name:
                  (result.userName as Record<string, unknown> | null)?.name ??
                  null,
              }
            : null,
        };
      }

      // Still pending
      return {
        status: "pending" as const,
      };
    }),

  /**
   * List active CLI sessions (called by browser)
   *
   * Returns all non-expired CLI sessions for the authenticated user.
   *
   * SECURITY NOTE: Session IDs are returned here for revocation purposes.
   * This is acceptable because:
   * - User can only see their own sessions (authenticated)
   * - Transmitted over HTTPS
   * - Required for revoke functionality
   * However, these IDs should NEVER be logged server-side.
   */
  listSessions: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();

    const sessions = await ctx.db
      .select({
        id: schema.cliSessions.id,
        createdAt: schema.cliSessions.createdAt,
        updatedAt: schema.cliSessions.updatedAt,
        notAfter: schema.cliSessions.notAfter,
      })
      .from(schema.cliSessions)
      .where(
        and(
          eq(schema.cliSessions.userId, ctx.user.id),
          gt(schema.cliSessions.notAfter, now),
        ),
      )
      .orderBy(schema.cliSessions.createdAt);

    return sessions;
  }),

  /**
   * Revoke a CLI session (called by browser)
   *
   * Deletes the session, which will invalidate the CLI's access.
   */
  revokeSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the session belongs to the user
      const [session] = await ctx.db
        .select()
        .from(schema.cliSessions)
        .where(
          and(
            eq(schema.cliSessions.id, input.sessionId),
            eq(schema.cliSessions.userId, ctx.user.id),
          ),
        )
        .limit(1);

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session not found or not authorized",
        });
      }

      // Delete the session
      await ctx.db
        .delete(schema.cliSessions)
        .where(eq(schema.cliSessions.id, input.sessionId));

      return {
        success: true,
        message: "Session revoked",
      };
    }),

  /**
   * Revoke all CLI sessions for the authenticated user
   *
   * Atomically deletes all CLI sessions in a single operation.
   * More efficient than revoking sessions one by one.
   */
  revokeAllSessions: protectedProcedure.mutation(async ({ ctx }) => {
    const result = await ctx.db
      .delete(schema.cliSessions)
      .where(eq(schema.cliSessions.userId, ctx.user.id))
      .returning({ id: schema.cliSessions.id });

    return {
      success: true,
      revokedCount: result.length,
      message: `Revoked ${result.length} session(s)`,
    };
  }),
});
