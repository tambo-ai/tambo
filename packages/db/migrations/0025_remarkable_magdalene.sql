CREATE TABLE "tool_provider_user_contexts" (
	"id" text PRIMARY KEY DEFAULT generate_custom_id('tpu_') NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"context_key" text NOT NULL,
	"tool_provider_id" text NOT NULL,
	CONSTRAINT "tool_provider_user_contexts_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "tool_providers" (
	"id" text PRIMARY KEY DEFAULT generate_custom_id('tp_') NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"project_id" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"type" text NOT NULL,
	"url" text NOT NULL,
	"composio_app_name" text,
	CONSTRAINT "tool_providers_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "tool_provider_user_contexts" ADD CONSTRAINT "tool_provider_user_contexts_tool_provider_id_tool_providers_id_fk" FOREIGN KEY ("tool_provider_id") REFERENCES "public"."tool_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_providers" ADD CONSTRAINT "tool_providers_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "context_tool_providers_context_key_idx" ON "tool_provider_user_contexts" USING btree ("context_key");--> statement-breakpoint
CREATE UNIQUE INDEX "context_tool_providers_context_key_tool_provider_idx" ON "tool_provider_user_contexts" USING btree ("context_key","tool_provider_id");