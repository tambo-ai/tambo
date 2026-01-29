import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return new Response("Email and password are required", { status: 400 });
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    // Handle specific error cases
    if (error.message.includes("rate limit")) {
      return new Response(
        "Too many signup attempts. Please wait a few minutes and try again, or disable email confirmation in Supabase settings.",
        { status: 429 },
      );
    }
    return new Response(error.message, { status: 500 });
  }

  // If email confirmation is disabled, user will be logged in automatically
  // If enabled, they need to check their email
  if (data.user && !data.user.confirmed_at) {
    return new Response("Please check your email to confirm your account.", {
      status: 200,
    });
  }

  return redirect("/signin");
};
