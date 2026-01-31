"use server";

import { createSupabaseServerClient } from "@/lib/superbase/server";

export async function listContacts() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("contacts")
    .select("id, name, email, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listContacts error:", error);
    throw error;
  }

  return data || [];
}