CREATE TABLE if not exists "mcp_thread_session" (
	"thread_id" text NOT NULL,
	"tool_provider_id" text NOT NULL,
	"session_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mcp_thread_session_pk" PRIMARY KEY("thread_id","tool_provider_id")
);
--> statement-breakpoint
ALTER TABLE "mcp_thread_session" DROP CONSTRAINT IF EXISTS "mcp_thread_session_thread_id_threads_id_fk";
ALTER TABLE "mcp_thread_session" DROP CONSTRAINT IF EXISTS "mcp_thread_session_tool_provider_id_tool_providers_id_fk";
ALTER TABLE "mcp_thread_session" ADD CONSTRAINT "mcp_thread_session_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "mcp_thread_session" ADD CONSTRAINT "mcp_thread_session_tool_provider_id_tool_providers_id_fk" FOREIGN KEY ("tool_provider_id") REFERENCES "public"."tool_providers"("id") ON DELETE cascade ON UPDATE cascade;