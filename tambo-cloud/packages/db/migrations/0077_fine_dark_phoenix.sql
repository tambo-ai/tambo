CREATE TABLE "mcp_thread_session" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"thread_id" text NOT NULL,
	"tool_provider_id" text NOT NULL,
	"session_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mcp_thread_session_thread_id_tool_provider_id_idx" UNIQUE("thread_id","tool_provider_id")
);
--> statement-breakpoint
ALTER TABLE "mcp_thread_session" ADD CONSTRAINT "mcp_thread_session_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_thread_session" ADD CONSTRAINT "mcp_thread_session_tool_provider_id_tool_providers_id_fk" FOREIGN KEY ("tool_provider_id") REFERENCES "public"."tool_providers"("id") ON DELETE no action ON UPDATE no action;