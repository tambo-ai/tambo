ALTER TABLE "projects" ADD COLUMN "legacy_id" text;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_legacy_id_unique" UNIQUE("legacy_id");