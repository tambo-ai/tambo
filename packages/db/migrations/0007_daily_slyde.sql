CREATE TABLE "messages" (
	"id" text PRIMARY KEY DEFAULT generate_custom_id('msg_') NOT NULL,
	"thread_id" text NOT NULL,
	"role" text NOT NULL,
	"content" jsonb NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "messages_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "threads" (
	"id" text PRIMARY KEY DEFAULT generate_custom_id('thr_') NOT NULL,
	"project_id" text NOT NULL,
	"context_key" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "threads_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "threads_context_key_idx" ON "threads" USING btree ("context_key");