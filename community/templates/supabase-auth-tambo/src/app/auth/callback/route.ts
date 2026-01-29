import { createClient as createServerClient } from "@/lib/supabase/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // Handle OAuth errors
  if (error) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", errorDescription || error);
    return NextResponse.redirect(loginUrl);
  }

  if (code) {
    try {
      const supabase = await createServerClient();
      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("error", exchangeError.message);
        return NextResponse.redirect(loginUrl);
      }
    } catch {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "Authentication failed");
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
