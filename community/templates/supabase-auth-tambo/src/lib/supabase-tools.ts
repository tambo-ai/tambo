import { createClient } from "./supabase-client";

type GetUserProfileInput = Record<string, never>;

interface GetUserProfileOutput {
  name: string;
  email: string;
  note: string | null;
  lastUpdated?: string;
}

interface UpdateUserNoteInput {
  note: string;
}

interface UpdateUserNoteOutput {
  success: boolean;
  message: string;
}

export async function getUserProfile(
  _input: GetUserProfileInput,
): Promise<GetUserProfileOutput> {
  const supabase = createClient();

  // Get current user from session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Not authenticated");
  }

  // Try to fetch existing profile
  const { data, error } = await supabase
    .from("user_profiles")
    .select("name, email, note, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch user profile: ${error.message}`);
  }

  // If no profile exists, create one
  if (!data) {
    const { data: newProfile, error: insertError } = await supabase
      .from("user_profiles")
      .insert({
        id: user.id,
        name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
        email: user.email || "",
        note: null,
      })
      .select("name, email, note, updated_at")
      .single();

    if (insertError) {
      throw new Error(`Failed to create user profile: ${insertError.message}`);
    }

    return {
      name: newProfile.name,
      email: newProfile.email,
      note: newProfile.note,
      lastUpdated: newProfile.updated_at,
    };
  }

  return {
    name: data.name,
    email: data.email,
    note: data.note,
    lastUpdated: data.updated_at,
  };
}

export async function updateUserNote(
  input: UpdateUserNoteInput,
): Promise<UpdateUserNoteOutput> {
  const supabase = createClient();

  // Get current user from session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Not authenticated");
  }

  // Upsert: create if not exists, update if exists
  const { error } = await supabase.from("user_profiles").upsert(
    {
      id: user.id,
      name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
      email: user.email || "",
      note: input.note,
    },
    {
      onConflict: "id",
    },
  );

  if (error) {
    throw new Error(`Failed to update note: ${error.message}`);
  }

  return {
    success: true,
    message: `Note saved: "${input.note}"`,
  };
}
