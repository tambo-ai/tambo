ALTER TABLE "memories" DROP CONSTRAINT "chk_memories_superseded_not_self";--> statement-breakpoint
ALTER TABLE "memories" DROP CONSTRAINT "memories_superseded_by_fk";
--> statement-breakpoint
ALTER TABLE "memories" DROP COLUMN "superseded_by";--> statement-breakpoint
CREATE POLICY "memories_user_insert_policy" ON "memories" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (select 1 from project_members where project_members.project_id = "memories"."project_id" and project_members.user_id = (select auth.uid())));