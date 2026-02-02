import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseClient(url?: string, anonKey?: string) {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (!url || !anonKey) {
    throw new Error("Supabase URL and Anon Key are required");
  }

  supabaseClient = createClient<Database>(url, anonKey);
  return supabaseClient;
}
