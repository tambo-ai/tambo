ALTER TABLE "threads" ADD COLUMN "generation_stage" text DEFAULT 'IDLE' NOT NULL;--> statement-breakpoint
ALTER TABLE "threads" ADD COLUMN "status_message" text;