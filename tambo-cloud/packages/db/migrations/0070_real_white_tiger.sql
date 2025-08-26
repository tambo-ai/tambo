ALTER TABLE "projects" ADD COLUMN "provider_type" text DEFAULT 'llm' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "agent_provider_type" text DEFAULT 'ag-ui' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "agent_url" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "agent_name" text;