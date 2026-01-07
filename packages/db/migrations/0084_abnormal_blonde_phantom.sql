ALTER TABLE "device_auth_codes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "device_auth_anon_insert" ON "device_auth_codes" AS PERMISSIVE FOR INSERT TO "anon" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "device_auth_anon_select" ON "device_auth_codes" AS PERMISSIVE FOR SELECT TO "anon" USING (true);--> statement-breakpoint
CREATE POLICY "device_auth_anon_update" ON "device_auth_codes" AS PERMISSIVE FOR UPDATE TO "anon" USING (true);--> statement-breakpoint
CREATE POLICY "device_auth_authenticated_all" ON "device_auth_codes" AS PERMISSIVE FOR ALL TO "authenticated" USING (true);