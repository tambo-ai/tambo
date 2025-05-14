ALTER TABLE "mcp_oauth_clients" DROP CONSTRAINT "mcp_oauth_clients_project_id_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "mcp_oauth_clients" ADD COLUMN "tool_provider_user_context_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "tool_provider_user_contexts" ADD COLUMN "mcp_oauth_client_info" jsonb;--> statement-breakpoint
ALTER TABLE "tool_provider_user_contexts" ADD COLUMN "mcp_oauth_tokens" jsonb;--> statement-breakpoint
ALTER TABLE "tool_provider_user_contexts" ADD COLUMN "mcp_oauth_last_refreshed_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "mcp_oauth_clients" ADD CONSTRAINT "mcp_oauth_clients_tool_provider_user_context_id_tool_provider_user_contexts_id_fk" FOREIGN KEY ("tool_provider_user_context_id") REFERENCES "public"."tool_provider_user_contexts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_oauth_clients" DROP COLUMN "project_id";