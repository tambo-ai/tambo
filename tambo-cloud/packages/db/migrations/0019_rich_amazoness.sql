ALTER TABLE "projects" ADD COLUMN "creator_id" uuid DEFAULT auth.uid();--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
DROP POLICY "project_api_key_policy" ON "projects" CASCADE;--> statement-breakpoint
CREATE POLICY "project_api_key_policy" ON "projects" AS PERMISSIVE FOR SELECT TO "project_api_key" USING ("projects"."id" = current_setting('request.apikey.project_id'));--> statement-breakpoint
ALTER POLICY "project_user_select_policy" ON "projects" TO authenticated USING (
          exists (
            select 1 
            from project_members 
            where project_members.project_id = "projects"."id" 
              and project_members.user_id = (select auth.uid())
          ) or (
            "projects"."creator_id" is not null 
            and "projects"."creator_id" = (select auth.uid())
          )
        );