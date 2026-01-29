import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = window.ENV?.SUPABASE_URL ?? "";
const supabaseAnonKey = window.ENV?.SUPABASE_ANON_KEY ?? "";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

declare global {
  interface Window {
    ENV?: {
      SUPABASE_URL: string;
      SUPABASE_ANON_KEY: string;
      TAMBO_API_KEY: string;
    };
  }
}
