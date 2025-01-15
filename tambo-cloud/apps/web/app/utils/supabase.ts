import { env } from "@/lib/env";
import { createClient } from "@supabase/supabase-js";

let supabase: ReturnType<typeof createClient>;

export function getSupabaseClient() {
  if (!supabase) {
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error("Supabase credentials are not provided");
    }

    supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }
  return supabase;
}
