import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { schema } from "@tambo-ai-cloud/db";
import { TRPCError } from "@trpc/server";
import { and, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";

// Constants
const CODE_EXPIRY_MINUTES = 15;
const SESSION_EXPIRY_DAYS = 90;
const POLL_INTERVAL_SECONDS = 5;

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
   * Returns verification URL and polling interval.
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

    return {
      deviceCode,
      userCode: formattedUserCode,
      verificationUri: "/device",
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

      // Find the device auth code
      const [deviceAuthCode] = await ctx.db
        .select()
        .from(schema.deviceAuthCodes)
        .where(
          and(
            eq(schema.deviceAuthCodes.userCode, input.userCode),
            eq(schema.deviceAuthCodes.isUsed, false),
            gt(schema.deviceAuthCodes.expiresAt, now),
            isNull(schema.deviceAuthCodes.userId),
          ),
        )
        .limit(1);

      if (!deviceAuthCode) {
        // Check if code exists but is used or expired
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
      }

      // Create a new CLI session
      const sessionId = crypto.randomUUID();
      const sessionExpiresAt = new Date(
        Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
      );

      await ctx.db.insert(schema.sessions).values({
        id: sessionId,
        userId: ctx.user.id,
        notAfter: sessionExpiresAt,
        source: "cli",
      });

      // Update the device auth code with user and session info
      await ctx.db
        .update(schema.deviceAuthCodes)
        .set({
          userId: ctx.user.id,
          sessionId,
          isUsed: true,
        })
        .where(eq(schema.deviceAuthCodes.id, deviceAuthCode.id));

      return {
        success: true,
        message: "Device authorized successfully",
      };
    }),

  /**
   * Poll for verification completion (called by CLI)
   *
   * Returns the session token once the user has verified the code.
   */
  poll: publicProcedure
    .input(
      z.object({
        deviceCode: z.string().uuid("Invalid device code format"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();

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

      // Check if expired
      if (deviceAuthCode.expiresAt <= now) {
        return {
          status: "expired" as const,
        };
      }

      // Check if verified
      if (deviceAuthCode.isUsed && deviceAuthCode.sessionId) {
        // Get user info for the response
        const [user] = await ctx.db
          .select({
            id: schema.authUsers.id,
            email: schema.authUsers.email,
            name: schema.authUsers.rawUserMetaData,
          })
          .from(schema.authUsers)
          .where(eq(schema.authUsers.id, deviceAuthCode.userId!))
          .limit(1);

        return {
          status: "complete" as const,
          sessionToken: deviceAuthCode.sessionId,
          user: user
            ? {
                id: user.id,
                email: user.email,
                name:
                  (user.name as Record<string, unknown> | null)?.name ?? null,
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
   */
  listSessions: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();

    const cliSessions = await ctx.db
      .select({
        id: schema.sessions.id,
        createdAt: schema.sessions.createdAt,
        updatedAt: schema.sessions.updatedAt,
        notAfter: schema.sessions.notAfter,
      })
      .from(schema.sessions)
      .where(
        and(
          eq(schema.sessions.userId, ctx.user.id),
          eq(schema.sessions.source, "cli"),
          gt(schema.sessions.notAfter, now),
        ),
      )
      .orderBy(schema.sessions.createdAt);

    return cliSessions;
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
      // Verify the session belongs to the user and is a CLI session
      const [session] = await ctx.db
        .select()
        .from(schema.sessions)
        .where(
          and(
            eq(schema.sessions.id, input.sessionId),
            eq(schema.sessions.userId, ctx.user.id),
            eq(schema.sessions.source, "cli"),
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
        .delete(schema.sessions)
        .where(eq(schema.sessions.id, input.sessionId));

      return {
        success: true,
        message: "Session revoked",
      };
    }),
});
