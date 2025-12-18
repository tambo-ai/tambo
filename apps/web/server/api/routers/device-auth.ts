import { env } from "@/lib/env";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { hashKey } from "@tambo-ai-cloud/core";
import { schema } from "@tambo-ai-cloud/db";
import { TRPCError } from "@trpc/server";
import * as crypto from "crypto";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { z } from "zod/v3";

/**
 * Device Authentication Router for CLI
 *
 * This router implements OAuth 2.0 Device Authorization Grant (RFC 8628) flow
 * for CLI authentication. The flow works as follows:
 *
 * 1. CLI calls `initiate()` to get a device code and user code
 * 2. CLI displays the user code and opens browser to verification page
 * 3. User logs in via browser and calls `verify()` with the user code
 * 4. CLI polls `poll()` endpoint until user verifies
 * 5. On verification, CLI receives a bearer token for subsequent API calls
 *
 * IMPORTANT: This router depends on database tables that must be added to packages/db/src/schema.ts:
 *
 * 1. deviceAuthSessions table (schema.deviceAuthSessions):
 *    ```typescript
 *    export const deviceAuthSessions = pgTable("device_auth_sessions", {
 *      id: text("id").primaryKey().notNull().unique().default(sql`generate_custom_id('das_')`),
 *      deviceCode: text("device_code").notNull().unique(),
 *      userCode: text("user_code").notNull().unique(),
 *      expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
 *      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
 *      userId: uuid("user_id").references(() => authUsers.id),
 *      isUsed: boolean("is_used").notNull().default(false),
 *    });
 *    ```
 *
 * 2. bearerTokens table (schema.bearerTokens):
 *    ```typescript
 *    export const bearerTokens = pgTable("bearer_tokens", {
 *      id: text("id").primaryKey().notNull().unique().default(sql`generate_custom_id('dbt_')`),
 *      userId: uuid("user_id").notNull().references(() => authUsers.id),
 *      hashedToken: text("hashed_token").notNull(),
 *      deviceSessionId: text("device_session_id").references(() => deviceAuthSessions.id),
 *      expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
 *      createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
 *      lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
 *      revokedAt: timestamp("revoked_at", { withTimezone: true }),
 *    });
 *    ```
 *
 * After adding these tables to the schema, run:
 *   npm run db:generate
 *   npm run db:migrate
 */

// Helper functions for user code generation
const USER_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excludes confusing chars: 0/O, 1/I/l

function generateUserCode(): string {
  const codeLength = 8;
  let code = "";

  for (let i = 0; i < codeLength; i++) {
    const randomIndex = crypto.randomInt(0, USER_CODE_CHARS.length);
    code += USER_CODE_CHARS[randomIndex];

    // Add dash after 4 characters for readability
    if (i === 3) {
      code += "-";
    }
  }

  return code;
}

function normalizeUserCode(code: string): string {
  return code.replace(/-/g, "").toUpperCase();
}

export const deviceAuthRouter = createTRPCRouter({
  /**
   * Initiate device auth flow
   * Generates device code and user code, stores in database
   */
  initiate: publicProcedure.mutation(async ({ ctx }) => {
    const deviceCode = crypto.randomUUID();
    const userCode = generateUserCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    // Generate ID in application code to avoid permission issues with generate_custom_id function
    const id = `das_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    const normalizedUserCode = normalizeUserCode(userCode);
    const createdAt = new Date();

    try {
      await ctx.db.execute(
        sql`INSERT INTO device_auth_sessions (id, device_code, user_code, user_id, is_used, expires_at, created_at)
            VALUES (${id}, ${deviceCode}, ${normalizedUserCode}, NULL, false, ${expiresAt}, ${createdAt})`,
      );
    } catch (cause) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to initiate device authentication",
        cause,
      });
    }

    // Construct verification URI
    const baseUrl = env.NEXTAUTH_URL || "http://localhost:3000";
    const verificationUri = `${baseUrl}/device`;

    return {
      deviceCode,
      userCode, // Return formatted with dash
      verificationUri,
      expiresIn: 900, // 15 minutes in seconds
      interval: 5, // Poll every 5 seconds
    };
  }),

  /**
   * Poll for device auth completion
   * CLI calls this repeatedly to check if user has verified
   */
  poll: publicProcedure
    .input(
      z.object({
        deviceCode: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { deviceCode } = input;

      // Look up session by device code
      const session = await ctx.db.query.deviceAuthSessions.findFirst({
        where: eq(schema.deviceAuthSessions.deviceCode, deviceCode),
      });

      if (!session) {
        return { status: "expired" as const };
      }

      // Check if expired
      if (new Date() > session.expiresAt) {
        return { status: "expired" as const };
      }

      // Check if not verified yet
      if (!session.userId) {
        return { status: "pending" as const };
      }

      // Check if already used
      if (session.isUsed) {
        return { status: "expired" as const };
      }

      // Session is verified and not used - generate bearer token
      const tokenBytes = crypto.randomBytes(32);
      const accessToken = `tambo_cli_${tokenBytes.toString("hex")}`;
      const hashedToken = hashKey(accessToken);

      // Get user info - temporarily elevate privileges to read from auth.users
      // This is safe because we've already verified the session exists and has a userId
      await ctx.db.execute(sql`RESET ROLE`);
      const userResult = await ctx.db.execute(
        sql`SELECT id, email, raw_user_meta_data FROM auth.users WHERE id = ${session.userId} LIMIT 1`,
      );
      await ctx.db.execute(sql`SET LOCAL ROLE anon`);

      const user = userResult.rows[0] as
        | {
            id: string;
            email: string | null;
            raw_user_meta_data: Record<string, unknown> | null;
          }
        | undefined;

      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "User not found",
        });
      }

      // Insert bearer token
      const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days
      const tokenId = `bt_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
      await ctx.db.insert(schema.bearerTokens).values({
        id: tokenId,
        userId: session.userId,
        hashedToken,
        deviceSessionId: session.id,
        expiresAt,
        createdAt: new Date(),
        lastUsedAt: null,
        revokedAt: null,
      });

      // Mark session as used
      await ctx.db
        .update(schema.deviceAuthSessions)
        .set({ isUsed: true })
        .where(eq(schema.deviceAuthSessions.id, session.id));

      return {
        status: "complete" as const,
        accessToken,
        user: {
          id: user.id,
          email: user.email ?? undefined,
          name: user.raw_user_meta_data?.name as string | undefined,
        },
      };
    }),

  /**
   * Verify device code (browser calls this)
   * User must be authenticated via NextAuth
   */
  verify: protectedProcedure
    .input(
      z.object({
        userCode: z.string().min(8).max(9), // With or without dash
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const normalizedCode = normalizeUserCode(input.userCode);

      // Look up session by user code
      const session = await ctx.db.query.deviceAuthSessions.findFirst({
        where: eq(schema.deviceAuthSessions.userCode, normalizedCode),
      });

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid or expired code",
        });
      }

      // Check if expired
      if (new Date() > session.expiresAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Code has expired",
        });
      }

      // Check if already used
      if (session.isUsed) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Code has already been used",
        });
      }

      // Update session with user ID
      await ctx.db
        .update(schema.deviceAuthSessions)
        .set({ userId: ctx.user.id })
        .where(eq(schema.deviceAuthSessions.id, session.id));

      return { success: true };
    }),

  /**
   * Revoke a bearer token
   * User must own the token
   */
  revoke: protectedProcedure
    .input(
      z.object({
        tokenId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { tokenId } = input;

      // Look up token and verify ownership
      const token = await ctx.db.query.bearerTokens.findFirst({
        where: and(
          eq(schema.bearerTokens.id, tokenId),
          eq(schema.bearerTokens.userId, ctx.user.id),
        ),
      });

      if (!token) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Token not found or you do not have permission to revoke it",
        });
      }

      // Set revokedAt to now
      await ctx.db
        .update(schema.bearerTokens)
        .set({ revokedAt: new Date() })
        .where(eq(schema.bearerTokens.id, tokenId));

      return { success: true };
    }),

  /**
   * List all active CLI sessions (non-revoked bearer tokens)
   * for the current user
   */
  listSessions: protectedProcedure.query(async ({ ctx }) => {
    const tokens = await ctx.db.query.bearerTokens.findMany({
      where: and(
        eq(schema.bearerTokens.userId, ctx.user.id),
        isNull(schema.bearerTokens.revokedAt),
        gt(schema.bearerTokens.expiresAt, new Date()),
      ),
      orderBy: (bearerTokens, { desc }) => [desc(bearerTokens.createdAt)],
    });

    return tokens.map((token) => ({
      id: token.id,
      createdAt: token.createdAt,
      lastUsedAt: token.lastUsedAt,
      expiresAt: token.expiresAt,
    }));
  }),
});
