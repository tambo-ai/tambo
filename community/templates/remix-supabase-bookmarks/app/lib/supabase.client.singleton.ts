import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

declare global {
  interface Window {
    ENV?: {
      SUPABASE_URL: string;
      SUPABASE_ANON_KEY: string;
      TAMBO_API_KEY: string;
    };
  }
}

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
