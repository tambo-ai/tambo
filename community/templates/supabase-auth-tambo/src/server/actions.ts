"use server";

import { createClient } from "@/lib/supabase/supabase-server";
import {
  createUserProfile,
  getOrCreateProfile,
  getProfileFromDb,
  updateNoteInDb,
} from "./queries";

interface ProfileResult {
  name: string;
  email: string;
  note: string | null;
  lastUpdated?: string;
}

export async function getUserProfileById(
  userId: string,
  email: string,
  name: string,
): Promise<ProfileResult> {
  const profile = await getOrCreateProfile(userId, email, name);

  if (!profile) {
    throw new Error("Failed to get or create profile");
  }

  return {
    name: profile.name || "",
    email: profile.email || "",
    note: profile.note || null,
    lastUpdated: profile.updatedAt?.toISOString(),
  };
}

/**
 * Get the current authenticated user's profile.
 * Reads user from session cookies, safe for client components to call.
 */
export async function getCurrentUserProfile(): Promise<ProfileResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Not authenticated");
  }

  const profile = await getOrCreateProfile(
    user.id,
    user.email || "unknown@example.com",
    user.user_metadata?.name || "User",
  );

  if (!profile) {
    throw new Error("Failed to get or create profile");
  }

  return {
    name: profile.name || "",
    email: profile.email || "",
    note: profile.note || null,
    lastUpdated: profile.updatedAt?.toISOString(),
  };
}

/**
 * Update user note by ID (for use with Tambo tools where cookies aren't available).
 * Auto-creates the profile if it doesn't exist before updating.
 * @returns Updated user profile data.
 */
export async function updateUserNoteById(
  userId: string,
  note: string,
  email?: string,
  name?: string,
): Promise<ProfileResult> {
  // Check if profile exists first
  let profile = await getProfileFromDb(userId);

  // Auto-create profile if it doesn't exist (with fallback values)
  if (!profile) {
    const fallbackEmail = email || "unknown@example.com";
    const fallbackName = name || "User";
    const newProfile = await createUserProfile(
      userId,
      fallbackName,
      fallbackEmail,
    );
    if (!newProfile) {
      throw new Error("Failed to create profile");
    }
    profile = newProfile;
  }

  const updated = await updateNoteInDb(userId, note);

  if (!updated) {
    throw new Error("Failed to update note");
  }

  return {
    name: updated.name || "",
    email: updated.email || "",
    note: updated.note || null,
    lastUpdated: updated.updatedAt?.toISOString(),
  };
}
