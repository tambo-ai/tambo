"use server";

import { createSupabaseServerClient } from "@/lib/superbase/server";

export async function saveEmailDraft({
  to,
  subject,
  body,
}: {
  to: string;
  subject: string;
  body: string;
}) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("emails").insert({
    user_id: user.id,
    to_email: to,
    subject,
    body,
    status: "draft",
  });

  if (error) throw error;

  return { status: "draft" };
}