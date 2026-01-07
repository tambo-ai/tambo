-- Custom SQL migration file for device auth anon role setup
--
-- Creates the 'anon' role for unauthenticated requests (device auth initiation/polling).
-- This is idempotent: on Supabase, 'anon' already exists so this is a no-op.
--
-- We use NOINHERIT as a security best practice to prevent privilege escalation if the
-- role is ever added to another role. This matches Supabase's built-in 'anon' behavior.
--
-- Why not use `pgRole("anon", { inherit: false })` in schema.ts?
-- When pgRole has options, Drizzle generates CREATE ROLE statements in migrations,
-- which fails on Supabase where 'anon' already exists. By using pgRole("anon").existing(),
-- Drizzle treats the role as externally managed and doesn't track it in snapshots.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE "anon" NOINHERIT;
  END IF;
END $$;--> statement-breakpoint
-- Grant permissions for device auth flow (anon can read/write device_auth_codes, read sessions)
GRANT SELECT, INSERT, UPDATE ON public.device_auth_codes TO "anon";--> statement-breakpoint
GRANT SELECT ON public.sessions TO "anon";
