import { eq, inArray, lt, sql } from "drizzle-orm";
import * as schema from "../schema";
import type { HydraDb } from "../types";

export async function getTamboUser(
  db: HydraDb,
  userId: string,
): Promise<typeof schema.tamboUsers.$inferSelect | undefined> {
  return await db.query.tamboUsers.findFirst({
    where: eq(schema.tamboUsers.userId, userId),
  });
}

export async function updateTamboUser(
  db: HydraDb,
  userId: string,
  data: Partial<typeof schema.tamboUsers.$inferInsert>,
): Promise<typeof schema.tamboUsers.$inferSelect> {
  const existing = await getTamboUser(db, userId);

  if (existing) {
    const [updated] = await db
      .update(schema.tamboUsers)
      .set(data)
      .where(eq(schema.tamboUsers.userId, userId))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(schema.tamboUsers)
    .values({
      userId,
      ...data,
    })
    .returning();
  return created;
}

/**
 * Check if a user has accepted the legal terms.
 */
export async function hasAcceptedLegal(
  db: HydraDb,
  userId: string,
): Promise<{
  accepted: boolean;
  acceptedAt: Date | null;
  version: string | null;
}> {
  const user = await getTamboUser(db, userId);

  return {
    accepted: user?.legalAccepted ?? false,
    acceptedAt: user?.legalAcceptedAt ?? null,
    version: user?.legalVersion ?? null,
  };
}

/**
 * Record that a user has accepted the legal terms.
 */
export async function acceptLegalTerms(
  db: HydraDb,
  userId: string,
  version: string,
): Promise<typeof schema.tamboUsers.$inferSelect> {
  return await updateTamboUser(db, userId, {
    legalAccepted: true,
    legalAcceptedAt: new Date(),
    legalVersion: version,
  });
}

/**
 * Track a welcome email sent to a user.
 */
export async function trackWelcomeEmail(
  db: HydraDb,
  userId: string,
  emailSent: boolean,
  error?: string,
) {
  return await updateTamboUser(db, userId, {
    welcomeEmailSent: emailSent,
    welcomeEmailError: error,
    welcomeEmailSentAt: new Date(),
  });
}

/**
 * Get statistics about welcome emails sent to users.
 */
export async function getWelcomeEmailStats(
  db: HydraDb,
  period: "daily" | "weekly" | "monthly" = "daily",
) {
  const intervalMap = {
    daily: "1 day",
    weekly: "7 days",
    monthly: "30 days",
  };

  const result = await db
    .select({
      total: sql<number>`count(*)`,
      successful: sql<number>`count(*) filter (where welcome_email_sent = true)`,
      failed: sql<number>`count(*) filter (where welcome_email_sent = false)`,
    })
    .from(schema.tamboUsers)
    .where(
      sql`welcome_email_sent_at >= now() - interval '${sql.raw(intervalMap[period])}'`,
    );

  return result[0];
}

export async function getInactiveTamboUsers(
  db: HydraDb,
  inactiveDays: number = 14,
): Promise<
  Array<{
    user: typeof schema.authUsers.$inferSelect;
    tracking: typeof schema.tamboUsers.$inferSelect | undefined;
  }>
> {
  const inactiveDate = new Date();
  inactiveDate.setDate(inactiveDate.getDate() - inactiveDays);

  const users = await db.query.authUsers.findMany({
    where: lt(schema.authUsers.createdAt, inactiveDate),
  });

  if (users.length === 0) {
    return [];
  }

  const userIds = users.map((u) => u.id);
  const trackings = await db
    .select()
    .from(schema.tamboUsers)
    .where(inArray(schema.tamboUsers.userId, userIds));

  const trackingByUserId = new Map(trackings.map((t) => [t.userId, t]));

  const results: Array<{
    user: typeof schema.authUsers.$inferSelect;
    tracking: typeof schema.tamboUsers.$inferSelect | undefined;
  }> = [];

  for (const user of users) {
    const tracking = trackingByUserId.get(user.id);
    if (
      !tracking ||
      tracking.lastActivityAt < inactiveDate ||
      !tracking.deprecatedHasSetupProject
    ) {
      results.push({ user, tracking });
    }
  }

  return results;
}

export async function getInactiveUsersWithProjects(
  db: HydraDb,
  inactiveDays: number = 14,
) {
  const inactiveDate = new Date();
  inactiveDate.setDate(inactiveDate.getDate() - inactiveDays);

  const users = await db.query.authUsers.findMany({
    where: lt(schema.authUsers.createdAt, inactiveDate),
    with: {
      projects: {
        with: {
          project: true,
        },
      },
    },
  });

  return users;
}

/**
 * Validate user for welcome email and return all necessary data in one query
 */
export async function validateUserForWelcomeEmail(
  db: HydraDb,
  userId: string,
  expectedEmail: string,
): Promise<{
  isValid: boolean;
  alreadySent: boolean;
  error?: string;
}> {
  const result = await db
    .select({
      authEmail: schema.authUsers.email,
      welcomeEmailSent: schema.tamboUsers.welcomeEmailSent,
    })
    .from(schema.authUsers)
    .leftJoin(
      schema.tamboUsers,
      eq(schema.authUsers.id, schema.tamboUsers.userId),
    )
    .where(eq(schema.authUsers.id, userId))
    .limit(1);

  if (result.length === 0) {
    return { isValid: false, alreadySent: false, error: "User not found" };
  }

  const [row] = result;

  if (row.authEmail !== expectedEmail) {
    return { isValid: false, alreadySent: false, error: "Email mismatch" };
  }

  return {
    isValid: true,
    alreadySent: row.welcomeEmailSent === true,
  };
}
