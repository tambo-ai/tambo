import { createClient } from "@supabase/supabase-js";

let supabase: ReturnType<typeof createClient>;

export function getSupabaseClient() {
  if (!supabase) {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      throw new Error("Supabase credentials are not provided");
    }

    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }
  return supabase;
}
