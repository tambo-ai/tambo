"use server";

import { Resend } from "resend";
import { createSupabaseServerClient } from "@/lib/superbase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

type SendEmailInput = {
  to: string;
  subject: string;
  body: string;
};

export async function sendEmailAndPersist({
  to,
  subject,
  body,
}: SendEmailInput) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }


  await resend.emails.send({
    from: process.env.FROM_EMAIL!,
    to,
    subject,
    html: body.replace(/\n/g, "<br />"),
  });

  const { error } = await supabase.from("emails").insert({
    user_id: user.id,
    to_email: to,
    subject,
    body,
    status: "sent",
  });

  if (error) throw error;

  return { status: "sent" };
}
