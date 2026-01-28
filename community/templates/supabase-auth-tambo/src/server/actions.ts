"use server";

import { createClient } from "@/lib/supabase/supabase-server";
import { createUserProfile, getProfileFromDb, updateNoteInDb } from "./queries";

interface ProfileResult {
  name: string;
  email: string;
  note: string | null;
  lastUpdated?: string;
}

/**
 * Fetch user profile by ID (for use with Tambo tools where cookies aren't available).
 * Auto-creates the profile if it doesn't exist.
 * @returns User profile data including name, email, and note.
 */
export async function getUserProfileById(
  userId: string,
  email: string,
  name: string,
): Promise<ProfileResult> {
  let profile = await getProfileFromDb(userId);

  if (!profile) {
    // Auto-create profile if it doesn't exist
    const newProfile = await createUserProfile(userId, name, email);
    if (!newProfile) {
      throw new Error("Failed to create profile");
    }
    profile = newProfile;
  }

  return {
    name: profile.name || "",
    email: profile.email || "",
    note: profile.note || null,
    lastUpdated: profile.updatedAt?.toISOString(),
  };
}

/**
 * Fetch the authenticated user's profile using cookies.
 * @returns User profile data including name, email, and note.
 */
export async function getUserProfile(): Promise<ProfileResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Not authenticated");
  }

  let profile = await getProfileFromDb(user.id);

  if (!profile) {
    // Auto-create profile if it doesn't exist (handles users who signed up before db:init)
    const newProfile = await createUserProfile(
      user.id,
      user.user_metadata?.name || user.email?.split("@")[0] || "User",
      user.email!,
    );

    if (!newProfile) {
      throw new Error(
        "Failed to create profile. Please contact support or try again.",
      );
    }

    profile = newProfile;
  }

  return {
    name: profile.name || "",
    email: profile.email || "",
    note: profile.note || null,
    lastUpdated: profile.updatedAt?.toISOString(),
  };
}

/**
 * Update the user's personal note.
 * @returns Updated user profile data.
 */
export async function updateUserNote(input: { note: string }): Promise<{
  name: string;
  email: string;
  note: string | null;
  lastUpdated?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Not authenticated");
  }

  const updated = await updateNoteInDb(user.id, input.note);

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
