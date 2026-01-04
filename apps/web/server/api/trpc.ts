/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */

import { initTRPC, TRPCError } from "@trpc/server";
import { type JWTPayload } from "jose";
import superjson from "superjson";
import { ZodError } from "zod/v3";

import { authOptions } from "@/lib/auth";
import { env } from "@/lib/env";
import * as Sentry from "@sentry/nextjs";
import { getDb, HydraDb, schema } from "@tambo-ai-cloud/db";
import { and, eq, gt, sql } from "drizzle-orm";
import { getServerSession, User } from "next-auth";
import { headers } from "next/headers";

export type Context = {
  db: HydraDb;
  session: any | null;
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  } | null;
  headers: Headers;
};

/**
 * Validate a session token against the database
 * Returns user info if valid, null otherwise
 *
 * CLI session tokens are high-entropy (256 bits, base64url encoded).
 * They are stored in the unified sessions table with source='cli'.
 *
 * SECURITY:
 * - Sessions must have a non-null expiresAt and not be expired
 * - Tokens should NEVER be logged - they grant full account access
 * - This is enforced here and when creating sessions in device-auth.ts
 */
async function validateSession(
  db: HydraDb,
  sessionToken: string,
): Promise<NonNullable<Context["user"]>> {
  // Query the session and join with user
  // Sessions must have expiresAt set and not be expired
  const result = await db
    .select({
      sessionId: schema.sessions.id,
      userId: schema.sessions.userId,
      expiresAt: schema.sessions.expiresAt,
      source: schema.sessions.source,
      userEmail: schema.authUsers.email,
      userMeta: schema.authUsers.rawUserMetaData,
    })
    .from(schema.sessions)
    .innerJoin(
      schema.authUsers,
      eq(schema.sessions.userId, schema.authUsers.id),
    )
    .where(
      and(
        eq(schema.sessions.id, sessionToken),
        gt(schema.sessions.expiresAt, sql`now()`),
      ),
    )
    .limit(1);

  if (result.length === 0) {
    // Token was provided but is invalid/expired - this is an auth error, not anonymous access
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid or expired session token",
    });
  }

  const session = result[0];
  const meta = session.userMeta as Record<string, unknown> | null;

  return {
    id: session.userId,
    email: session.userEmail,
    name: (meta?.name as string) ?? null,
    image: (meta?.avatar_url as string) ?? null,
  };
}

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (): Promise<Context> => {
  const requestHeaders = await headers();
  const session = await getServerSession(authOptions);
  const db = getDb(env.DATABASE_URL);

  // First, try NextAuth session (browser users)
  let user: Context["user"] = session?.user
    ? {
        id: (session.user as User).id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      }
    : null;

  // If no NextAuth session, check for session token via Authorization header
  // This is used by CLI sessions (source='cli') authenticated via device auth flow
  if (!user) {
    const authHeader = requestHeaders.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const sessionToken = authHeader.slice(7);
      user = await validateSession(db, sessionToken);
    }
  }

  return {
    db,
    session,
    user,
    headers: requestHeaders,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // artificial delay in dev
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

const transactionMiddleware = t.middleware<Context>(async ({ next, ctx }) => {
  return await ctx.db.transaction(async (tx) => {
    const user = ctx.user;

    // Create JWT-like claims structure for the database
    const role = user ? "authenticated" : "anon";
    const jwtClaims: JWTPayload = user
      ? {
          sub: user.id,
          iss: "nextauth", // NextAuth as issuer
          aud: "tambo",
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
          email: user.email,
          name: user.name,
          role,
        }
      : {};

    // whitelist role for identifier interpolation
    const roleSql =
      role === "authenticated" ? sql.raw("authenticated") : sql.raw("anon");

    // Precompute values for parameterized queries
    const claimsText = JSON.stringify(jwtClaims);
    const sub = jwtClaims.sub ?? "";

    try {
      // Execute as separate statements to use parameterized queries
      await tx.execute(
        sql`select set_config('request.jwt.claims', ${claimsText}, TRUE)`,
      );
      await tx.execute(
        sql`select set_config('request.jwt.claim.sub', ${sub}, TRUE)`,
      );
      await tx.execute(sql`set local role ${roleSql}`);
      return await next({ ctx: { ...ctx, db: tx } });
    } catch (error) {
      console.error("error setting config: ", error);
      throw error;
    } finally {
      await tx.execute(
        sql`select set_config('request.jwt.claims', NULL, TRUE)`,
      );
      await tx.execute(
        sql`select set_config('request.jwt.claim.sub', NULL, TRUE)`,
      );
      await tx.execute(sql`reset role`);
    }
  });
});

const sentryMiddleware = t.middleware(async ({ path, type, next, ctx }) => {
  return await Sentry.startSpan(
    {
      name: `trpc:${type}:${path}`,
      op: "trpc.server",
      attributes: { userId: ctx.user?.id ?? "anon" },
    },
    async () => await next(),
  );
});

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure
  .use(sentryMiddleware)
  .use(timingMiddleware)
  .use(transactionMiddleware);

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure
  .use(sentryMiddleware)
  .use(timingMiddleware)
  .use(transactionMiddleware)
  .use(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return await next({
      ctx: {
        // infers the `session` as non-nullable
        session: { ...ctx.session },
        user: ctx.user,
      },
    });
  });
