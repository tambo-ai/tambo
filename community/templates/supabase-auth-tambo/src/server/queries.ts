"use server";

import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { userProfiles } from "./db/schema";

const UserIdSchema = z.string().uuid("Invalid user ID");

async function setAuthContext(userId: string) {
  const claims = JSON.stringify({ sub: userId, role: "authenticated" });
  await db.execute(
    sql`select set_config('request.jwt.claims', ${claims}, true);`,
  );
}

/**
 * Create a user profile after signup.
 * @returns The created profile or null if already exists.
 */
export async function createUserProfile(
  userId: string,
  name: string,
  email: string,
) {
  const validatedId = UserIdSchema.parse(userId);
  await setAuthContext(validatedId);

  const created = await db
    .insert(userProfiles)
    .values({ id: validatedId, name, email })
    .onConflictDoNothing()
    .returning();

  return created[0] || null;
}

/**
 * Fetch a user's profile by ID.
 * @returns The user profile or null if not found.
 */
export async function getProfileFromDb(userId: string) {
  const validatedId = UserIdSchema.parse(userId);
  await setAuthContext(validatedId);

  const profile = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.id, validatedId))
    .limit(1);

  return profile[0] || null;
}

/**
 * Update a user's note.
 * @returns The updated profile.
 */
export async function updateNoteInDb(
  userId: string,
  note: string,
): Promise<typeof userProfiles.$inferSelect | undefined> {
  const validatedId = UserIdSchema.parse(userId);
  await setAuthContext(validatedId);

  const updated = await db
    .update(userProfiles)
    .set({ note, updatedAt: new Date() })
    .where(eq(userProfiles.id, validatedId))
    .returning();

  return updated[0];
}
