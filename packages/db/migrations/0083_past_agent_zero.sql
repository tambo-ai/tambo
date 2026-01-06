-- Create anon role if it doesn't exist (for Docker/vanilla PostgreSQL)
-- On Supabase, this role already exists as a built-in role
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE "anon" NOLOGIN NOINHERIT; END IF; END $$;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON public.device_auth_codes TO "anon";--> statement-breakpoint
GRANT SELECT ON public.sessions TO "anon";--> statement-breakpoint
ALTER TABLE "device_auth_codes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "device_auth_anon_insert" ON "device_auth_codes" AS PERMISSIVE FOR INSERT TO "anon" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "device_auth_anon_select" ON "device_auth_codes" AS PERMISSIVE FOR SELECT TO "anon" USING (true);--> statement-breakpoint
CREATE POLICY "device_auth_anon_update" ON "device_auth_codes" AS PERMISSIVE FOR UPDATE TO "anon" USING (true);--> statement-breakpoint
CREATE POLICY "device_auth_authenticated_all" ON "device_auth_codes" AS PERMISSIVE FOR ALL TO "authenticated" USING (true);