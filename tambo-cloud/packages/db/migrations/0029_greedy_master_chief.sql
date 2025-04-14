CREATE TABLE "project_message_usage" (
	"project_id" text NOT NULL,
	"message_count" integer DEFAULT 0 NOT NULL,
	"has_api_key" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_message_usage" ADD CONSTRAINT "project_message_usage_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;