"use server";

import { createSupabaseServerClient } from "@/lib/superbase/server";

export async function listEmails(status?: "draft" | "sent") {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  let query = supabase
    .from("emails")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map((email) => ({
    id: email.id,
    to: email.to_email, 
    subject: email.subject,
    body: email.body,
    status: email.status as "sent" | "draft",
    createdAt: email.created_at,
  }));
}