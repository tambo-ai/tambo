"use server";

import { createSupabaseServerClient } from "@/lib/superbase/server";

export async function saveContact({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Check if contact already exists
  const { data: existingContact } = await supabase
    .from("contacts")
    .select("id")
    .eq("user_id", user.id)
    .eq("email", email)
    .single();

  if (existingContact) {
    return { status: "exists", message: "Contact already exists" };
  }

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      user_id: user.id,
      name,
      email,
    })
    .select()
    .single();

  if (error) {
    console.error("saveContact error:", error);
    throw error;
  }

  return { status: "saved", data };
}