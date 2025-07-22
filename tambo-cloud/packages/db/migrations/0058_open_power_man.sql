CREATE TABLE "user_lifecycle_tracking" (
	"id" text PRIMARY KEY DEFAULT generate_custom_id('ult_') NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" text,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reactivation_email_sent_at" timestamp with time zone,
	"reactivation_email_count" integer DEFAULT 0 NOT NULL,
	"has_setup_project" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_lifecycle_tracking_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "project_message_usage" ADD COLUMN "first_message_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_lifecycle_tracking" ADD CONSTRAINT "user_lifecycle_tracking_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_lifecycle_tracking" ADD CONSTRAINT "user_lifecycle_tracking_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_user_lifecycle_tracking_user_id" ON "user_lifecycle_tracking" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_lifecycle_tracking_last_activity" ON "user_lifecycle_tracking" USING btree ("last_activity_at");--> statement-breakpoint
CREATE INDEX "idx_user_lifecycle_tracking_reactivation_sent" ON "user_lifecycle_tracking" USING btree ("reactivation_email_sent_at");