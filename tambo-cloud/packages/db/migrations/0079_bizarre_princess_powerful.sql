ALTER TABLE "mcp_thread_session" DROP CONSTRAINT IF EXISTS "mcp_thread_session_pk";
ALTER TABLE "mcp_thread_session" DROP CONSTRAINT "mcp_thread_session_thread_id_tool_provider_id_idx";--> statement-breakpoint
ALTER TABLE "mcp_thread_session" ALTER COLUMN "session_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "mcp_thread_session" ADD CONSTRAINT "mcp_thread_session_pk" PRIMARY KEY("thread_id","tool_provider_id");--> statement-breakpoint
ALTER TABLE "mcp_thread_session" DROP COLUMN "id";