interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly PUBLIC_TAMBO_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
