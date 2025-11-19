CREATE TABLE "mcp_usage" (
	"id" text PRIMARY KEY DEFAULT generate_custom_id('mu_') NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"transport" text,
	"tool_name" text,
	"query" text,
	"response" text,
	"metadata" jsonb,
	CONSTRAINT "mcp_usage_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE INDEX "mcp_usage_created_at_idx" ON "mcp_usage" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "mcp_usage_tool_name_idx" ON "mcp_usage" USING btree ("tool_name");