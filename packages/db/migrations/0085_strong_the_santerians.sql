ALTER TABLE "threads" ADD COLUMN "run_status" text DEFAULT 'idle' NOT NULL;--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "current_run_id" text;--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "pending_tool_call_ids" jsonb;--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "processed_tool_call_ids" jsonb;