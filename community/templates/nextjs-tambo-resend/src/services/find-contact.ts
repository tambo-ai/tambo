"use server";

import { createSupabaseServerClient } from "@/lib/superbase/server";

export async function findContactByName(name: string) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Search for contact by name (case-insensitive)
  const { data, error } = await supabase
    .from("contacts")
    .select("id, name, email, created_at")
    .eq("user_id", user.id)
    .ilike("name", `%${name}%`)
    .limit(5);

  if (error) {
    console.error("findContactByName error:", error);
    throw error;
  }

  return data || [];
}

export async function findContactByEmail(email: string) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Search for contact by email
  const { data, error } = await supabase
    .from("contacts")
    .select("id, name, email, created_at")
    .eq("user_id", user.id)
    .eq("email", email)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "no rows returned"
    console.error("findContactByEmail error:", error);
    throw error;
  }

  return data || null;
}
