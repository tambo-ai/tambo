import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

let _supabaseUrl: string | null = null;
let _supabaseAnonKey: string | null = null;

function getSupabaseConfig() {
  if (!_supabaseUrl) _supabaseUrl = getEnvVar("SUPABASE_URL");
  if (!_supabaseAnonKey) _supabaseAnonKey = getEnvVar("SUPABASE_ANON_KEY");
  return { url: _supabaseUrl, anonKey: _supabaseAnonKey };
}

let _supabase: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> {
  if (!_supabase) {
    const { url, anonKey } = getSupabaseConfig();
    _supabase = createClient<Database>(url, anonKey);
  }
  return _supabase;
}

export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    return Reflect.get(getSupabase(), prop);
  },
});

export function createSupabaseServerClient(
  accessToken?: string,
): SupabaseClient<Database> {
  const { url, anonKey } = getSupabaseConfig();
  return createClient<Database>(url, anonKey, {
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
  });
}
