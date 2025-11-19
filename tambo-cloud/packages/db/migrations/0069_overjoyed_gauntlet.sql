ALTER TABLE "tambo_users" DROP CONSTRAINT "tambo_users_project_id_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "tambo_users" DROP COLUMN "project_id";