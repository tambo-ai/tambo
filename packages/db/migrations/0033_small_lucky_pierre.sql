ALTER TABLE "tool_provider_user_contexts" ADD COLUMN "composio_integration_id" text;--> statement-breakpoint
ALTER TABLE "tool_provider_user_contexts" ADD COLUMN "composio_auth_schema_mode" text;--> statement-breakpoint
ALTER TABLE "tool_provider_user_contexts" ADD COLUMN "composio_auth_fields" jsonb DEFAULT '{}'::jsonb NOT NULL;