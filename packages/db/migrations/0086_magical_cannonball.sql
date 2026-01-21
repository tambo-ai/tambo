CREATE TABLE "runs" (
	"id" text PRIMARY KEY DEFAULT generate_custom_id('run_') NOT NULL,
	"thread_id" text NOT NULL,
	"status" text DEFAULT 'waiting' NOT NULL,
	"status_message" text,
	"error_code" text,
	"error_message" text,
	"pending_tool_call_ids" jsonb,
	"previous_run_id" text,
	"model" text,
	"request_params" jsonb,
	"metadata" jsonb,
	"is_cancelled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "runs_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "runs" ADD CONSTRAINT "runs_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "runs_thread_id_idx" ON "runs" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "runs_status_idx" ON "runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "runs_created_at_idx" ON "runs" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_current_run_id_fk" FOREIGN KEY ("current_run_id") REFERENCES "public"."runs"("id") ON DELETE set null ON UPDATE no action;