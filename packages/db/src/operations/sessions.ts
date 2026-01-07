import { and, eq, gt, sql } from "drizzle-orm";
import * as schema from "../schema";
import type { HydraDb } from "../types";

/**
 * User info returned from session validation
 */
export interface SessionUser {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
}

/**
 * Validate a session token against the database.
 * Returns user info if valid, null if not found or expired.
 *
 * CLI session tokens are high-entropy (256 bits, base64url encoded).
 * They are stored in the unified sessions table with source='cli'.
 *
 * SECURITY:
 * - Sessions must have a non-null expiresAt and not be expired
 * - Tokens should NEVER be logged - they grant full account access
 */
export async function validateSession(
  db: HydraDb,
  sessionToken: string,
): Promise<SessionUser | null> {
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
    return null;
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
