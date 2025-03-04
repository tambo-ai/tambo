CREATE ROLE "project_api_key";--> statement-breakpoint
ALTER TABLE "project_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "project_members_user_policy" ON "project_members" AS PERMISSIVE FOR ALL TO "authenticated" USING ("project_members"."user_id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "project_members_api_key_policy" ON "project_members" AS PERMISSIVE FOR ALL TO "project_api_key" USING ("project_members"."project_id" = current_setting('request.apikey.project_id'));--> statement-breakpoint
CREATE POLICY "project_user_policy" ON "projects" AS PERMISSIVE FOR ALL TO "authenticated" USING (exists (select 1 from project_members where project_members.project_id = "projects"."id" and project_members.user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "project_api_key_policy" ON "projects" AS PERMISSIVE FOR ALL TO "project_api_key" USING ("projects"."id" = current_setting('request.apikey.project_id'));