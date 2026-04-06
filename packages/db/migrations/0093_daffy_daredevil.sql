CREATE TABLE "memories" (
	"id" text PRIMARY KEY DEFAULT generate_custom_id('mem_') NOT NULL,
	"project_id" text NOT NULL,
	"context_key" text NOT NULL,
	"content" text NOT NULL,
	"category" text NOT NULL,
	"importance" integer DEFAULT 3 NOT NULL,
	"superseded_by" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_memories_content_length" CHECK (length("memories"."content") <= 1000),
	CONSTRAINT "chk_memories_importance_range" CHECK ("memories"."importance" >= 1 AND "memories"."importance" <= 5),
	CONSTRAINT "chk_memories_superseded_not_self" CHECK ("memories"."superseded_by" IS NULL OR "memories"."superseded_by" <> "memories"."id")
);
--> statement-breakpoint
ALTER TABLE "memories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "memory_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "memory_tools_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "memories" ADD CONSTRAINT "memories_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memories" ADD CONSTRAINT "memories_superseded_by_fk" FOREIGN KEY ("superseded_by") REFERENCES "public"."memories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "memories_active_project_context_idx" ON "memories" USING btree ("project_id","context_key") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE POLICY "memories_api_key_policy" ON "memories" AS PERMISSIVE FOR ALL TO "project_api_key" USING ("memories"."project_id" = (select current_setting('request.apikey.project_id')));--> statement-breakpoint
CREATE POLICY "memories_user_select_policy" ON "memories" AS PERMISSIVE FOR SELECT TO "authenticated" USING (exists (select 1 from project_members where project_members.project_id = "memories"."project_id" and project_members.user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "memories_user_update_policy" ON "memories" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (select 1 from project_members where project_members.project_id = "memories"."project_id" and project_members.user_id = (select auth.uid())));--> statement-breakpoint
CREATE POLICY "memories_user_delete_policy" ON "memories" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists (select 1 from project_members where project_members.project_id = "memories"."project_id" and project_members.user_id = (select auth.uid())));